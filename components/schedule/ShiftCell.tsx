import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { Member } from '../../types';

interface Props {
  memberIds: string[];
  members: Member[];
  onPress: () => void;
  canEdit: boolean;
}

export function ShiftCell({ memberIds, members, onPress, canEdit }: Props) {
  const assigned = memberIds
    .map(id => members.find(m => m.id === id))
    .filter(Boolean) as Member[];

  return (
    <TouchableOpacity
      style={[styles.cell, assigned.length > 0 && styles.filled]}
      onPress={canEdit ? onPress : undefined}
      activeOpacity={canEdit ? 0.7 : 1}
    >
      {assigned.length === 0
        ? <Text style={styles.empty}>+</Text>
        : assigned.map(m => (
            <View key={m.id} style={[styles.badge, { backgroundColor: m.color }]}>
              <Text style={styles.badgeText} numberOfLines={1}>
                {m.name.split(' ')[0]}
              </Text>
            </View>
          ))}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 5,
    margin: 1,
    padding: 2,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    flexDirection: 'row',
    gap: 1,
  },
  filled: { backgroundColor: COLORS.primaryLight },
  empty: { fontSize: 20, color: COLORS.border, fontWeight: '300' },
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: '100%',
  },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: '600' },
});
