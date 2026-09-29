// RoadReady "manage-users" Edge Function.
//
// This is the ONLY place that ever touches the service_role key. The desktop
// app calls this function (with the caller's own session JWT) to create or
// delete accounts; it never talks to the Admin API directly, so service_role
// never has to leave Supabase's own infrastructure.
//
// Deploy with the Supabase CLI (`supabase functions deploy manage-users`) or
// paste this file into Dashboard -> Edge Functions -> New Function. Supabase
// automatically provides SUPABASE_URL, SUPABASE_ANON_KEY and
// SUPABASE_SERVICE_ROLE_KEY as env vars to every Edge Function — no extra
// secrets need to be configured.

import { createClient } from "jsr:@supabase/supabase-js@2";

const MAX_USERS_PER_SUPERVISOR = 10;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ ok: false, error: "Λείπει η σύνδεση." }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Acting as the caller, purely to find out who they are.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: callerErr } = await callerClient.auth.getUser();
    if (callerErr || !caller) return json({ ok: false, error: "Μη έγκυρη σύνδεση." }, 401);

    // Privileged client — service_role, never exposed past this function.
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: callerProfile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", caller.id)
      .single();

    if (!callerProfile || (callerProfile.role !== "admin" && callerProfile.role !== "supervisor")) {
      return json({ ok: false, error: "Δεν έχεις δικαίωμα για αυτή την ενέργεια." }, 403);
    }

    const body = await req.json();

    if (body.action === "create") {
      const username = (body.username || "").trim();
      const password = body.password || "";
      if (!username || password.length < 6) {
        return json({ ok: false, error: "Χρειάζεται όνομα χρήστη και κωδικός τουλάχιστον 6 χαρακτήρων." }, 400);
      }

      let targetRole: "supervisor" | "user" = "user";
      let targetSupervisorId: string | null = null;

      if (callerProfile.role === "admin") {
        targetRole = body.role === "supervisor" ? "supervisor" : "user";
        targetSupervisorId = targetRole === "user" ? (body.supervisorId || null) : null;
        if (targetSupervisorId) {
          const { data: sup } = await admin.from("profiles").select("role").eq("id", targetSupervisorId).single();
          if (!sup || sup.role !== "supervisor") {
            return json({ ok: false, error: "Άκυρος επόπτης." }, 400);
          }
        }
      } else {
        // Supervisor: can only create plain users under themselves.
        targetRole = "user";
        targetSupervisorId = caller.id;
      }

      if (targetSupervisorId) {
        const { count } = await admin
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("supervisor_id", targetSupervisorId);
        if ((count || 0) >= MAX_USERS_PER_SUPERVISOR) {
          return json({ ok: false, error: `Έχει ήδη φτάσει το όριο των ${MAX_USERS_PER_SUPERVISOR} χρηστών.` }, 400);
        }
      }

      const email = `${username.toLowerCase()}@roadready.local`;
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username },
      });
      if (createErr || !created.user) {
        return json({ ok: false, error: createErr?.message || "Αποτυχία δημιουργίας χρήστη." }, 400);
      }

      const { error: profileErr } = await admin.from("profiles").insert({
        id: created.user.id,
        username,
        role: targetRole,
        supervisor_id: targetSupervisorId,
      });
      if (profileErr) {
        await admin.auth.admin.deleteUser(created.user.id);
        return json({ ok: false, error: profileErr.message }, 400);
      }

      return json({ ok: true, id: created.user.id, username, role: targetRole });
    }

    if (body.action === "update") {
      const userId = body.userId;
      const username = (body.username || "").trim();
      const password = body.password || "";
      if (!userId || !username) {
        return json({ ok: false, error: "Λείπουν στοιχεία." }, 400);
      }
      if (password && password.length < 6) {
        return json({ ok: false, error: "Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες." }, 400);
      }

      const { data: target } = await admin.from("profiles").select("*").eq("id", userId).single();
      if (!target) return json({ ok: false, error: "Δεν βρέθηκε." }, 404);

      if (callerProfile.role === "supervisor") {
        if (target.supervisor_id !== caller.id || target.role !== "user") {
          return json({ ok: false, error: "Δεν έχεις δικαίωμα να επεξεργαστείς αυτόν τον χρήστη." }, 403);
        }
      }

      if (username.toLowerCase() !== target.username.toLowerCase()) {
        const { data: existing } = await admin
          .from("profiles")
          .select("id")
          .ilike("username", username)
          .neq("id", userId)
          .maybeSingle();
        if (existing) return json({ ok: false, error: "Αυτό το όνομα χρήστη υπάρχει ήδη." }, 400);
      }

      const email = `${username.toLowerCase()}@roadready.local`;
      const updatePayload: Record<string, unknown> = { email, user_metadata: { username } };
      if (password) updatePayload.password = password;

      const { error: updErr } = await admin.auth.admin.updateUserById(userId, updatePayload);
      if (updErr) return json({ ok: false, error: updErr.message }, 400);

      const { error: profileErr } = await admin.from("profiles").update({ username }).eq("id", userId);
      if (profileErr) return json({ ok: false, error: profileErr.message }, 400);

      return json({ ok: true });
    }

    if (body.action === "delete") {
      const userId = body.userId;
      if (!userId) return json({ ok: false, error: "Λείπει ο χρήστης." }, 400);

      const { data: target } = await admin.from("profiles").select("*").eq("id", userId).single();
      if (!target) return json({ ok: false, error: "Δεν βρέθηκε." }, 404);

      if (callerProfile.role === "supervisor") {
        if (target.supervisor_id !== caller.id || target.role !== "user") {
          return json({ ok: false, error: "Δεν έχεις δικαίωμα να διαγράψεις αυτόν τον χρήστη." }, 403);
        }
      } else if (target.id === caller.id) {
        return json({ ok: false, error: "Δεν μπορείς να διαγράψεις τον εαυτό σου." }, 400);
      }

      const { error: delErr } = await admin.auth.admin.deleteUser(userId);
      if (delErr) return json({ ok: false, error: delErr.message }, 400);

      return json({ ok: true });
    }

    return json({ ok: false, error: "Άγνωστη ενέργεια." }, 400);
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});
