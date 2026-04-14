import { View, StyleSheet } from 'react-native';

export function ClockIcon({ size = 22, color = '#8E8E93' }: { size?: number; color?: string }) {
  const border = Math.max(1, size / 14);
  const handThickness = Math.max(1, size / 18);
  const minuteLen = size * 0.32;
  const hourLen = size * 0.22;
  return (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: border,
          borderColor: color,
        },
      ]}
    >
      {/* Minute hand — vertical, pointing up from center */}
      <View
        style={[
          styles.hand,
          {
            width: handThickness,
            height: minuteLen,
            backgroundColor: color,
            top: size / 2 - minuteLen,
            left: size / 2 - handThickness / 2 - border,
          },
        ]}
      />
      {/* Hour hand — horizontal, pointing right from center */}
      <View
        style={[
          styles.hand,
          {
            width: hourLen,
            height: handThickness,
            backgroundColor: color,
            top: size / 2 - handThickness / 2 - border,
            left: size / 2 - border,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { position: 'relative' },
  hand: { position: 'absolute', borderRadius: 1 },
});
