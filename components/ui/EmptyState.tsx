import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

interface Props {
  message: string;
  subtext?: string;
}

export function EmptyState({ message, subtext }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {subtext && <Text style={styles.subtext}>{subtext}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  message: { fontSize: 17, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center' },
  subtext: { marginTop: 8, fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
});
