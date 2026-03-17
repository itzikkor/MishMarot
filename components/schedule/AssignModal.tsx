import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Pressable,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { Member } from '../../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  members: Member[];
  assignedIds: string[];
  onToggle: (memberId: string) => void;
  onApplyWeek: () => void;
  isAdmin: boolean;
  currentMemberId?: string;
  slotLabel: string;
  date: string;
}

export function AssignModal({
  visible, onClose, members, assignedIds, onToggle,
  onApplyWeek, isAdmin, currentMemberId, slotLabel, date,
}: Props) {
  const displayDate = new Date(date).toLocaleDateString('he-IL', {
    weekday: 'long', day: 'numeric', month: 'short',
  });

  const editableMembers = isAdmin
    ? members
    : members.filter(m => m.id === currentMemberId);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>{slotLabel}</Text>
          <Text style={styles.subtitle}>{displayDate}</Text>

          <ScrollView style={styles.list}>
            {editableMembers.map(member => {
              const assigned = assignedIds.includes(member.id);
              const isSelf = member.id === currentMemberId;
              const canToggle = isAdmin || (isSelf && !assigned) || (isSelf && assigned);

              return (
                <TouchableOpacity
                  key={member.id}
                  style={[styles.row, assigned && styles.rowAssigned]}
                  onPress={() => canToggle && onToggle(member.id)}
                  activeOpacity={canToggle ? 0.7 : 1}
                >
                  <View style={[styles.dot, { backgroundColor: member.color }]} />
                  <Text style={styles.name}>{member.name}</Text>
                  {assigned && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {isAdmin && (
            <TouchableOpacity style={styles.weekBtn} onPress={() => { onApplyWeek(); onClose(); }}>
              <Text style={styles.weekBtnText}>החל לכל השבוע</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>סגור</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '75%',
  },
  handle: {
    width: 40, height: 4, backgroundColor: COLORS.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 16 },
  list: { maxHeight: 300 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  rowAssigned: { backgroundColor: COLORS.primaryLight, borderRadius: 8, paddingHorizontal: 8 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  name: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  check: { fontSize: 16, color: COLORS.primary, fontWeight: '700' },
  weekBtn: {
    marginTop: 16, padding: 14, backgroundColor: COLORS.primaryLight,
    borderRadius: 10, alignItems: 'center',
  },
  weekBtnText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  closeBtn: {
    marginTop: 10, padding: 14, alignItems: 'center',
  },
  closeBtnText: { fontSize: 14, color: COLORS.textSecondary },
});
