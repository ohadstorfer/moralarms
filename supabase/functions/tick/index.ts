// Mora scheduler — runs every minute via pg_cron.
// Evaluates which active tasks are due and sends Web Push to all subscriptions.

// deno-lint-ignore-file no-explicit-any
import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:you@example.com';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const GRACE_SECONDS = 90;

function localParts(d: Date, tz: string) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: parseInt(parts.hour, 10),
    minute: parseInt(parts.minute, 10),
  };
}

Deno.serve(async (_req) => {
  const now = new Date();

  const { data: tasks, error: taskErr } = await supabase
    .from('tasks')
    .select('*')
    .eq('active', true);
  if (taskErr) return new Response(JSON.stringify({ error: taskErr.message }), { status: 500 });

  const dueTasks: any[] = [];
  for (const t of tasks ?? []) {
    const { date, hour, minute } = localParts(now, t.timezone);
    const [startH, startM] = (t.start_time as string).split(':').map((x) => parseInt(x, 10));
    const localMinutes = hour * 60 + minute;
    const startMinutes = startH * 60 + startM;
    if (localMinutes < startMinutes) continue;
    const diff = localMinutes - startMinutes;
    if (diff % t.repeat_every_minutes !== 0) continue;

    const { data: done } = await supabase
      .from('task_completions')
      .select('task_id')
      .eq('task_id', t.id)
      .eq('local_date', date)
      .maybeSingle();
    if (done) continue;

    const since = new Date(now.getTime() - GRACE_SECONDS * 1000).toISOString();
    const { data: recent } = await supabase
      .from('notification_log')
      .select('task_id')
      .eq('task_id', t.id)
      .gte('sent_at', since)
      .limit(1);
    if (recent && recent.length) continue;

    dueTasks.push(t);
  }

  if (dueTasks.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  let sent = 0;
  const staleEndpoints: string[] = [];

  for (const t of dueTasks) {
    const payload = JSON.stringify({
      title: t.name,
      body: 'Tap to mark done',
      url: '/',
      tag: `task-${t.id}`,
    });
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', t.user_id);
    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
        sent++;
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          staleEndpoints.push(s.endpoint);
        }
      }
    }
    await supabase.from('notification_log').insert({ task_id: t.id, sent_at: now.toISOString() });
  }

  if (staleEndpoints.length) {
    await supabase.from('push_subscriptions').delete().in('endpoint', staleEndpoints);
  }

  return new Response(JSON.stringify({ sent, due: dueTasks.length }), { status: 200 });
});
