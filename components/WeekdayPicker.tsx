import { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';

const DAYS = [
  { label: 'S', value: 0 },
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
];

export function WeekdayPicker({
  selected,
  onToggle,
}: {
  selected: Set<number>;
  onToggle: (day: number) => void;
}) {
  return (
    <View style={styles.row}>
      {DAYS.map((d, i) => (
        <DayCircle
          key={i}
          label={d.label}
          selected={selected.has(d.value)}
          onPress={() => onToggle(d.value)}
        />
      ))}
    </View>
  );
}

function DayCircle({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const anim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: selected ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [selected, anim]);

  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#C7C7CC', '#FF9500'],
  });

  return (
    <Pressable style={styles.col} onPress={onPress} hitSlop={6}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View style={[styles.circle, { borderColor }]}>
        <Animated.View style={[styles.dot, { transform: [{ scale: anim }] }]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  col: { alignItems: 'center', flex: 1 },
  label: { color: '#8E8E93', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#FF9500' },
});
