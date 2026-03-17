import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { ShiftSlot } from '../../types';
import { COLORS } from '../../constants/colors';

interface Props {
  slots: ShiftSlot[];
  onChange: (slots: ShiftSlot[]) => void;
}

function generateId() {
  return `slot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function ShiftSlotEditor({ slots, onChange }: Props) {
  const [newLabel, setNewLabel] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');

  const addSlot = () => {
    if (!newLabel.trim() || !newStart.trim() || !newEnd.trim()) {
      Alert.alert('שגיאה', 'נא למלא שם, שעת התחלה וסיום');
      return;
    }
    const slot: ShiftSlot = {
      id: generateId(),
      label: newLabel.trim(),
      startTime: newStart.trim(),
      endTime: newEnd.trim(),
      order: slots.length,
    };
    onChange([...slots, slot]);
    setNewLabel(''); setNewStart(''); setNewEnd('');
  };

  const removeSlot = (id: string) => {
    Alert.alert('מחיקת משמרת', 'האם למחוק את סוג המשמרת?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'מחק', style: 'destructive', onPress: () => onChange(slots.filter(s => s.id !== id)) },
    ]);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...slots];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onChange(updated.map((s, i) => ({ ...s, order: i })));
  };

  const moveDown = (index: number) => {
    if (index === slots.length - 1) return;
    const updated = [...slots];
    [updated[index + 1], updated[index]] = [updated[index], updated[index + 1]];
    onChange(updated.map((s, i) => ({ ...s, order: i })));
  };

  return (
    <View>
      <Text style={styles.sectionTitle}>סוגי משמרות</Text>

      {slots.sort((a, b) => a.order - b.order).map((slot, i) => (
        <View key={slot.id} style={styles.slotRow}>
          <View style={styles.slotInfo}>
            <Text style={styles.slotLabel}>{slot.label}</Text>
            <Text style={styles.slotTime}>{slot.startTime} – {slot.endTime}</Text>
          </View>
          <View style={styles.slotActions}>
            <TouchableOpacity onPress={() => moveUp(i)} style={styles.arrowBtn}>
              <Text style={styles.arrow}>↑</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => moveDown(i)} style={styles.arrowBtn}>
              <Text style={styles.arrow}>↓</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeSlot(slot.id)} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={styles.addForm}>
        <Text style={styles.addTitle}>הוסף משמרת</Text>
        <TextInput
          style={styles.input}
          placeholder="שם (למשל: בוקר)"
          value={newLabel}
          onChangeText={setNewLabel}
          placeholderTextColor={COLORS.textSecondary}
        />
        <View style={styles.timeRow}>
          <TextInput
            style={[styles.input, styles.timeInput]}
            placeholder="08:00"
            value={newStart}
            onChangeText={setNewStart}
            placeholderTextColor={COLORS.textSecondary}
          />
          <Text style={styles.dash}>–</Text>
          <TextInput
            style={[styles.input, styles.timeInput]}
            placeholder="16:00"
            value={newEnd}
            onChangeText={setNewEnd}
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={addSlot}>
          <Text style={styles.addBtnText}>+ הוסף</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  slotRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 10, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  slotInfo: { flex: 1 },
  slotLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  slotTime: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  slotActions: { flexDirection: 'row', gap: 6 },
  arrowBtn: { padding: 6 },
  arrow: { fontSize: 16, color: COLORS.primary },
  deleteBtn: { padding: 6 },
  deleteText: { fontSize: 16, color: COLORS.error },
  addForm: {
    backgroundColor: COLORS.primaryLight, borderRadius: 10, padding: 16, marginTop: 8,
  },
  addTitle: { fontSize: 14, fontWeight: '600', color: COLORS.primary, marginBottom: 10 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 10,
    fontSize: 14, color: COLORS.textPrimary, backgroundColor: COLORS.surface,
    marginBottom: 8, textAlign: 'right',
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: { flex: 1, marginBottom: 0 },
  dash: { fontSize: 16, color: COLORS.textSecondary },
  addBtn: {
    marginTop: 8, backgroundColor: COLORS.primary, borderRadius: 8,
    padding: 10, alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
