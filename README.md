# RoadReady

A Greek-language driving theory quiz app for Windows, covering both car
(Category B) and motorcycle/truck/bus/professional-certificate licenses.
Built as a single self-contained `.exe` — no installer, nothing to configure.
Requires an internet connection and a signed-in account, since progress,
mistakes, and saved questions sync to a Supabase backend.

## Features

- **Five license categories**: Αυτοκίνητο (car), Μοτοσικλέτα (motorcycle),
  Φορτηγό (truck), Λεωφορείο (bus), and ΠΕΙ Φορτηγό (truck driver
  professional-competence certificate) — 1,800+ real theory questions across
  all of them, each with real sign/diagram images and category icons.
- **Exam simulation** with configurable question count (20/30/40), an
  optional countdown timer, and a choice between immediate answer feedback
  or a full review at the end.
- **Account sign-in** — username/password authentication via Supabase Auth
  (each username maps to a synthetic, never-emailed address under the hood).
  There's no self-signup: accounts are created by an admin or supervisor from
  the in-app "Χρήστες" (Users) screen. Three roles: **admin** (sees and manages
  everyone), **supervisor** (driving school — manages up to 10 of their own
  users), and **user** (regular quiz-taker, under a supervisor or directly
  under the admin). Each account's data is isolated with Row Level Security.
- **Progress tracking** — every completed quiz is saved to your account, with
  a summary screen showing your overall average, per-vehicle breakdown, and
  recent attempt history. Syncs across installs/machines under the same login.
- **Mistakes practice** — a per-vehicle "Εξάσκηση σε Λάθη" mode unlocks once
  you've missed 5+ questions, quizzing you on exactly those until you get them
  right again.
- **Saved questions** — flag any question during a quiz and revisit it later
  from a per-vehicle saved list.
- **Light/dark theme** (or follow the system setting), with the native
  Windows title bar recoloring to match.
- **Adjustable text size** via a zoom slider in Settings.
- Paginated section menus, a frosted-glass header/footer, and a themed
  background pattern.

## Tech stack

- **Python** + [pywebview](https://pywebview.flowrl.com/) (Windows backend:
  WinForms + WebView2) for the desktop shell.
- Plain **HTML / CSS / JavaScript** for the UI — no framework, no build step.
- **[Supabase](https://supabase.com)** (Postgres + Auth) for accounts and all
  progress/mistakes/saved-question data, via the `supabase-py` client.
- **PyInstaller** to package everything into a single `.exe`.

## Project structure

```
app/                  Python backend (pywebview entry point + Api class)
  main.py             Window setup, question/history API, title-bar theming
  data/                *.seed.json question banks, one per vehicle
frontend/             The web UI loaded into the pywebview window
  index.html
  scripts/app.js       All UI logic (screens, quiz flow, settings, progress)
  styles/              app.css, tokens.css (design tokens / theme variables)
  assets/              icons, sign images, background art, brand logo
design/                Source design assets (app icon, background pattern
                       originals) before they were processed into frontend/
docs/                  Project planning notes and an early static HTML mockup
RoadReady.spec         PyInstaller build spec
run-dev.bat            Launches the app from source (no build step)
```

## Running it

Requires Python 3 and a virtual environment with the dependencies installed:

```bash
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
```

Then either double-click `run-dev.bat`, or:

```bash
.venv\Scripts\python app\main.py
```

## Building the `.exe`

```bash
.venv\Scripts\pip install -r requirements-build.txt
.venv\Scripts\pyinstaller RoadReady.spec
```

The finished executable is written to `dist/RoadReady.exe` — a single file,
nothing else needed to run it on another Windows machine.

## Building the installer & shipping an update

RoadReady ships as a proper installer (built with
[Inno Setup](https://jrsoftware.org/isinfo.php)) rather than a bare `.exe`, and
checks Supabase on launch to see if a newer version is available. To cut a
new release:

1. Bump the version in two places, kept in sync by hand:
   - `APP_VERSION` near the top of `app/main.py`
   - `MyAppVersion` near the top of `installer/RoadReady.iss`
2. Rebuild the exe (see above), then compile the installer:
   ```bash
   "C:\Users\<you>\AppData\Local\Programs\Inno Setup 6\ISCC.exe" installer\RoadReady.iss
   ```
   This produces `installer/Output/RoadReadySetup.exe` (per-user install, no
   admin rights needed — installs to `%LocalAppData%\Programs\RoadReady`).
3. Commit and push, then tag the release (e.g. `git tag v1.0.1 && git push --tags`)
   and create a [GitHub Release](https://github.com/VaratisG/RoadReady/releases/new)
   for that tag, attaching `RoadReadySetup.exe` as a release asset.
   Make sure the asset is literally named `RoadReadySetup.exe` — the app's
   update check always points at
   `.../releases/latest/download/RoadReadySetup.exe`, which follows whatever
   the newest release's same-named asset is.
4. Update the `app_version` row in Supabase so existing installs learn about
   the new release:
   ```sql
   update app_version set latest_version = '1.0.1', updated_at = now() where id = 1;
   ```
   Next time anyone opens the app, they'll see an "update available" prompt;
   clicking it downloads `RoadReadySetup.exe` and re-runs the installer over
   the existing install, then the app closes itself so the install can finish.

## Data source

Question content, sign images, and category icons were originally sourced
from a Greek driving-theory practice website. The tooling used to gather that
content isn't part of this repo — only the resulting `app/data/*.seed.json`
question banks are included.

## Backend setup

Progress, mistakes, and saved questions live in Supabase, not on disk. To run
this against your own project:

1. Create a project at [supabase.com](https://supabase.com).
2. Run [`supabase/schema.sql`](supabase/schema.sql) in its SQL Editor — this
   creates all the tables (quiz data, accounts/roles, app version) and their
   Row Level Security policies.
3. Copy the project's URL and `anon` public key (Settings -> API) into the
   `SUPABASE_URL` / `SUPABASE_ANON_KEY` constants near the top of
   `app/main.py`. Never use the `service_role` key here — RLS is what makes
   the anon key safe to embed in a distributed `.exe`.
4. **Disable "Confirm email"** under Authentication -> Providers -> Email.
   This is required, not optional: usernames map to synthetic addresses at
   `{username}@roadready.local` that never receive real mail, so a
   confirmation link can never arrive if this is left on.
5. Deploy the `manage-users` Edge Function — this is what lets admins and
   supervisors create/delete accounts without ever exposing the
   `service_role` key to the client. With the
   [Supabase CLI](https://supabase.com/docs/guides/cli): `supabase link` then
   `supabase functions deploy manage-users`. Without the CLI: create a new
   Edge Function named `manage-users` in the Dashboard and paste in the
   contents of
   [`supabase/functions/manage-users/index.ts`](supabase/functions/manage-users/index.ts).
   No secrets need to be configured manually — Supabase injects the
   project's URL and keys into the function automatically.
6. *(Optional)* Enable data retention — enable the **pg_cron** extension
   under Database -> Extensions, then run the `cron.schedule(...)` command
   left as a comment at the bottom of `schema.sql` to automatically prune
   `attempts` (quiz history) older than a month. Accounts, wrong questions,
   and saved questions are never affected by this.

## Notes

- Windows-only: the title-bar theming and window chrome use Windows-specific
  APIs (DWM, WinForms), so this won't run as-is on macOS/Linux.
- Requires an internet connection — there's no offline/local-only mode.
- No license file is included yet — add one if you plan to publish this
  publicly, and double-check the terms around the scraped question content
  before distributing it further.
