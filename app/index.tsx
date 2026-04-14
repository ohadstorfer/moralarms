import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Animated,
  AppState,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { listTasks, listCompletionsToday, markDoneToday, unmarkToday, isActiveOn } from '../lib/tasks';
import { Task } from '../lib/supabase';
import { enablePush, hasPermission, isPushSupported } from '../lib/push';
import { signOut } from '../lib/auth';

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getLocalToday(): { iso: string; display: string; weekday: number } {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')!.value;
  const m = parts.find((p) => p.type === 'month')!.value;
  const d = parts.find((p) => p.type === 'day')!.value;
  const wdName = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(
    new Date()
  );
  return {
    iso: `${y}-${m}-${d}`,
    display: `${d}/${m}/${y}`,
    weekday: WEEKDAY_MAP[wdName] ?? 0,
  };
}

function msUntilNextLocalMidnight(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 5, 0);
  return next.getTime() - now.getTime();
}

export default function Home() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [pushOn, setPushOn] = useState(false);
  const [today, setToday] = useState(getLocalToday());
  const [loaded, setLoaded] = useState(false);
  const todayIsoRef = useRef(today.iso);
  todayIsoRef.current = today.iso;

  const refresh = useCallback(async () => {
    const t = await listTasks();
    const d = await listCompletionsToday(t);
    setTasks(t);
    setDoneIds(d);
    setLoaded(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  useEffect(() => {
    hasPermission().then(setPushOn);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        const t = getLocalToday();
        setToday(t);
        refresh();
        schedule();
      }, msUntilNextLocalMidnight());
    };
    schedule();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const t = getLocalToday();
        if (t.iso !== todayIsoRef.current) {
          setToday(t);
          refresh();
        }
      }
    });

    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [refresh]);

  const toggle = useCallback(
    (t: Task) => {
      const wasDone = doneIds.has(t.id);
      setDoneIds((prev) => {
        const next = new Set(prev);
        if (wasDone) next.delete(t.id);
        else next.add(t.id);
        return next;
      });
      const op = wasDone ? unmarkToday(t.id) : markDoneToday(t.id);
      op.catch(() => {
        setDoneIds((prev) => {
          const next = new Set(prev);
          if (wasDone) next.add(t.id);
          else next.delete(t.id);
          return next;
        });
      });
    },
    [doneIds]
  );

  const completedCount = doneIds.size;

  async function clearCompleted() {
    const ids = Array.from(doneIds);
    setDoneIds(new Set());
    await Promise.all(ids.map((id) => unmarkToday(id).catch(() => {})));
  }

  async function onEnablePush() {
    const r = await enablePush();
    if (r === 'ok') setPushOn(true);
    else if (r === 'denied') alert('Notifications permission denied.');
    else alert('Push not supported in this browser. Add to Home Screen on iOS 16.4+.');
  }

  return (
    <View style={styles.root}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Todo</Text>
        <Text style={styles.dateSubtitle}>
          {WEEKDAY_NAMES[today.weekday]} {today.display}
        </Text>
        <View style={{ flex: 1 }} />
        {/* <Pressable
          onPress={async () => {
            await signOut();
            router.replace('/auth');
          }}
          hitSlop={10}
        >
          <Text style={styles.signOut}>Sign out</Text>
        </Pressable> */}
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{completedCount} Completed</Text>
        {completedCount > 0 && (
          <>
            <Text style={styles.metaText}>  •  </Text>
            <Text style={styles.clearLink} onPress={clearCompleted}>
              Clear
            </Text>
          </>
        )}
      </View>

      <FlatList
        data={tasks.filter((t) => isActiveOn(t, today.weekday))}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}
        renderItem={({ item }) => (
          <TaskRow
            task={item}
            done={doneIds.has(item.id)}
            onToggle={() => toggle(item)}
            onLongPress={() => router.push(`/task/${item.id}`)}
          />
        )}
        
      />

      {!pushOn && isPushSupported() && (
        <Pressable style={styles.enableBtn} onPress={onEnablePush}>
          <Text style={styles.enableText}>Enable notifications</Text>
        </Pressable>
      )}

      <Pressable style={styles.fab} onPress={() => router.push('/task/new')}>
        <Text style={styles.fabPlus}>+</Text>
      </Pressable>
    </View>
  );
}

function TaskRow({
  task,
  done,
  onToggle,
  onLongPress,
}: {
  task: Task;
  done: boolean;
  onToggle: () => void;
  onLongPress: () => void;
}) {
  const anim = useRef(new Animated.Value(done ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: done ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [done, anim]);

  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#C7C7CC', '#FF9500'],
  });
  const dotScale = anim;
  const textOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.45],
  });

  return (
    <Pressable style={styles.row} onPress={onToggle} onLongPress={onLongPress}>
      <Animated.View style={[styles.circle, { borderColor }]}>
        <Animated.View style={[styles.dot, { transform: [{ scale: dotScale }] }]} />
      </Animated.View>
      <Animated.Text
        style={[
          styles.rowText,
          done && styles.rowTextDone,
          { opacity: textOpacity },
        ]}
      >
        {task.name}
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 8 },
  title: { color: '#FF9500', fontSize: 34, fontWeight: '800' },
  dateSubtitle: { color: '#8E8E93', fontSize: 15, fontWeight: '500', marginLeft: 10 },
  signOut: { color: '#FF9500', fontSize: 14, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, marginBottom: 4 },
  metaText: { color: '#8E8E93', fontSize: 14 },
  clearLink: { color: '#FF9500', fontWeight: '600' },
  sectionHeaderWrap: { paddingTop: 14 },
  sectionDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E5EA', marginBottom: 10 },
  sectionHeader: { color: '#1C1C1E', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 4,
    // @ts-expect-error web-only style
    userSelect: 'none',
    // @ts-expect-error web-only style
    WebkitUserSelect: 'none',
    // @ts-expect-error web-only style
    WebkitTouchCallout: 'none',
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#C7C7CC',
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF9500' },
  rowText: { color: '#1C1C1E', fontSize: 18 },
  rowTextDone: { textDecorationLine: 'line-through', color: '#8E8E93' },
  empty: { color: '#8E8E93', textAlign: 'center', marginTop: 40 },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF9500',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabPlus: { color: '#fff', fontSize: 30, fontWeight: '300', marginTop: -2 },
  enableBtn: {
    position: 'absolute',
    left: 20,
    right: 90,
    bottom: 40,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  enableText: { color: '#FF9500', fontSize: 15, fontWeight: '600' },
});
