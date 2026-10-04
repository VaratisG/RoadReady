/* Browser stand-in for the desktop app's Python backend (app/main.py).
 * The frontend calls window.pywebview.api.*; here the same methods are
 * implemented on top of supabase-js plus static JSON files, so app.js runs
 * unchanged. Included only in the web build (see web/build_web.py). */
(function () {
  var SUPABASE_URL = 'https://nzuobxttcvdqqzsmcgmv.supabase.co';
  // Public anon key, same as the desktop app: Row Level Security protects the data.
  var SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6' +
    'Im56dW9ieHR0Y3ZkcXF6c21jZ212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2MjI0' +
    'MTUsImV4cCI6MjEwNjE5ODQxNX0.o8MnYYpa4y5fWxBOGc6hC6yDbmxu5IIO4MlErXuiuA4';
  var SUPABASE_JS_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
  var USERNAME_EMAIL_DOMAIN = 'roadready.local';

  var root = document.documentElement;
  root.classList.add('web');

  // Phones report 100vh as the height with the address bar collapsed, which
  // pushes the footer off-screen. window.innerHeight is the truly visible height.
  function setAppHeight() {
    root.style.setProperty('--app-h', Math.round(window.innerHeight) + 'px');
  }
  setAppHeight();
  window.addEventListener('resize', setAppHeight);
  window.addEventListener('orientationchange', setAppHeight);

  // A saved session means app.js is about to sign the user in again, so keep
  // the login form hidden meanwhile instead of flashing it.
  var SESSION_STORAGE_KEY = 'sb-nzuobxttcvdqqzsmcgmv-auth-token';
  try {
    if (localStorage.getItem(SESSION_STORAGE_KEY)) {
      root.classList.add('restoring');
      setTimeout(function () { root.classList.remove('restoring'); }, 8000);
    }
  } catch (e) {}

  var clientPromise = null;
  function getClient() {
    if (clientPromise) return clientPromise;
    clientPromise = new Promise(function (resolve, reject) {
      function make() {
        resolve(window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: SESSION_STORAGE_KEY }
        }));
      }
      if (window.supabase && window.supabase.createClient) return make();
      var s = document.createElement('script');
      s.src = SUPABASE_JS_URL;
      s.onload = make;
      s.onerror = function () { clientPromise = null; reject(new Error('Could not load supabase-js')); };
      document.head.appendChild(s);
    });
    return clientPromise;
  }

  function usernameToEmail(username) {
    return String(username || '').trim().toLowerCase() + '@' + USERNAME_EMAIL_DOMAIN;
  }

  function unwrap(res) {
    if (res.error) throw res.error;
    return res.data;
  }

  var dataCache = {};
  function loadJson(path) {
    if (!dataCache[path]) {
      dataCache[path] = fetch(path).then(function (r) {
        if (!r.ok) throw new Error('Failed to load ' + path);
        return r.json();
      }).catch(function (e) { delete dataCache[path]; throw e; });
    }
    return dataCache[path];
  }
  function loadMeta() { return loadJson('data/meta.json'); }
  function loadQuestions(vehicle) { return loadJson('data/questions_' + vehicle + '.json'); }

  function questionsById(vehicle) {
    return loadQuestions(vehicle).then(function (list) {
      var map = {};
      list.forEach(function (q) { map[q.id] = q; });
      return map;
    });
  }

  function sample(list, n) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a.slice(0, n);
  }

  function pct(correct, total) {
    return total ? Math.round((correct / total) * 100) : null;
  }

  function aggregateByVehicle(rows) {
    var totals = {};
    rows.forEach(function (r) {
      var agg = totals[r.vehicle] || (totals[r.vehicle] = { count: 0, correct: 0, total: 0 });
      agg.count += 1;
      agg.correct += r.correct;
      agg.total += r.total;
    });
    return totals;
  }

  function invokeManageUsers(body) {
    return getClient().then(function (sb) {
      return sb.functions.invoke('manage-users', { body: body });
    }).then(function (res) {
      if (!res.error) return res.data;
      var ctx = res.error.context;
      if (ctx && typeof ctx.json === 'function') {
        return ctx.json().catch(function () { return { ok: false, error: String(res.error.message || res.error) }; });
      }
      return { ok: false, error: String(res.error.message || res.error) };
    }).catch(function (e) {
      return { ok: false, error: String((e && e.message) || e) };
    });
  }

  var api = {
    get_app_version: function () { return Promise.resolve('web'); },

    check_for_update: function () { return Promise.resolve({ ok: false }); },

    sign_in: function (username, password) {
      return getClient().then(function (sb) {
        return sb.auth.signInWithPassword({ email: usernameToEmail(username), password: password }).then(function (res) {
          if (res.error) {
            var invalid = res.error.code === 'invalid_credentials' || /invalid login credentials/i.test(res.error.message || '');
            return { ok: false, error: invalid ? 'invalid_credentials' : String(res.error.message || res.error) };
          }
          var user = res.data.user;
          return sb.from('profiles').select('*').eq('id', user.id).single().then(function (p) {
            return {
              ok: true,
              username: (user.user_metadata && user.user_metadata.username) || username,
              role: p.data ? p.data.role : 'user'
            };
          });
        });
      }).catch(function (e) {
        return { ok: false, error: String((e && e.message) || e) };
      });
    },

    restore_session: function () {
      function done(result) {
        root.classList.remove('restoring');
        return result;
      }
      return getClient().then(function (sb) {
        return sb.auth.getSession().then(function (s) {
          if (!s.data.session) return { ok: false };
          return sb.auth.getUser().then(function (u) {
            if (u.error || !u.data.user) {
              return sb.auth.signOut().catch(function () {}).then(function () { return { ok: false }; });
            }
            return sb.from('profiles').select('*').eq('id', u.data.user.id).single().then(function (p) {
              return {
                ok: true,
                username: (u.data.user.user_metadata && u.data.user.user_metadata.username) || (p.data && p.data.username) || '',
                role: p.data ? p.data.role : 'user'
              };
            });
          });
        });
      }).then(done, function () { return done({ ok: false }); });
    },

    sign_out: function () {
      return getClient().then(function (sb) { return sb.auth.signOut(); }).catch(function () {}).then(function () { return true; });
    },

    change_password: function (newPassword) {
      return getClient().then(function (sb) {
        return sb.auth.updateUser({ password: newPassword });
      }).then(function (res) {
        return res.error ? { ok: false, error: String(res.error.message || res.error) } : { ok: true };
      }).catch(function (e) {
        return { ok: false, error: String((e && e.message) || e) };
      });
    },

    list_users: function () {
      return getClient().then(function (sb) {
        return sb.from('profiles').select('id, username, role, supervisor_id');
      }).then(function (res) {
        var data = unwrap(res);
        var byId = {};
        data.forEach(function (p) { byId[p.id] = p.username; });
        return data.map(function (p) {
          return {
            id: p.id,
            username: p.username,
            role: p.role,
            supervisorId: p.supervisor_id,
            supervisorUsername: byId[p.supervisor_id] || null
          };
        });
      });
    },

    get_admin_analytics: function () {
      return Promise.all([getClient(), loadMeta()]).then(function (r) {
        var sb = r[0], meta = r[1];
        return Promise.all([
          sb.from('profiles').select('id, username, role, supervisor_id'),
          sb.from('attempts').select('user_id, vehicle, correct, total, completed_at').order('completed_at', { ascending: false })
        ]).then(function (res) {
          var profiles = unwrap(res[0]);
          var attempts = unwrap(res[1]);
          var vLabel = function (v) { return meta.vehicleLabels[v] || v; };

          var profileById = {};
          profiles.forEach(function (p) { profileById[p.id] = p; });
          var roleCounts = { admin: 0, supervisor: 0, user: 0 };
          profiles.forEach(function (p) { roleCounts[p.role] = (roleCounts[p.role] || 0) + 1; });

          var totalCorrect = 0, totalQuestions = 0;
          attempts.forEach(function (a) { totalCorrect += a.correct; totalQuestions += a.total; });

          var perVehicle = aggregateByVehicle(attempts);
          var byVehicle = Object.keys(perVehicle).map(function (v) {
            var agg = perVehicle[v];
            return { vehicle: v, label: vLabel(v), attemptCount: agg.count, avgPercent: pct(agg.correct, agg.total) };
          });

          function teamStats(ids) {
            var team = attempts.filter(function (a) { return ids.has(a.user_id); });
            var c = 0, t = 0;
            team.forEach(function (a) { c += a.correct; t += a.total; });
            return { userCount: ids.size, attemptCount: team.length, avgPercent: pct(c, t) };
          }

          var bySupervisor = profiles.filter(function (p) { return p.role === 'supervisor'; }).map(function (sup) {
            var ids = new Set(profiles.filter(function (p) { return p.supervisor_id === sup.id; }).map(function (p) { return p.id; }));
            var stats = teamStats(ids);
            stats.id = sup.id;
            stats.username = sup.username;
            return stats;
          });

          var directIds = new Set(profiles.filter(function (p) { return p.role === 'user' && !p.supervisor_id; }).map(function (p) { return p.id; }));

          return {
            userCounts: roleCounts,
            attemptCount: attempts.length,
            overallPercent: pct(totalCorrect, totalQuestions),
            byVehicle: byVehicle,
            bySupervisor: bySupervisor,
            directUsers: teamStats(directIds),
            recent: attempts.slice(0, 20).map(function (a) {
              var p = profileById[a.user_id];
              return {
                username: p ? p.username : '—',
                vehicle: vLabel(a.vehicle),
                correct: a.correct,
                total: a.total,
                completedAt: a.completed_at
              };
            })
          };
        });
      });
    },

    create_user: function (username, password, role, supervisorId) {
      return invokeManageUsers({ action: 'create', username: username, password: password, role: role || null, supervisorId: supervisorId || null });
    },
    delete_user: function (userId) {
      return invokeManageUsers({ action: 'delete', userId: userId });
    },
    update_user: function (userId, username, password) {
      return invokeManageUsers({ action: 'update', userId: userId, username: username, password: password || null });
    },

    get_vehicles: function () {
      return loadMeta().then(function (meta) {
        return Object.keys(meta.vehicleLabels).map(function (id) {
          return { id: id, label: meta.vehicleLabels[id], labelEn: meta.vehicleLabelsEn[id] || meta.vehicleLabels[id] };
        });
      });
    },

    get_sections: function (vehicle) {
      return Promise.all([loadMeta(), loadQuestions(vehicle)]).then(function (r) {
        var meta = r[0], questions = r[1];
        var icons = meta.categoryIcons[vehicle] || {};
        var counts = {}, order = [];
        questions.forEach(function (q) {
          if (!(q.category in counts)) { counts[q.category] = 0; order.push(q.category); }
          counts[q.category] += 1;
        });
        var sections = [{
          id: 'all',
          label: 'Προσομοίωση Εξέτασης',
          labelEn: 'Exam Simulation',
          count: Math.min(meta.simulationSize, questions.length),
          icon: null
        }];
        order.forEach(function (category) {
          sections.push({
            id: category,
            label: category,
            labelEn: meta.categoryLabelsEn[category] || category,
            count: counts[category],
            icon: icons[category] === undefined ? null : icons[category]
          });
        });
        return sections;
      });
    },

    get_questions: function (vehicle, sectionId, count) {
      return Promise.all([loadMeta(), loadQuestions(vehicle)]).then(function (r) {
        var meta = r[0], questions = r[1];
        if (sectionId === 'all') {
          return sample(questions, Math.min(count || meta.simulationSize, questions.length));
        }
        return questions.filter(function (q) { return q.category === sectionId; });
      });
    },

    save_attempt: function (vehicle, sectionId, sectionLabel, correct, total) {
      return getClient().then(function (sb) {
        return sb.from('attempts').insert({
          vehicle: vehicle,
          section_id: sectionId,
          section_label: sectionLabel,
          correct: correct,
          total: total
        });
      }).then(unwrap);
    },

    get_history: function (limit) {
      return getClient().then(function (sb) {
        return sb.from('attempts')
          .select('vehicle, section_id, section_label, correct, total, completed_at')
          .order('id', { ascending: false })
          .limit(limit || 20);
      }).then(function (res) {
        return unwrap(res).map(function (r) {
          return {
            vehicle: r.vehicle,
            sectionId: r.section_id,
            sectionLabel: r.section_label,
            correct: r.correct,
            total: r.total,
            completedAt: r.completed_at
          };
        });
      });
    },

    get_stats: function () {
      return getClient().then(function (sb) {
        return sb.from('attempts').select('vehicle, correct, total');
      }).then(function (res) {
        var rows = unwrap(res);
        var correctSum = 0, totalSum = 0;
        rows.forEach(function (r) { correctSum += r.correct; totalSum += r.total; });
        var perVehicle = aggregateByVehicle(rows);
        return {
          attemptCount: rows.length,
          avgPercent: pct(correctSum, totalSum),
          perVehicle: Object.keys(perVehicle).map(function (v) {
            return { vehicle: v, attemptCount: perVehicle[v].count, avgPercent: pct(perVehicle[v].correct, perVehicle[v].total) };
          })
        };
      });
    },

    record_quiz_results: function (vehicle, results) {
      return getClient().then(function (sb) {
        var right = results.filter(function (r) { return r.correct; }).map(function (r) { return r.id; });
        var wrong = results.filter(function (r) { return !r.correct; }).map(function (r) {
          return { vehicle: vehicle, question_id: r.id, category: r.category || '' };
        });
        var jobs = [];
        if (right.length) {
          jobs.push(sb.from('wrong_questions').delete().eq('vehicle', vehicle).in('question_id', right));
        }
        if (wrong.length) {
          jobs.push(sb.from('wrong_questions').upsert(wrong, { onConflict: 'user_id,vehicle,question_id', ignoreDuplicates: true }));
        }
        return Promise.all(jobs);
      }).then(function (all) { all.forEach(unwrap); });
    },

    get_wrong_count: function (vehicle) {
      return getClient().then(function (sb) {
        return sb.from('wrong_questions').select('id', { count: 'exact', head: true }).eq('vehicle', vehicle);
      }).then(function (res) {
        if (res.error) throw res.error;
        return res.count || 0;
      });
    },

    get_wrong_questions: function (vehicle) {
      return listQuestionsFromTable('wrong_questions', vehicle);
    },

    save_question: function (vehicle, questionId, category) {
      return getClient().then(function (sb) {
        return sb.from('saved_questions').upsert(
          { vehicle: vehicle, question_id: questionId, category: category },
          { onConflict: 'user_id,vehicle,question_id', ignoreDuplicates: true }
        );
      }).then(unwrap);
    },

    unsave_question: function (vehicle, questionId) {
      return getClient().then(function (sb) {
        return sb.from('saved_questions').delete().eq('vehicle', vehicle).eq('question_id', questionId);
      }).then(unwrap);
    },

    get_saved_questions: function (vehicle) {
      return listQuestionsFromTable('saved_questions', vehicle);
    }
  };

  function listQuestionsFromTable(table, vehicle) {
    return Promise.all([
      getClient().then(function (sb) {
        return sb.from(table).select('question_id').eq('vehicle', vehicle).order('id', { ascending: false });
      }),
      questionsById(vehicle)
    ]).then(function (r) {
      var rows = unwrap(r[0]);
      var byId = r[1];
      return rows.filter(function (row) { return byId[row.question_id]; }).map(function (row) { return byId[row.question_id]; });
    });
  }

  window.pywebview = { api: api };

  window.addEventListener('load', function () {
    window.dispatchEvent(new Event('pywebviewready'));
  });
})();
