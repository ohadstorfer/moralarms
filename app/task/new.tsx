import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { createTask } from '../../lib/tasks';

export default function NewTask() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [notifText, setNotifText] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [interval, setInterval] = useState('30');
  const [unit, setUnit] = useState<'minutes' | 'hours'>('minutes');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return;
    const n = parseInt(interval, 10);
    if (!Number.isFinite(n) || n <= 0) {
      Alert.alert('Invalid interval');
      return;
    }
    setSaving(true);
    try {
      await createTask({
        name: name.trim(),
        start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
        repeat_every_minutes: unit === 'hours' ? n * 60 : n,
        notification_text: notifText.trim() || null,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Failed', e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <Text style={styles.h}>New Task</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Stretching"
        placeholderTextColor="#8E8E93"
        autoFocus
      />

      <Text style={styles.label}>Notification message</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={notifText}
        onChangeText={setNotifText}
        placeholder="Don't forget to do your yoga!"
        placeholderTextColor="#8E8E93"
        multiline
      />

      <Text style={styles.label}>Start time (HH:MM, 24h)</Text>
      <TextInput
        style={styles.input}
        value={startTime}
        onChangeText={setStartTime}
        placeholder="09:00"
        placeholderTextColor="#8E8E93"
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
        />
        <Pressable
          style={[styles.unit, unit === 'minutes' && styles.unitOn]}
          onPress={() => setUnit('minutes')}
        >
          <Text style={[styles.unitText, unit === 'minutes' && styles.unitTextOn]}>min</Text>
        </Pressable>
        <Pressable
          style={[styles.unit, unit === 'hours' && styles.unitOn]}
          onPress={() => setUnit('hours')}
        >
          <Text style={[styles.unitText, unit === 'hours' && styles.unitTextOn]}>hr</Text>
        </Pressable>
      </View>

      <Pressable style={styles.save} onPress={save} disabled={saving}>
        <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF', padding: 20 },
  h: { color: '#FF9500', fontSize: 32, fontWeight: '800', marginBottom: 16 },
  label: { color: '#8E8E93', fontSize: 13, marginTop: 16, marginBottom: 6, textTransform: 'uppercase' },
  input: {
    backgroundColor: '#F2F2F7',
    color: '#1C1C1E',
    fontSize: 17,
    padding: 14,
    borderRadius: 10,
  },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
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
  saveText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
