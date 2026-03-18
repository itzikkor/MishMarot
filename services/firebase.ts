import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Primary app — used by the logged-in admin/member
const app = getApps().find(a => a.name === '[DEFAULT]') ?? initializeApp(firebaseConfig);

// Secondary app — used only to create new user accounts without signing out the admin
export const secondaryApp =
  getApps().find(a => a.name === 'secondary') ?? initializeApp(firebaseConfig, 'secondary');

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const secondaryAuth = getAuth(secondaryApp);
export default app;
