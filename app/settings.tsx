import { useState, useEffect } from 'react';
import {
  View, Text, Switch, ScrollView, StyleSheet, Alert, TouchableOpacity, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getOrganization, updateShiftSlots, updateNotificationsEnabled, updateOrgPhoto } from '../services/orgService';
import { ShiftSlotEditor } from '../components/settings/ShiftSlotEditor';
import { Button } from '../components/ui/Button';
import { COLORS } from '../constants/colors';
import { ShiftSlot, Organization } from '../types';
import { auth, storage } from '../services/firebase';
import { signOut } from 'firebase/auth';

const ORG_ID_KEY = 'mishmarot:orgId';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [org, setOrg] = useState<Organization | null>(null);
  const [slots, setSlots] = useState<ShiftSlot[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('הרשאה נדרשת', 'יש לאפשר גישה לגלריה');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as ImagePicker.MediaType[],
      allowsEditing: true,
      quality: 0.7,
    });
    if (result.canceled || !org) return;

    setUploadingPhoto(true);
    try {
      const uri = result.assets[0].uri;
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `orgs/${org.id}/photo`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      await updateOrgPhoto(org.id, url);
      setOrg(o => o ? { ...o, photoUrl: url } : o);
      Alert.alert('נשמר', 'התמונה עודכנה');
    } catch (e: any) {
      Alert.alert('שגיאה', e.message ?? 'העלאת תמונה נכשלה');
    } finally {
      setUploadingPhoto(false);
    }
  };

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
        {/* Org info */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>שם ארגון</Text>
          <Text style={styles.orgName}>{org?.name}</Text>
          <Text style={styles.sectionHeader}>קוד ארגון (שתף עם עובדים)</Text>
          <Text style={styles.orgCode} selectable>{org?.id}</Text>
        </View>

        {/* Photo upload */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>תמונה לתצוגה מתחת ללוח</Text>
          {org?.photoUrl && (
            <Image source={{ uri: org.photoUrl }} style={styles.previewImage} resizeMode="cover" />
          )}
          <Button
            label={org?.photoUrl ? 'החלף תמונה' : 'העלה תמונה'}
            onPress={handlePickPhoto}
            loading={uploadingPhoto}
            variant="secondary"
            style={styles.photoBtn}
          />
        </View>

        {/* Shift slots */}
        <View style={styles.section}>
          <ShiftSlotEditor slots={slots} onChange={setSlots} />
        </View>

        {/* Notifications */}
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
        <Button label="התנתקות" onPress={handleLogout} variant="ghost" style={styles.logoutBtn} />
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
  previewImage: {
    width: '100%', height: 160, borderRadius: 10, marginBottom: 10,
  },
  photoBtn: { marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { fontSize: 15, color: COLORS.textPrimary },
  saveBtn: {},
  logoutBtn: { marginTop: 8 },
});
