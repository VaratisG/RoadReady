-- Run once in the Supabase SQL Editor on an EXISTING project (a fresh project
-- gets all of this from schema.sql). Safe to run more than once.
--
-- 1. Lets supervisors read the quiz history and the "still wrong" questions of
--    the users under them, and admins read everyone's (re-creating the admin
--    attempts policy in case an older project never had it).
-- 2. Lowers the per-supervisor user limit from 10 to 5.
--
-- No tables or columns change, so it is safe to run before or after
-- publishing the new app/web version.

-- Already part of schema.sql; repeated here so a project that missed it still works.
create or replace function public.current_role()
returns text language sql security definer stable as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function public.is_my_student(target uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from profiles where id = target and supervisor_id = auth.uid()
  );
$$;

-- Also from schema.sql: lets the admin Statistics screen see everyone's quizzes.
drop policy if exists "admin sees all attempts" on attempts;
create policy "admin sees all attempts" on attempts
  for select using (public.current_role() = 'admin');

drop policy if exists "supervisor sees team attempts" on attempts;
create policy "supervisor sees team attempts" on attempts
  for select using (public.current_role() = 'supervisor' and public.is_my_student(user_id));

drop policy if exists "admin sees all wrong questions" on wrong_questions;
create policy "admin sees all wrong questions" on wrong_questions
  for select using (public.current_role() = 'admin');

drop policy if exists "supervisor sees team wrong questions" on wrong_questions;
create policy "supervisor sees team wrong questions" on wrong_questions
  for select using (public.current_role() = 'supervisor' and public.is_my_student(user_id));

-- Existing supervisors who already have more than 5 users keep them; they just
-- can't add new ones until they are back under the limit.
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
