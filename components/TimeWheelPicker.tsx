import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

const ROW_H = 44;
const VISIBLE_ROWS = 5; // odd
const HEIGHT = ROW_H * VISIBLE_ROWS;
const PAD = (HEIGHT - ROW_H) / 2;

type Props = {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
  minuteStep?: number;
};

export function TimeWheelPicker({ hour, minute, onChange, minuteStep = 5 }: Props) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: Math.floor(60 / minuteStep) }, (_, i) => i * minuteStep);
  const snappedMinute = minutes.includes(minute)
    ? minute
    : minutes.reduce((a, b) => (Math.abs(b - minute) < Math.abs(a - minute) ? b : a), minutes[0]);

  return (
    <View style={styles.row}>
      <View pointerEvents="none" style={styles.centerPill} />
      <WheelColumn data={hours} value={hour} onChange={(v) => onChange(v, snappedMinute)} />
      <WheelColumn data={minutes} value={snappedMinute} onChange={(v) => onChange(hour, v)} />
    </View>
  );
}

function WheelColumn({
  data,
  value,
  onChange,
}: {
  data: number[];
  value: number;
  onChange: (v: number) => void;
}) {
  const ref = useRef<ScrollView>(null);
  const idx = Math.max(0, data.indexOf(value));
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastY = useRef(0);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    ref.current?.scrollTo({ y: idx * ROW_H, animated: false });
    lastY.current = idx * ROW_H;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  useEffect(() => {
    return () => {
      if (stopTimer.current) clearTimeout(stopTimer.current);
    };
  }, []);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    lastY.current = y;
    if (stopTimer.current) clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(() => {
      const i = Math.round(lastY.current / ROW_H);
      const clamped = Math.max(0, Math.min(data.length - 1, i));
      const snappedY = clamped * ROW_H;
      if (Math.abs(lastY.current - snappedY) > 0.5) {
        ref.current?.scrollTo({ y: snappedY, animated: true });
      }
      if (data[clamped] !== valueRef.current) onChange(data[clamped]);
    }, 120);
  };

  return (
    <ScrollView
      ref={ref}
      style={styles.col}
      contentContainerStyle={{ paddingVertical: PAD }}
      showsVerticalScrollIndicator={false}
      snapToInterval={ROW_H}
      decelerationRate="fast"
      scrollEventThrottle={16}
      onScroll={handleScroll}
    >
      {data.map((v) => (
        <View key={v} style={styles.cell}>
          <Text style={[styles.cellText, v === value && styles.cellTextActive]}>
            {v.toString().padStart(2, '0')}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', height: HEIGHT, position: 'relative' },
  col: { flex: 1 },
  cell: { height: ROW_H, alignItems: 'center', justifyContent: 'center' },
  cellText: { fontSize: 22, color: '#C7C7CC', fontWeight: '500' },
  cellTextActive: { color: '#1C1C1E', fontWeight: '700' },
  centerPill: {
    position: 'absolute',
    top: PAD,
    left: 0,
    right: 0,
    height: ROW_H,
    backgroundColor: 'rgba(120,120,128,0.12)',
    borderRadius: 10,
  },
});
