import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getTask, updateTask, deleteTask } from '../../lib/tasks';
import { Task } from '../../lib/supabase';

export default function EditTask() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [interval, setInterval] = useState('30');
  const [unit, setUnit] = useState<'minutes' | 'hours'>('minutes');

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);

  useEffect(() => {
    if (!id) return;
    getTask(id as string).then((t) => {
      if (!t) return;
      setTask(t);
      setName(t.name);
      setStartTime(t.start_time.slice(0, 5));
      if (t.repeat_every_minutes % 60 === 0) {
        setInterval(String(t.repeat_every_minutes / 60));
        setUnit('hours');
      } else {
        setInterval(String(t.repeat_every_minutes));
        setUnit('minutes');
      }
    });
  }, [id]);

  const ready = task !== null;

  async function save() {
    if (!task) return;
    const n = parseInt(interval, 10);
    if (!Number.isFinite(n) || n <= 0) return;
    await updateTask(task.id, {
      name: name.trim(),
      start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
      repeat_every_minutes: unit === 'hours' ? n * 60 : n,
    });
    close();
  }

  async function remove() {
    if (!task) return;
    if (typeof window !== 'undefined' && !window.confirm('Delete this task?')) return;
    await deleteTask(task.id);
    close();
  }

  return (
    <Animated.View style={[styles.backdrop, { opacity: fade }]}>
      <Pressable style={styles.backdropPress} onPress={() => close()} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slide }] }]}>
        <View style={styles.headerRow}>
          <Text style={styles.h}>Edit Task</Text>
          <Pressable onPress={() => close()} hitSlop={10}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholderTextColor="#8E8E93"
          editable={ready}
        />

        <Text style={styles.label}>Start time</Text>
        <TextInput
          style={styles.input}
          value={startTime}
          onChangeText={setStartTime}
          editable={ready}
          // @ts-expect-error web-only prop
          type="time"
        />

        <Text style={styles.label}>Repeat every</Text>
        <View style={styles.repeatRow}>
          <TextInput
            style={[styles.input, styles.repeatInput]}
            value={interval}
            onChangeText={setInterval}
            keyboardType="number-pad"
            editable={ready}
          />
          <Pressable
            style={[styles.unit, unit === 'minutes' && styles.unitOn]}
            onPress={() => setUnit('minutes')}
            disabled={!ready}
          >
            <Text style={[styles.unitText, unit === 'minutes' && styles.unitTextOn]}>min</Text>
          </Pressable>
          <Pressable
            style={[styles.unit, unit === 'hours' && styles.unitOn]}
            onPress={() => setUnit('hours')}
            disabled={!ready}
          >
            <Text style={[styles.unitText, unit === 'hours' && styles.unitTextOn]}>hr</Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.save, !ready && styles.saveDisabled]}
          onPress={save}
          disabled={!ready}
        >
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
        <Pressable style={styles.delete} onPress={remove} disabled={!ready}>
          <Text style={[styles.deleteText, !ready && { opacity: 0.4 }]}>Delete</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdropPress: { ...StyleSheet.absoluteFillObject },
  sheet: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cancel: { color: '#FF9500', fontSize: 16, fontWeight: '600' },
  h: { color: '#FF9500', fontSize: 28, fontWeight: '800' },
  label: {
    color: '#8E8E93',
    fontSize: 13,
    marginTop: 16,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#F2F2F7',
    color: '#1C1C1E',
    fontSize: 17,
    padding: 14,
    borderRadius: 10,
  },
  repeatRow: { flexDirection: 'row', alignItems: 'stretch', width: '100%' },
  repeatInput: { flex: 1, flexShrink: 1, minWidth: 0 },
  unit: {
    backgroundColor: '#F2F2F7',
    flexShrink: 0,
    width: 56,
    paddingHorizontal: 8,
    paddingVertical: 14,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  unitOn: { backgroundColor: '#FF9500' },
  unitText: { color: '#1C1C1E', fontWeight: '600' },
  unitTextOn: { color: '#FFFFFF' },
  save: {
    marginTop: 32,
    backgroundColor: '#FF9500',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveDisabled: { opacity: 0.5 },
  saveText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  delete: { marginTop: 12, padding: 16, borderRadius: 12, alignItems: 'center' },
  deleteText: { color: '#FF3B30', fontSize: 15, fontWeight: '600' },
});
