import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../services/firebase';
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
      const orgId = await AsyncStorage.getItem(ORG_ID_KEY);
      if (!orgId) {
        router.replace('/setup');
      } else {
        router.replace('/schedule');
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
