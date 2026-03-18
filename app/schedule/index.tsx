import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
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
  const [locking, setLocking] = useState(false);

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
      const memberRecord = ms.find(m => m.id === user.uid);
      setIsAdmin(o.adminUid === user.uid || memberRecord?.role === 'admin');
      setBootstrapping(false);
    });
    return unsub;
  }, [router]);

  const {
    schedule, isLoading, weekDates, startDate,
    goToPrevWeek, goToNextWeek, assign, remove, applyWeek, lockWeek,
  } = useSchedule(org?.id ?? null);

  if (bootstrapping || isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  const shiftSlots: ShiftSlot[] = org?.settings.shiftSlots ?? [];
  const isLocked = schedule?.isLocked ?? false;

  const startFormatted = new Date(startDate).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  const endFormatted = endDate.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });

  const handleLogout = () => {
    Alert.alert('יציאה', 'האם להתנתק?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'התנתק', style: 'destructive', onPress: async () => {
          await AsyncStorage.removeItem(ORG_ID_KEY);
          await signOut(auth);
          router.replace('/login');
        },
      },
    ]);
  };

  const handleLockToggle = () => {
    if (isLocked) {
      Alert.alert('פתיחת משמרות', 'האם לאפשר שינויים שוב?', [
        { text: 'ביטול', style: 'cancel' },
        { text: 'פתח', onPress: async () => { setLocking(true); await lockWeek(false); setLocking(false); } },
      ]);
    } else {
      Alert.alert('אישור משמרות', 'לאחר האישור, העובדים לא יוכלו לשנות משמרות.', [
        { text: 'ביטול', style: 'cancel' },
        { text: 'אשר', onPress: async () => { setLocking(true); await lockWeek(true); setLocking(false); } },
      ]);
    }
  };

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
          <Text style={styles.weekRange}>{startFormatted} – {endFormatted}</Text>
          <TouchableOpacity onPress={goToNextWeek} style={styles.navBtn}>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          {isAdmin && (
            <TouchableOpacity onPress={() => router.push('/settings')}>
              <Text style={styles.headerAction}>⚙️</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutBtn}>יציאה</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lock status banner */}
      {isLocked && (
        <View style={styles.lockedBanner}>
          <Text style={styles.lockedText}>🔒 המשמרות אושרו</Text>
        </View>
      )}

      {/* Grid */}
      <View style={styles.gridContainer}>
        <WeekGrid
          weekDates={weekDates}
          days={schedule?.days ?? {}}
          shiftSlots={shiftSlots}
          members={members}
          isAdmin={isAdmin}
          isLocked={isLocked}
          currentMemberId={currentMember?.id}
          onAssign={assign}
          onRemove={remove}
          onApplyWeek={applyWeek}
        />
      </View>

      {/* Org photo */}
      {org?.photoUrl && (
        <Image source={{ uri: org.photoUrl }} style={styles.orgPhoto} resizeMode="cover" />
      )}

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={styles.historyBtn} onPress={() => router.push('/history')}>
          <Text style={styles.historyBtnText}>📋 היסטוריית משמרות</Text>
        </TouchableOpacity>
        {isAdmin && (
          <TouchableOpacity
            style={[styles.lockBtn, isLocked && styles.unlockBtn]}
            onPress={handleLockToggle}
            disabled={locking}
          >
            <Text style={styles.lockBtnText}>
              {locking ? '...' : isLocked ? '🔓 פתח משמרות' : '✅ אישור משמרות'}
            </Text>
          </TouchableOpacity>
        )}
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
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerAction: { fontSize: 22, padding: 4 },
  weekNav: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 24, color: COLORS.primary, fontWeight: '700' },
  weekRange: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoutBtn: { fontSize: 13, color: COLORS.error, fontWeight: '600', padding: 4 },
  lockedBanner: {
    backgroundColor: '#FEF3C7', paddingVertical: 6, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#FDE68A',
  },
  lockedText: { fontSize: 13, color: '#92400E', fontWeight: '600', textAlign: 'center' },
  gridContainer: { flex: 1, padding: 8 },
  orgPhoto: { width: '100%', height: 160, marginBottom: 0 },
  bottomBar: {
    flexDirection: 'row', gap: 8, padding: 12,
    backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingBottom: 12,
  },
  historyBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center',
  },
  historyBtnText: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '600' },
  lockBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    backgroundColor: COLORS.primary, alignItems: 'center',
  },
  unlockBtn: { backgroundColor: COLORS.warning ?? '#D97706' },
  lockBtnText: { fontSize: 13, color: '#fff', fontWeight: '700' },
});
