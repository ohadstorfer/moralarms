import { useEffect, useRef, useState } from 'react';
// @ts-expect-error no type defs for react-dom in this project
import { createPortal } from 'react-dom';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
} from 'react-native';

const FIXED_POS = (Platform.OS === 'web' ? 'fixed' : 'absolute') as 'absolute';
import { createTask } from '../lib/tasks';
import { WeekdayPicker } from './WeekdayPicker';
import { SheetHeader } from './SheetHeader';
import { TimeWheelPicker } from './TimeWheelPicker';
import { ClockIcon } from './ClockIcon';
import { t } from '../lib/i18n';

const SCREEN_H = Dimensions.get('window').height;
const TOP_GAP = 80;
const SHEET_HEIGHT = SCREEN_H - TOP_GAP;
const DISMISS_THRESHOLD = SHEET_HEIGHT * 0.25;

type Props = { onClose: () => void; onCreated?: () => void };

export function NewReminderSheet({ onClose, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [interval, setInterval] = useState('30');
  const [unit, setUnit] = useState<'minutes' | 'hours'>('minutes');
  const [repeatMode, setRepeatMode] = useState<'daily' | 'custom'>('daily');
  const [days, setDays] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [hh, mm] = startTime.split(':').map((x) => parseInt(x, 10));
  const setTime = (h: number, m: number) => {
    setStartTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  };

  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const titleRef = useRef<TextInput>(null);
  const scrollY = useRef(0);

  useEffect(() => {
    let prevOverflow = '';
    let prevScrollY = 0;
    if (typeof document !== 'undefined') {
      prevScrollY = window.scrollY;
      prevOverflow = document.body.style.overflow;
      window.scrollTo(0, 0);
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
    Animated.timing(translateY, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }).start(() => {
      const node: any = titleRef.current;
      if (node && typeof node.focus === 'function') {
        try {
          node.focus({ preventScroll: true });
        } catch {
          node.focus();
        }
      }
    });
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = prevOverflow;
        document.documentElement.style.overflow = prevOverflow;
        window.scrollTo(0, prevScrollY);
      }
    };
  }, [translateY]);

  const animateClose = (after?: () => void) => {
    Animated.timing(translateY, {
      toValue: SHEET_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      after?.();
      onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => {
        // Only capture downward drags that are clearly vertical, and only
        // when the ScrollView is at the top so we don't fight its scrolling.
        return g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx) && scrollY.current <= 0;
      },
      onPanResponderMove: (_e, g) => {
        const next = Math.max(0, g.dy);
        translateY.setValue(next);
      },
      onPanResponderRelease: (_e, g) => {
        if (g.dy > DISMISS_THRESHOLD || g.vy > 0.8) {
          animateClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

  const toggleDay = (d: number) =>
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });

  const intervalN = parseInt(interval, 10);
  const canSave =
    title.trim().length > 0 && Number.isFinite(intervalN) && intervalN > 0 && !saving;

  async function save() {
    if (!canSave) {
      if (!Number.isFinite(intervalN) || intervalN <= 0) Alert.alert(t('task.invalid_interval'));
      return;
    }
    setSaving(true);
    try {
      const weekdays =
        repeatMode === 'daily' || days.size === 0 || days.size === 7
          ? null
          : Array.from(days).sort();
      await createTask({
        name: title.trim(),
        start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
        repeat_every_minutes: unit === 'hours' ? intervalN * 60 : intervalN,
        notification_text: note.trim() || null,
        repeat_weekdays: weekdays,
      });
      animateClose(() => onCreated?.());
    } catch (e: any) {
      Alert.alert(t('task.save_failed'), e.message);
      setSaving(false);
    }
  }

  const content = (
    <View style={styles.root} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={() => animateClose()} />
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY }] }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.grabberWrap}>
          <View style={styles.grabber} />
        </View>

        <SheetHeader
          title={t('task.new_reminder')}
          onCancel={() => animateClose()}
          onSave={save}
          canSave={canSave}
        />

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(e) => {
            scrollY.current = e.nativeEvent.contentOffset.y;
          }}
        >
          <View style={styles.card}>
            <TextInput
              ref={titleRef}
              style={[styles.cardInput, styles.titleInput]}
              value={title}
              onChangeText={setTitle}
              placeholder={t('task.title')}
              placeholderTextColor="#8E8E93"
            />
            <View style={styles.cardDivider} />
            <TextInput
              style={[styles.cardInput, styles.cardNote]}
              value={note}
              onChangeText={setNote}
              placeholder={t('task.note')}
              placeholderTextColor="#8E8E93"
              multiline
            />
          </View>

          <Text style={styles.label}>{t('task.start_time')}</Text>
          <Pressable style={[styles.input, styles.timeRow]} onPress={() => setShowTimePicker(true)}>
            <ClockIcon size={22} />
            <Text style={styles.timeValue}>{startTime}</Text>
          </Pressable>

          <Text style={styles.label}>{t('task.repeat_on')}</Text>
          <View style={styles.modeRow}>
            <Pressable
              style={[styles.mode, repeatMode === 'daily' && styles.modeOn]}
              onPress={() => setRepeatMode('daily')}
            >
              <Text style={[styles.modeText, repeatMode === 'daily' && styles.modeTextOn]}>
                {t('task.every_day')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.mode, repeatMode === 'custom' && styles.modeOn]}
              onPress={() => setRepeatMode('custom')}
            >
              <Text style={[styles.modeText, repeatMode === 'custom' && styles.modeTextOn]}>
                {t('task.custom')}
              </Text>
            </Pressable>
          </View>
          {repeatMode === 'custom' && (
            <View style={styles.daysWrap}>
              <WeekdayPicker selected={days} onToggle={toggleDay} />
            </View>
          )}

          <Text style={styles.label}>{t('task.repeat_every')}</Text>
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
              <Text style={[styles.unitText, unit === 'minutes' && styles.unitTextOn]}>
                {t('task.min')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.unit, unit === 'hours' && styles.unitOn]}
              onPress={() => setUnit('hours')}
            >
              <Text style={[styles.unitText, unit === 'hours' && styles.unitTextOn]}>
                {t('task.hr')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {showTimePicker && (
          <View style={styles.timePickerOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowTimePicker(false)} />
            <View style={styles.timePickerCard}>
              <TimeWheelPicker hour={hh || 0} minute={mm || 0} onChange={setTime} />
              <Pressable style={styles.timeDone} onPress={() => setShowTimePicker(false)}>
                <Text style={styles.timeDoneText}>{t('task.save')}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }
  return content;
}

const styles = StyleSheet.create({
  root: {
    position: FIXED_POS,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdrop: {
    position: FIXED_POS,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  sheet: {
    position: FIXED_POS,
    left: 0,
    right: 0,
    top: TOP_GAP,
    bottom: 0,
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  grabberWrap: { paddingTop: 8, paddingBottom: 4, alignItems: 'center' },
  grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#C7C7CC' },
  scroll: { padding: 16, paddingBottom: 48 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardInput: {
    color: '#1C1C1E',
    fontSize: 17,
    paddingHorizontal: 16,
    paddingVertical: 14,
    // @ts-expect-error web-only style
    outlineStyle: 'none',
  },
  titleInput: { fontSize: 22, fontWeight: '700', minHeight: 72, paddingVertical: 20 },
  cardNote: { minHeight: 20, paddingVertical: 0, textAlignVertical: 'top' , paddingTop:  10},
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 16,
  },
  label: {
    color: '#8E8E93',
    fontSize: 13,
    marginTop: 20,
    marginBottom: 6,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#FFFFFF',
    color: '#1C1C1E',
    fontSize: 17,
    padding: 14,
    borderRadius: 10,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center' },
  timeValue: { color: '#1C1C1E', fontSize: 17, marginLeft: 12 },
  timePickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  timePickerCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  timeDone: {
    marginTop: 16,
    backgroundColor: '#FF9500',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  timeDoneText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  repeatRow: { flexDirection: 'row', alignItems: 'stretch', width: '100%' },
  repeatInput: { flex: 1, flexShrink: 1, minWidth: 0 },
  unit: {
    backgroundColor: '#FFFFFF',
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
  modeRow: { flexDirection: 'row', width: '100%' },
  mode: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  modeOn: { backgroundColor: '#FF9500' },
  modeText: { color: '#1C1C1E', fontWeight: '600', fontSize: 15 },
  modeTextOn: { color: '#FFFFFF' },
  daysWrap: { marginTop: 12, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 12 },
});
