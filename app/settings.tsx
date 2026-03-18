import { useState, useEffect } from 'react';
import {
  View, Text, Switch, ScrollView, StyleSheet, Alert, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getOrganization, updateShiftSlots, updateNotificationsEnabled } from '../services/orgService';
import { ShiftSlotEditor } from '../components/settings/ShiftSlotEditor';
import { Button } from '../components/ui/Button';
import { COLORS } from '../constants/colors';
import { ShiftSlot, Organization } from '../types';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';

const ORG_ID_KEY = 'mishmarot:orgId';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [org, setOrg] = useState<Organization | null>(null);
  const [slots, setSlots] = useState<ShiftSlot[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ORG_ID_KEY).then(async orgId => {
      if (!orgId) return;
      const o = await getOrganization(orgId);
      if (!o) return;
      setOrg(o);
      setSlots(o.settings.shiftSlots);
      setNotificationsEnabled(o.settings.notificationsEnabled);
    });
  }, []);

  const handleSave = async () => {
    if (!org) return;
    setSaving(true);
    try {
      await updateShiftSlots(org.id, slots);
      await updateNotificationsEnabled(org.id, notificationsEnabled);
      Alert.alert('נשמר', 'ההגדרות עודכנו בהצלחה');
    } catch (e: any) {
      Alert.alert('שגיאה', e.message ?? 'שמירה נכשלה');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem(ORG_ID_KEY);
    await signOut(auth);
    router.replace('/login');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← חזור</Text>
        </TouchableOpacity>
        <Text style={styles.title}>הגדרות</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>שם ארגון</Text>
          <Text style={styles.orgName}>{org?.name}</Text>
          <Text style={styles.sectionHeader}>קוד ארגון (שתף עם עובדים)</Text>
          <Text style={styles.orgCode} selectable>{org?.id}</Text>
        </View>

        <View style={styles.section}>
          <ShiftSlotEditor slots={slots} onChange={setSlots} />
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>התראות משמרת</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ true: COLORS.primary }}
            />
          </View>
        </View>

        <Button label="שמור הגדרות" onPress={handleSave} loading={saving} style={styles.saveBtn} />

        <Button
          label="התנתקות"
          onPress={handleLogout}
          variant="ghost"
          style={styles.logoutBtn}
        />
      </ScrollView>
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
  content: { padding: 20, gap: 16 },
  section: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 16,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4,
  },
  sectionHeader: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4 },
  orgName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  orgCode: {
    fontSize: 12, color: COLORS.textSecondary, fontFamily: 'monospace',
    backgroundColor: COLORS.background, padding: 8, borderRadius: 6,
    borderWidth: 1, borderColor: COLORS.border, marginTop: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { fontSize: 15, color: COLORS.textPrimary },
  saveBtn: {},
  logoutBtn: { marginTop: 8 },
});
