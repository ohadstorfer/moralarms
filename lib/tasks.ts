import { supabase, Task } from './supabase';

function localDateInTz(tz: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(new Date());
}

export function isActiveOn(task: Task, weekday: number): boolean {
  if (!task.repeat_weekdays || task.repeat_weekdays.length === 0) return true;
  return task.repeat_weekdays.includes(weekday);
}

export function localWeekdayInTz(tz: string): number {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(
    new Date()
  );
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[name] ?? 0;
}

export async function listTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listCompletionsToday(tasks: Task[]): Promise<Set<string>> {
  if (tasks.length === 0) return new Set();
  const done = new Set<string>();
  const byDate = new Map<string, string[]>();
  for (const t of tasks) {
    const d = localDateInTz(t.timezone);
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d)!.push(t.id);
  }
  for (const [date, ids] of byDate) {
    const { data, error } = await supabase
      .from('task_completions')
      .select('task_id')
      .eq('local_date', date)
      .in('task_id', ids);
    if (error) throw error;
    for (const r of data ?? []) done.add(r.task_id);
  }
  return done;
}

export async function createTask(input: {
  name: string;
  start_time: string;
  repeat_every_minutes: number;
  notification_text?: string | null;
  repeat_weekdays?: number[] | null;
}): Promise<Task> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not signed in');
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...input,
      notification_text: input.notification_text?.trim() || null,
      repeat_weekdays: input.repeat_weekdays ?? null,
      timezone,
      active: true,
      user_id: userData.user.id,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<void> {
  const { error } = await supabase.from('tasks').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

export async function getTask(id: string): Promise<Task | null> {
  const { data, error } = await supabase.from('tasks').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function markDoneToday(taskId: string): Promise<void> {
  const task = await getTask(taskId);
  if (!task) return;
  const date = localDateInTz(task.timezone);
  const { error } = await supabase
    .from('task_completions')
    .upsert({ task_id: taskId, local_date: date }, { onConflict: 'task_id,local_date' });
  if (error) throw error;
}

export async function unmarkToday(taskId: string): Promise<void> {
  const task = await getTask(taskId);
  if (!task) return;
  const date = localDateInTz(task.timezone);
  const { error } = await supabase
    .from('task_completions')
    .delete()
    .eq('task_id', taskId)
    .eq('local_date', date);
  if (error) throw error;
}
