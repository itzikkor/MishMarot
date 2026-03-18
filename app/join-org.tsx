import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getOrganization } from '../services/orgService';
import { getUserOrgId } from '../services/memberService';
import { auth } from '../services/firebase';
import { COLORS } from '../constants/colors';
import { Button } from '../components/ui/Button';

const ORG_ID_KEY = 'mishmarot:orgId';

export default function JoinOrgScreen() {
  const router = useRouter();
  const [orgCode, setOrgCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    const code = orgCode.trim();
    if (!code) {
      Alert.alert('שגיאה', 'נא להזין קוד ארגון');
      return;
    }
    setLoading(true);
    try {
      const org = await getOrganization(code);
      if (!org) {
        Alert.alert('שגיאה', 'ארגון לא נמצא — בדוק את הקוד ונסה שוב');
        return;
      }
      await AsyncStorage.setItem(ORG_ID_KEY, code);
      router.replace('/schedule');
    } catch (e: any) {
      Alert.alert('שגיאה', e.message ?? 'חיבור נכשל');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const orgId = await getUserOrgId(user.uid);
      if (orgId) {
        await AsyncStorage.setItem(ORG_ID_KEY, orgId);
        router.replace('/schedule');
      } else {
        Alert.alert('לא נמצא ארגון', 'הארגון לא נמצא אוטומטית. בקש מהמנהל את קוד הארגון.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>📅</Text>
        <Text style={styles.title}>הצטרפות לארגון</Text>
        <Text style={styles.subtitle}>
          בקש מהמנהל את קוד הארגון והזן אותו כאן
        </Text>

        <TextInput
          style={styles.input}
          placeholder="קוד ארגון"
          value={orgCode}
          onChangeText={setOrgCode}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={COLORS.textSecondary}
        />

        <Button label="הצטרף" onPress={handleJoin} loading={loading} style={styles.btn} />

        <TouchableOpacity onPress={handleRetry} style={styles.retryBtn}>
          <Text style={styles.retryText}>נסה שוב אוטומטית</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/setup')} style={styles.retryBtn}>
          <Text style={styles.adminText}>מנהל חדש? צור ארגון</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 28,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8,
  },
  logo: { fontSize: 48, textAlign: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginTop: 8 },
  subtitle: {
    fontSize: 13, color: COLORS.textSecondary, textAlign: 'center',
    marginTop: 6, marginBottom: 24, lineHeight: 20,
  },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14,
    fontSize: 15, color: COLORS.textPrimary, marginBottom: 12,
    backgroundColor: COLORS.background, textAlign: 'center',
    letterSpacing: 1,
  },
  btn: {},
  retryBtn: { marginTop: 16, alignItems: 'center' },
  retryText: { fontSize: 13, color: COLORS.primary },
  adminText: { fontSize: 13, color: COLORS.textSecondary },
});
