import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { ShiftSlot, Member, WeekDays } from '../../types';
import { ShiftCell } from './ShiftCell';
import { AssignModal } from './AssignModal';

const DAY_LABELS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

interface Props {
  weekDates: string[];
  days: WeekDays;
  shiftSlots: ShiftSlot[];
  members: Member[];
  isAdmin: boolean;
  currentMemberId?: string;
  onAssign: (date: string, slotId: string, memberId: string) => void;
  onRemove: (date: string, slotId: string, memberId: string) => void;
  onApplyWeek: (slotId: string, memberIds: string[]) => void;
}

interface SelectedCell { date: string; slotId: string; slotLabel: string }

export function WeekGrid({
  weekDates, days, shiftSlots, members,
  isAdmin, currentMemberId, onAssign, onRemove, onApplyWeek,
}: Props) {
  const [selected, setSelected] = useState<SelectedCell | null>(null);

  const assignedIds = selected
    ? (days[selected.date]?.[selected.slotId] ?? [])
    : [];

  const handleToggle = (memberId: string) => {
    if (!selected) return;
    const ids = days[selected.date]?.[selected.slotId] ?? [];
    if (ids.includes(memberId)) {
      onRemove(selected.date, selected.slotId, memberId);
    } else {
      onAssign(selected.date, selected.slotId, memberId);
    }
  };

  const handleApplyWeek = () => {
    if (!selected) return;
    const ids = days[selected.date]?.[selected.slotId] ?? [];
    onApplyWeek(selected.slotId, ids);
  };

  return (
    <>
      <View style={styles.container}>
        {/* Day headers */}
        <View style={styles.headerRow}>
          <View style={styles.slotLabelCol} />
          {weekDates.map((date, i) => {
            const isToday = date === new Date().toISOString().split('T')[0];
            return (
              <View key={date} style={[styles.dayHeader, isToday && styles.todayHeader]}>
                <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>{DAY_LABELS[i]}</Text>
                <Text style={[styles.dayDate, isToday && styles.todayLabel]}>
                  {new Date(date).getDate()}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Slot rows */}
        {shiftSlots
          .slice()
          .sort((a, b) => a.order - b.order)
          .map(slot => (
            <View key={slot.id} style={styles.row}>
              <View style={styles.slotLabelCol}>
                <Text style={styles.slotLabelText} numberOfLines={1}>{slot.label}</Text>
                <Text style={styles.slotTime}>{slot.startTime}</Text>
              </View>
              {weekDates.map(date => {
                const memberIds = days[date]?.[slot.id] ?? [];
                const canEdit = isAdmin || true;
                return (
                  <ShiftCell
                    key={date}
                    memberIds={memberIds}
                    members={members}
                    canEdit={canEdit}
                    onPress={() => setSelected({ date, slotId: slot.id, slotLabel: slot.label })}
                  />
                );
              })}
            </View>
          ))}
      </View>

      {selected && (
        <AssignModal
          visible={!!selected}
          onClose={() => setSelected(null)}
          members={members}
          assignedIds={assignedIds}
          onToggle={handleToggle}
          onApplyWeek={handleApplyWeek}
          isAdmin={isAdmin}
          currentMemberId={currentMemberId}
          slotLabel={selected.slotLabel}
          date={selected.date}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', marginBottom: 4 },
  slotLabelCol: { width: 44, justifyContent: 'center', alignItems: 'center' },
  dayHeader: {
    flex: 1, alignItems: 'center', paddingVertical: 5,
    borderRadius: 6, marginHorizontal: 1,
  },
  todayHeader: { backgroundColor: COLORS.primary },
  dayLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary },
  dayDate: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  todayLabel: { color: '#fff' },
  row: { flexDirection: 'row', flex: 1, marginBottom: 2 },
  slotLabelText: { fontSize: 11, fontWeight: '700', color: COLORS.textPrimary },
  slotTime: { fontSize: 9, color: COLORS.textSecondary },
});
