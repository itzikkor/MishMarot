import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, KeyboardAvoidingView,
  Platform, Alert, TouchableOpacity,
} from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { useRouter } from 'expo-router';
import { auth } from '../services/firebase';
import { COLORS } from '../constants/colors';
import { Button } from '../components/ui/Button';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('שגיאה', 'נא למלא אימייל וסיסמה');
      return;
    }
    setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      router.replace('/');
    } catch (e: any) {
      Alert.alert('שגיאה', e.message ?? 'התחברות נכשלה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.logo}>📅</Text>
        <Text style={styles.title}>MishMarot</Text>
        <Text style={styles.subtitle}>ניהול משמרות שבועי</Text>

        <TextInput
          style={styles.input}
          placeholder="אימייל"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={COLORS.textSecondary}
        />
        <TextInput
          style={styles.input}
          placeholder="סיסמה"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor={COLORS.textSecondary}
        />

        <Button
          label={isRegister ? 'הרשמה' : 'כניסה'}
          onPress={handleSubmit}
          loading={loading}
          style={styles.btn}
        />

        <TouchableOpacity onPress={() => setIsRegister(r => !r)} style={styles.toggle}>
          <Text style={styles.toggleText}>
            {isRegister ? 'כבר יש לי חשבון — כניסה' : 'אין לי חשבון — הרשמה'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 28, elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 },
  logo: { fontSize: 48, textAlign: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.primary, textAlign: 'center', marginTop: 8 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 28 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14,
    fontSize: 15, color: COLORS.textPrimary, marginBottom: 12,
    backgroundColor: COLORS.background, textAlign: 'right',
  },
  btn: { marginTop: 8 },
  toggle: { marginTop: 18, alignItems: 'center' },
  toggleText: { color: COLORS.primary, fontSize: 13 },
});
