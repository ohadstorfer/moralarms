-- Mora: tasks + push subscriptions + cron-driven reminders

create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_time time not null,
  repeat_every_minutes int not null check (repeat_every_minutes > 0),
  timezone text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists task_completions (
  task_id uuid references tasks(id) on delete cascade,
  local_date date not null,
  completed_at timestamptz not null default now(),
  primary key (task_id, local_date)
);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  device_label text,
  created_at timestamptz not null default now()
);

create table if not exists notification_log (
  task_id uuid references tasks(id) on delete cascade,
  sent_at timestamptz not null,
  primary key (task_id, sent_at)
);

-- Single-user personal app: permissive RLS. Tighten later if you add auth.
alter table tasks enable row level security;
alter table task_completions enable row level security;
alter table push_subscriptions enable row level security;
alter table notification_log enable row level security;

create policy "anon all tasks" on tasks for all to anon using (true) with check (true);
create policy "anon all completions" on task_completions for all to anon using (true) with check (true);
create policy "anon all subs" on push_subscriptions for all to anon using (true) with check (true);
create policy "anon read log" on notification_log for select to anon using (true);

