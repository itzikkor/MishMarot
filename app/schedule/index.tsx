import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { getOrganization } from '../../services/orgService';
import { getMembers } from '../../services/memberService';
import { useSchedule } from '../../hooks/useSchedule';
import { WeekGrid } from '../../components/schedule/WeekGrid';
import { COLORS } from '../../constants/colors';
import { Organization, Member, ShiftSlot } from '../../types';

const ORG_ID_KEY = 'mishmarot:orgId';

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) { router.replace('/login'); return; }
      const orgId = await AsyncStorage.getItem(ORG_ID_KEY);
      if (!orgId) { router.replace('/setup'); return; }
      const [o, ms] = await Promise.all([getOrganization(orgId), getMembers(orgId)]);
      if (!o) { router.replace('/setup'); return; }
      const me = ms.find(m => m.id === user.uid) ?? null;
      setOrg(o);
      setMembers(ms);
      setCurrentMember(me);
      setIsAdmin(o.adminUid === user.uid);
      setBootstrapping(false);
    });
    return unsub;
  }, [router]);

  const {
    schedule, isLoading, weekDates, startDate,
    goToPrevWeek, goToNextWeek, assign, remove, applyWeek,
  } = useSchedule(org?.id ?? null);

  if (bootstrapping || isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const shiftSlots: ShiftSlot[] = org?.settings.shiftSlots ?? [];

  const startFormatted = new Date(startDate).toLocaleDateString('he-IL', {
    day: 'numeric', month: 'long',
  });
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  const endFormatted = endDate.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/employees')} disabled={!isAdmin}>
          <Text style={styles.headerAction}>{isAdmin ? '👥' : '  '}</Text>
        </TouchableOpacity>
        <View style={styles.weekNav}>
          <TouchableOpacity onPress={goToPrevWeek} style={styles.navBtn}>
            <Text style={styles.navArrow}>‹</Text>
          </TouchableOpacity>
          <View style={styles.weekInfo}>
            <Text style={styles.weekRange}>{startFormatted} – {endFormatted}</Text>
          </View>
          <TouchableOpacity onPress={goToNextWeek} style={styles.navBtn}>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => router.push('/settings')} disabled={!isAdmin}>
          <Text style={styles.headerAction}>{isAdmin ? '⚙️' : '  '}</Text>
        </TouchableOpacity>
      </View>

      {/* Grid */}
      <View style={styles.gridContainer}>
        <WeekGrid
          weekDates={weekDates}
          days={schedule?.days ?? {}}
          shiftSlots={shiftSlots}
          members={members}
          isAdmin={isAdmin}
          currentMemberId={currentMember?.id}
          onAssign={assign}
          onRemove={remove}
          onApplyWeek={applyWeek}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerAction: { fontSize: 22, padding: 4 },
  weekNav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 24, color: COLORS.primary, fontWeight: '700' },
  weekInfo: { alignItems: 'center' },
  weekRange: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  gridContainer: { flex: 1, padding: 8 },
});
