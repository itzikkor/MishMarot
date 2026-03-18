import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../services/firebase';
import { useMembers } from '../hooks/useMembers';
import { useMonthlyStats } from '../hooks/useMonthlyStats';
import { removeMember, updateMember } from '../services/memberService';
import { COLORS } from '../constants/colors';
import { Member } from '../types';

const ORG_ID_KEY = 'mishmarot:orgId';

export default function EmployeesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ORG_ID_KEY).then(setOrgId);
  }, []);

  const { members } = useMembers(orgId);
  const now = new Date();
  const { shiftCounts } = useMonthlyStats(orgId, now.getFullYear(), now.getMonth());
  const monthName = now.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

  const handleToggleRole = (member: Member) => {
    if (member.id === auth.currentUser?.uid) {
      Alert.alert('שגיאה', 'לא ניתן לשנות את התפקיד שלך');
      return;
    }
    const newRole = member.role === 'admin' ? 'member' : 'admin';
    const label = newRole === 'admin' ? 'מנהל' : 'עובד';
    Alert.alert(
      'שינוי תפקיד',
      `האם להגדיר את ${member.name} כ${label}?`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'שנה',
          onPress: async () => {
            if (orgId) await updateMember(orgId, { ...member, role: newRole });
          },
        },
      ]
    );
  };

  const handleDelete = (member: Member) => {
    if (member.id === auth.currentUser?.uid) {
      Alert.alert('שגיאה', 'לא ניתן למחוק את עצמך');
      return;
    }
    Alert.alert('מחיקת עובד', `האם למחוק את ${member.name}?`, [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק', style: 'destructive',
        onPress: async () => { if (orgId) await removeMember(orgId, member.id); },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← חזור</Text>
        </TouchableOpacity>
        <Text style={styles.title}>הצוות</Text>
        <TouchableOpacity onPress={() => router.push('/invite')}>
          <Text style={styles.addBtn}>+ הוסף</Text>
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
            <TouchableOpacity
              style={[styles.roleBadge, item.role === 'admin' && styles.roleBadgeAdmin]}
              onPress={() => handleToggleRole(item)}
            >
              <Text style={[styles.roleText, item.role === 'admin' && styles.roleTextAdmin]}>
                {item.role === 'admin' ? 'מנהל' : 'עובד'}
              </Text>
            </TouchableOpacity>
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
  countBadge: { alignItems: 'center', marginRight: 10 },
  countText: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  countLabel: { fontSize: 10, color: COLORS.textSecondary },
  roleBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border, marginRight: 8,
  },
  roleBadgeAdmin: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  roleTextAdmin: { color: '#fff' },
  deleteBtn: { padding: 6 },
  deleteText: { fontSize: 18 },
});
