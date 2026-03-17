import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, Share, KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createInvite, buildInviteLink } from '../services/inviteService';
import { addMember } from '../services/memberService';
import { COLORS } from '../constants/colors';
import { Button } from '../components/ui/Button';

const ORG_ID_KEY = 'mishmarot:orgId';

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function InviteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ORG_ID_KEY).then(setOrgId);
  }, []);

  const handleInvite = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('שגיאה', 'נא למלא שם ואימייל');
      return;
    }
    if (!orgId) return;
    setLoading(true);
    try {
      const memberId = generateId();
      // Pre-create member record (no UID yet — will be updated on join)
      await addMember(orgId, { id: memberId, name: name.trim(), email: email.trim(), role: 'member' });
      const token = await createInvite(orgId, name.trim(), email.trim(), memberId);
      const link = buildInviteLink(token);

      await Share.share({
        message: `הי ${name.trim()},\nהוזמנת ל-MishMarot!\n\nלחץ כאן להצטרפות:\n${link}`,
        title: 'הזמנה ל-MishMarot',
      });
      setName('');
      setEmail('');
    } catch (e: any) {
      Alert.alert('שגיאה', e.message ?? 'יצירת הזמנה נכשלה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← חזור</Text>
        </TouchableOpacity>
        <Text style={styles.title}>הזמנת עובד</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>שם עובד</Text>
        <TextInput
          style={styles.input}
          placeholder="שם מלא"
          value={name}
          onChangeText={setName}
          placeholderTextColor={COLORS.textSecondary}
        />

        <Text style={styles.label}>אימייל</Text>
        <TextInput
          style={styles.input}
          placeholder="email@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={COLORS.textSecondary}
        />

        <Text style={styles.hint}>
          יישלח קישור הזמנה לשיתוף — העובד ילחץ עליו ויצטרף לצוות.
        </Text>

        <Button label="שלח הזמנה" onPress={handleInvite} loading={loading} style={styles.btn} />
      </View>
    </KeyboardAvoidingView>
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
  form: { padding: 24 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, textAlign: 'right' },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14,
    fontSize: 15, color: COLORS.textPrimary, marginBottom: 16,
    backgroundColor: COLORS.surface, textAlign: 'right',
  },
  hint: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'right', marginBottom: 24, lineHeight: 20 },
  btn: {},
});
