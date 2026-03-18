import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { getOrganization } from '../services/orgService';
import { getMembers } from '../services/memberService';
import { COLORS } from '../constants/colors';
import { WeekSchedule, Member, ShiftSlot, Organization } from '../types';

const ORG_ID_KEY = 'mishmarot:orgId';

interface ShiftEntry {
  date: string;
  slotLabel: string;
  memberName?: string;
  memberColor?: string;
}

interface MonthGroup {
  label: string;   // e.g. "מרץ 2026"
  entries: ShiftEntry[];
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState<MonthGroup[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    const load = async () => {
      const orgId = await AsyncStorage.getItem(ORG_ID_KEY);
      const user = auth.currentUser;
      if (!orgId || !user) return;

      const [org, ms] = await Promise.all([
        getOrganization(orgId),
        getMembers(orgId),
      ]);
      if (!org) return;

      const admin = org.adminUid === user.uid;
      setIsAdmin(admin);
      setMembers(ms);
      setSelectedMemberId(admin ? null : user.uid);

      await fetchHistory(orgId, org, ms, admin ? null : user.uid);
      setLoading(false);
    };
    load();
  }, []);

  const fetchHistory = async (
    orgId: string,
    org: Organization,
    ms: Member[],
    filterUid: string | null,
  ) => {
    const snap = await getDocs(collection(db, 'organizations', orgId, 'schedules'));
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 6);

    const entries: ShiftEntry[] = [];

    for (const docSnap of snap.docs) {
      const schedule = docSnap.data() as WeekSchedule;
      for (const [date, slots] of Object.entries(schedule.days)) {
        const d = new Date(date);
        if (d < cutoff) continue;
        for (const [slotId, memberIds] of Object.entries(slots)) {
          const slot = org.settings.shiftSlots.find(s => s.id === slotId);
          if (!slot) continue;

          for (const uid of memberIds) {
            if (filterUid && uid !== filterUid) continue;
            const member = ms.find(m => m.id === uid);
            entries.push({
              date,
              slotLabel: slot.label,
              memberName: member?.name,
              memberColor: member?.color,
            });
          }
        }
      }
    }

    // Sort by date descending
    entries.sort((a, b) => b.date.localeCompare(a.date));

    // Group by month
    const grouped: Record<string, ShiftEntry[]> = {};
    for (const e of entries) {
      const d = new Date(e.date);
      const key = d.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(e);
    }

    setMonths(Object.entries(grouped).map(([label, ents]) => ({ label, entries: ents })));
  };

  const handleMemberFilter = async (uid: string | null) => {
    setSelectedMemberId(uid);
    setLoading(true);
    const orgId = await AsyncStorage.getItem(ORG_ID_KEY);
    if (!orgId) return;
    const org = await getOrganization(orgId);
    if (!org) return;
    await fetchHistory(orgId, org, members, uid);
    setLoading(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← חזור</Text>
        </TouchableOpacity>
        <Text style={styles.title}>היסטוריית משמרות</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Admin member filter */}
      {isAdmin && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
          <TouchableOpacity
            style={[styles.filterChip, selectedMemberId === null && styles.filterChipActive]}
            onPress={() => handleMemberFilter(null)}
          >
            <Text style={[styles.filterChipText, selectedMemberId === null && styles.filterChipTextActive]}>
              כולם
            </Text>
          </TouchableOpacity>
          {members.map(m => (
            <TouchableOpacity
              key={m.id}
              style={[styles.filterChip, selectedMemberId === m.id && styles.filterChipActive, { borderColor: m.color }]}
              onPress={() => handleMemberFilter(m.id)}
            >
              <View style={[styles.dot, { backgroundColor: m.color }]} />
              <Text style={[styles.filterChipText, selectedMemberId === m.id && styles.filterChipTextActive]}>
                {m.name.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {loading
        ? <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>
        : months.length === 0
          ? <View style={styles.center}><Text style={styles.empty}>אין משמרות ב-6 החודשים האחרונים</Text></View>
          : (
            <ScrollView contentContainerStyle={styles.list}>
              {months.map(month => (
                <View key={month.label} style={styles.monthGroup}>
                  <Text style={styles.monthLabel}>{month.label}</Text>
                  {month.entries.map((e, i) => (
                    <View key={i} style={styles.row}>
                      <View style={styles.rowLeft}>
                        <Text style={styles.dateText}>
                          {new Date(e.date).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </Text>
                        <View style={[styles.slotBadge]}>
                          <Text style={styles.slotText}>{e.slotLabel}</Text>
                        </View>
                      </View>
                      {isAdmin && e.memberName && (
                        <View style={styles.memberBadge}>
                          <View style={[styles.dot, { backgroundColor: e.memberColor }]} />
                          <Text style={styles.memberName}>{e.memberName}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          )}
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
  back: { fontSize: 15, color: COLORS.primary, width: 60 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  filterBar: { maxHeight: 52, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
  filterContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 13, color: COLORS.textPrimary },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { fontSize: 15, color: COLORS.textSecondary },
  list: { padding: 16, gap: 16 },
  monthGroup: {},
  monthLabel: {
    fontSize: 15, fontWeight: '800', color: COLORS.primary,
    marginBottom: 8, textAlign: 'right',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, borderRadius: 10, padding: 12, marginBottom: 6,
    borderWidth: 1, borderColor: COLORS.border,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
  slotBadge: {
    backgroundColor: COLORS.primaryLight, paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 6,
  },
  slotText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  memberBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  memberName: { fontSize: 13, color: COLORS.textSecondary },
});
