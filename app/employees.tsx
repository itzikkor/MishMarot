import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../services/firebase';
import { useMembers } from '../hooks/useMembers';
import { useMonthlyStats } from '../hooks/useMonthlyStats';
import { removeMember } from '../services/memberService';
import { COLORS } from '../constants/colors';
import { Button } from '../components/ui/Button';
import { Member } from '../types';

const ORG_ID_KEY = 'mishmarot:orgId';

export default function EmployeesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ORG_ID_KEY).then(setOrgId);
  }, []);

  const { members, isLoading } = useMembers(orgId);
  const now = new Date();
  const { shiftCounts } = useMonthlyStats(orgId, now.getFullYear(), now.getMonth());

  const handleDelete = (member: Member) => {
    if (member.id === auth.currentUser?.uid) {
      Alert.alert('שגיאה', 'לא ניתן למחוק את עצמך');
      return;
    }
    Alert.alert('מחיקת עובד', `האם למחוק את ${member.name}?`, [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: async () => {
          if (orgId) await removeMember(orgId, member.id);
        },
      },
    ]);
  };

  const monthName = now.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← חזור</Text>
        </TouchableOpacity>
        <Text style={styles.title}>הצוות</Text>
        <TouchableOpacity onPress={() => router.push('/invite')}>
          <Text style={styles.addBtn}>+ הזמן</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.monthLabel}>משמרות ב{monthName}</Text>

      <FlatList
        data={members}
        keyExtractor={m => m.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.email}>{item.email}</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{shiftCounts[item.id] ?? 0}</Text>
              <Text style={styles.countLabel}>משמרות</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>🗑</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  back: { fontSize: 15, color: COLORS.primary },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  addBtn: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  monthLabel: {
    fontSize: 13, color: COLORS.textSecondary, textAlign: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  list: { padding: 16, gap: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 14,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4,
  },
  dot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  email: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  countBadge: { alignItems: 'center', marginRight: 12 },
  countText: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  countLabel: { fontSize: 10, color: COLORS.textSecondary },
  deleteBtn: { padding: 6 },
  deleteText: { fontSize: 18 },
});
