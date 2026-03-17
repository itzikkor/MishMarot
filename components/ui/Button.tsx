import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { COLORS } from '../../constants/colors';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', loading, disabled, style }: Props) {
  const bg = variant === 'primary' ? COLORS.primary
    : variant === 'danger' ? COLORS.error
    : variant === 'ghost' ? 'transparent'
    : COLORS.surface;

  const textColor = (variant === 'secondary' || variant === 'ghost')
    ? COLORS.primary : '#fff';

  const border = variant === 'secondary' ? { borderWidth: 1, borderColor: COLORS.primary } : {};

  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: bg }, border, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
    >
      {loading
        ? <ActivityIndicator color={textColor} size="small" />
        : <Text style={[styles.label, { color: textColor }]}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 15, fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
