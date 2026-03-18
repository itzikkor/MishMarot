import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { secondaryAuth } from '../services/firebase';
import { addMember } from '../services/memberService';
import { COLORS } from '../constants/colors';
import { Button } from '../components/ui/Button';

const ORG_ID_KEY = 'mishmarot:orgId';

export default function InviteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ORG_ID_KEY).then(setOrgId);
  }, []);

  const handleAdd = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('שגיאה', 'נא למלא שם, אימייל וסיסמה');
      return;
    }
    if (password.length < 6) {
      Alert.alert('שגיאה', 'הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    if (!orgId) return;

    setLoading(true);
    try {
      // Create Firebase Auth account using secondary app — admin stays logged in
      const credential = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password);
      const uid = credential.user.uid;

      // Sign out from secondary app immediately
      await signOut(secondaryAuth);

      // Add member to org in Firestore using the new UID
      await addMember(orgId, {
        id: uid,
        name: name.trim(),
        email: email.trim(),
        role: 'member',
      });

      Alert.alert('נוסף בהצלחה', `${name.trim()} נוסף לצוות.\n\nפרטי כניסה:\nאימייל: ${email.trim()}\nסיסמה: ${password}`);
      setName('');
      setEmail('');
      setPassword('');
    } catch (e: any) {
      const msg = e.code === 'auth/email-already-in-use'
        ? 'אימייל זה כבר רשום במערכת'
        : e.message ?? 'הוספת משתמש נכשלה';
      Alert.alert('שגיאה', msg);
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
        <Text style={styles.title}>הוספת עובד</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.hint}>
          הכנס את פרטי העובד. הוא יוכל להיכנס לאפליקציה עם האימייל והסיסמה שתגדיר כאן.
        </Text>

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

        <Text style={styles.label}>סיסמה (לפחות 6 תווים)</Text>
        <TextInput
          style={styles.input}
          placeholder="סיסמה זמנית"
          value={password}
          onChangeText={setPassword}
          placeholderTextColor={COLORS.textSecondary}
        />

        <Button label="הוסף עובד" onPress={handleAdd} loading={loading} style={styles.btn} />
      </ScrollView>
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
  hint: {
    fontSize: 13, color: COLORS.textSecondary, textAlign: 'right',
    marginBottom: 24, lineHeight: 20,
    backgroundColor: COLORS.primaryLight, padding: 12, borderRadius: 8,
  },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, textAlign: 'right' },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14,
    fontSize: 15, color: COLORS.textPrimary, marginBottom: 16,
    backgroundColor: COLORS.surface, textAlign: 'right',
  },
  btn: {},
});
