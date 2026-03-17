import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../services/firebase';
import { createOrganization } from '../services/orgService';
import { addMember } from '../services/memberService';
import { COLORS } from '../constants/colors';
import { Button } from '../components/ui/Button';

const ORG_ID_KEY = 'mishmarot:orgId';

export default function SetupScreen() {
  const router = useRouter();
  const [orgName, setOrgName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!orgName.trim() || !adminName.trim()) {
      Alert.alert('שגיאה', 'נא למלא שם ארגון ושם מנהל');
      return;
    }
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const org = await createOrganization(orgName.trim(), user.uid);
      await addMember(org.id, {
        id: user.uid,
        name: adminName.trim(),
        email: user.email ?? '',
        role: 'admin',
      });
      await AsyncStorage.setItem(ORG_ID_KEY, org.id);
      router.replace('/schedule');
    } catch (e: any) {
      Alert.alert('שגיאה', e.message ?? 'יצירת ארגון נכשלה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>יצירת ארגון חדש</Text>
        <Text style={styles.subtitle}>הגדר את הצוות שלך</Text>

        <Text style={styles.label}>שם הארגון / צוות</Text>
        <TextInput
          style={styles.input}
          placeholder="למשל: משמרות סניף תל אביב"
          value={orgName}
          onChangeText={setOrgName}
          placeholderTextColor={COLORS.textSecondary}
        />

        <Text style={styles.label}>שמך (מנהל)</Text>
        <TextInput
          style={styles.input}
          placeholder="שם מלא"
          value={adminName}
          onChangeText={setAdminName}
          placeholderTextColor={COLORS.textSecondary}
        />

        <Button label="צור ארגון" onPress={handleCreate} loading={loading} style={styles.btn} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 28, elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, textAlign: 'right' },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14,
    fontSize: 15, color: COLORS.textPrimary, marginBottom: 16,
    backgroundColor: COLORS.background, textAlign: 'right',
  },
  btn: { marginTop: 8 },
});
