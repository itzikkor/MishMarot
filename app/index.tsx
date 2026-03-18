import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../services/firebase';
import { getUserOrgId } from '../services/memberService';
import { COLORS } from '../constants/colors';

const ORG_ID_KEY = 'mishmarot:orgId';

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) {
        router.replace('/login');
        return;
      }

      // Use cached org if available
      const cached = await AsyncStorage.getItem(ORG_ID_KEY);
      if (cached) {
        router.replace('/schedule');
        return;
      }

      // Look up org via fast top-level document
      try {
        const orgId = await getUserOrgId(user.uid);
        if (orgId) {
          await AsyncStorage.setItem(ORG_ID_KEY, orgId);
          router.replace('/schedule');
        } else {
          // No org found — could be new admin or member whose record wasn't synced
          router.replace('/join-org');
        }
      } catch {
        router.replace('/join-org');
      }
    });
    return unsub;
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
});
