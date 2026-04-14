-- Per-user data isolation: tag every row with auth.users(id) and tighten RLS.

-- 1. Wipe legacy single-user data.
delete from notification_log;
delete from task_completions;
delete from push_subscriptions;
delete from tasks;

-- 2. Owner columns.
alter table tasks
  add column user_id uuid not null references auth.users(id) on delete cascade;
alter table push_subscriptions
  add column user_id uuid not null references auth.users(id) on delete cascade;

create index if not exists tasks_user_id_idx on tasks(user_id);
create index if not exists push_subscriptions_user_id_idx on push_subscriptions(user_id);

-- 3. Drop old permissive policies.
drop policy if exists "anon all tasks" on tasks;
drop policy if exists "anon all completions" on task_completions;
drop policy if exists "anon all subs" on push_subscriptions;
drop policy if exists "anon read log" on notification_log;

-- 4. Per-user policies (authenticated role only).
create policy "own tasks" on tasks for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own completions" on task_completions for all to authenticated
  using (exists (select 1 from tasks t where t.id = task_id and t.user_id = auth.uid()))
  with check (exists (select 1 from tasks t where t.id = task_id and t.user_id = auth.uid()));

create policy "own subs" on push_subscriptions for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own log read" on notification_log for select to authenticated
  using (exists (select 1 from tasks t where t.id = task_id and t.user_id = auth.uid()));
