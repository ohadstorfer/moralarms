import { View, Text, Pressable, StyleSheet } from 'react-native';

type Props = {
  title: string;
  onCancel: () => void;
  onSave: () => void;
  canSave: boolean;
};

export function SheetHeader({ title, onCancel, onSave, canSave }: Props) {
  return (
    <View style={styles.row}>
      <Pressable style={[styles.circle, styles.circleInactive]} onPress={onCancel} hitSlop={8}>
        <Text style={styles.xGlyph}>✕</Text>
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <Pressable
        style={[styles.circle, canSave ? styles.circleActive : styles.circleInactive]}
        onPress={onSave}
        disabled={!canSave}
        hitSlop={8}
      >
        <Text style={[styles.vGlyph, canSave && styles.vGlyphActive]}>✓</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#1C1C1E',
    fontSize: 17,
    fontWeight: '700',
    marginHorizontal: 8,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: { backgroundColor: '#FF9500' },
  circleInactive: { backgroundColor: '#E5E5EA' },
  xGlyph: { color: '#1C1C1E', fontSize: 18, fontWeight: '700', lineHeight: 20 },
  vGlyph: { color: '#8E8E93', fontSize: 20, fontWeight: '800', lineHeight: 20 },
  vGlyphActive: { color: '#FFFFFF' },
});
