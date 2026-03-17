import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../services/firebase';
import { getInvite, markInviteUsed } from '../services/inviteService';
import { addMember, updateMember } from '../services/memberService';
import { COLORS } from '../constants/colors';
import { Button } from '../components/ui/Button';

const ORG_ID_KEY = 'mishmarot:orgId';

export default function JoinScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [inviteData, setInviteData] = useState<{ name: string; orgId: string; memberId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setError('קישור לא תקין'); setLoading(false); return; }
    getInvite(token).then(inv => {
      if (!inv) { setError('הזמנה לא נמצאה'); }
      else if (inv.used) { setError('הזמנה זו כבר שומשה'); }
      else { setInviteData({ name: inv.name, orgId: inv.orgId, memberId: inv.memberId }); }
      setLoading(false);
    });
  }, [token]);

  const handleJoin = async () => {
    if (!inviteData || !auth.currentUser) return;
    setJoining(true);
    try {
      // Register the current user as the member
      await updateMember(inviteData.orgId, {
        id: auth.currentUser.uid,
        name: inviteData.name,
        email: auth.currentUser.email ?? '',
        role: 'member',
        color: '', // will be set by addMember logic
      });
      await markInviteUsed(token as string);
      await AsyncStorage.setItem(ORG_ID_KEY, inviteData.orgId);
      router.replace('/schedule');
    } catch (e: any) {
      Alert.alert('שגיאה', e.message ?? 'הצטרפות נכשלה');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>📅</Text>
        <Text style={styles.title}>הזמנה ל-MishMarot</Text>
        <Text style={styles.name}>{inviteData?.name}</Text>
        <Text style={styles.subtitle}>אתה מוזמן להצטרף לצוות</Text>
        <Button label="הצטרף לצוות" onPress={handleJoin} loading={joining} style={styles.btn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 28, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 },
  logo: { fontSize: 48 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginTop: 12 },
  name: { fontSize: 20, fontWeight: '800', color: COLORS.primary, marginTop: 8 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, marginBottom: 24 },
  btn: { width: '100%' },
  errorText: { fontSize: 16, color: COLORS.error },
});
