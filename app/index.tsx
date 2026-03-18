import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { collectionGroup, query, where, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../services/firebase';
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

      // Check cached org first
      const cached = await AsyncStorage.getItem(ORG_ID_KEY);
      if (cached) {
        router.replace('/schedule');
        return;
      }

      // Look up org by UID in members subcollection
      try {
        const snap = await getDocs(
          query(collectionGroup(db, 'members'), where('id', '==', user.uid))
        );
        if (!snap.empty) {
          const orgId = snap.docs[0].ref.parent.parent!.id;
          await AsyncStorage.setItem(ORG_ID_KEY, orgId);
          router.replace('/schedule');
        } else {
          // No org found — must be a new admin
          router.replace('/setup');
        }
      } catch {
        router.replace('/setup');
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
