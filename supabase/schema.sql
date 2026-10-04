-- RoadReady Supabase schema.
-- Run this once in the target project's SQL Editor (Dashboard -> SQL Editor)
-- before pointing desktop/main.py's SUPABASE_URL / SUPABASE_ANON_KEY at it.

create table attempts (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  vehicle text not null,
  section_id text not null,
  section_label text not null,
  correct int not null,
  total int not null,
  completed_at timestamptz not null default now()
);

create table wrong_questions (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  vehicle text not null,
  question_id text not null,
  category text not null,
  created_at timestamptz not null default now(),
  -- Index of the answer the user most recently picked wrongly (null for rows
  -- recorded before this column existed). Lets a supervisor see what they chose.
  selected_index int,
  unique (user_id, vehicle, question_id)
);

create table saved_questions (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  vehicle text not null,
  question_id text not null,
  category text not null,
  created_at timestamptz not null default now(),
  unique (user_id, vehicle, question_id)
);

-- Row Level Security: every table is scoped to auth.uid(), which is what
-- actually makes it safe to ship the anon key inside the distributed .exe.
alter table attempts enable row level security;
alter table wrong_questions enable row level security;
alter table saved_questions enable row level security;

create policy "own rows only" on attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on wrong_questions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on saved_questions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- User management hierarchy: admin -> supervisors (driving schools) -> users.
-- Nobody signs themselves up; accounts are created by an admin or supervisor
-- through the "manage-users" Edge Function (see supabase/functions/manage-users),
-- which is the only thing allowed to call the privileged admin.createUser API.
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  role text not null check (role in ('admin', 'supervisor', 'user')),
  supervisor_id uuid references profiles(id) on delete set null,
  contact_email text,
  created_at timestamptz not null default now()
);

-- A supervisor can only ever have up to 5 users under them. Enforced here as
-- a safety net in addition to the count check in the Edge Function.
create or replace function public.enforce_supervisor_capacity()
returns trigger language plpgsql as $$
declare
  current_count int;
begin
  if new.supervisor_id is not null then
    select count(*) into current_count from profiles where supervisor_id = new.supervisor_id;
    if current_count >= 5 then
      raise exception 'Ο επόπτης έχει ήδη 5 χρήστες.';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_enforce_supervisor_capacity
  before insert on profiles
  for each row execute function public.enforce_supervisor_capacity();

-- security definer helper so RLS policies can read the caller's own role
-- without recursively hitting the RLS on profiles itself.
create or replace function public.current_role()
returns text language sql security definer stable as $$
  select role from profiles where id = auth.uid();
$$;

alter table profiles enable row level security;

create policy "admin sees all profiles" on profiles
  for select using (public.current_role() = 'admin');
create policy "supervisor sees own team" on profiles
  for select using (public.current_role() = 'supervisor' and (supervisor_id = auth.uid() or id = auth.uid()));
create policy "user sees self" on profiles
  for select using (id = auth.uid());

-- All inserts/deletes go through the Edge Function using the service_role key
-- (which bypasses RLS entirely), so no insert/update/delete policies exist
-- here for regular callers on purpose.

-- Lets the admin analytics screen aggregate quiz history across everyone,
-- on top of the "own rows only" policy every user already has on attempts.
create policy "admin sees all attempts" on attempts
  for select using (public.current_role() = 'admin');

-- Lets a supervisor read the quiz history and the "still wrong" questions of
-- the users under them, and nobody else's. security definer so the lookup
-- doesn't depend on the caller's own RLS on profiles.
create or replace function public.is_my_student(target uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from profiles where id = target and supervisor_id = auth.uid()
  );
$$;

create policy "supervisor sees team attempts" on attempts
  for select using (public.current_role() = 'supervisor' and public.is_my_student(user_id));

create policy "admin sees all wrong questions" on wrong_questions
  for select using (public.current_role() = 'admin');
create policy "supervisor sees team wrong questions" on wrong_questions
  for select using (public.current_role() = 'supervisor' and public.is_my_student(user_id));

-- ---------------------------------------------------------------------------
-- Data retention: keep only the last month of quiz history. Accounts
-- (profiles / auth.users) are never touched by this — a user can exist
-- indefinitely. wrong_questions and saved_questions are left alone too,
-- since they're the current "still wrong" / "bookmarked" sets the app shows
-- a user, not a log — only attempts (the completed-quiz history) ages out.
-- ---------------------------------------------------------------------------

create or replace function public.enforce_data_retention()
returns void language plpgsql security definer as $$
begin
  delete from attempts where completed_at < now() - interval '1 month';
end;
$$;

-- Requires the pg_cron extension. Enable it once via Dashboard -> Database ->
-- Extensions (search "pg_cron"), then run this to schedule the daily cleanup:
--
--   select cron.schedule(
--     'roadready-data-retention',
--     '0 3 * * *',  -- daily at 03:00 UTC
--     $$select public.enforce_data_retention();$$
--   );
--
-- To change the schedule later: select cron.alter_job(job_id, schedule => '...');
-- (find job_id via `select * from cron.job;`). To remove it entirely:
-- `select cron.unschedule('roadready-data-retention');`

-- ---------------------------------------------------------------------------
-- App version check: a single-row table the app reads on launch (via the
-- anon key, no login required) to see if a newer installer is available.
-- Update `latest_version` / `download_url` here each time you cut a release.
-- ---------------------------------------------------------------------------

create table app_version (
  id int primary key default 1,
  latest_version text not null,
  download_url text not null,
  updated_at timestamptz not null default now(),
  constraint app_version_singleton check (id = 1)
);

insert into app_version (id, latest_version, download_url) values (
  1,
  '1.0.0',
  'https://github.com/VaratisG/RoadReady/releases/latest/download/RoadReadySetup.exe'
);

alter table app_version enable row level security;

create policy "anyone can read the latest version" on app_version
  for select using (true);
