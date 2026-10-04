-- Run once in the Supabase SQL Editor on an EXISTING project (a fresh project
-- gets this from schema.sql). Safe to run more than once.
--
-- Stores which answer a user most recently picked wrongly for a question that
-- is still on their "wrong questions" list, so a supervisor can see it.
-- Rows recorded before this column existed simply have no selected answer.
--
-- The app tolerates the column being missing (it falls back to the old
-- behaviour), so this can be run before or after publishing the new version.

alter table wrong_questions
  add column if not exists selected_index int;
