import { useState, useEffect, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../services/firebase';
import { getOrganization } from '../services/orgService';
import { getMembers } from '../services/memberService';
import { Organization, Member } from '../types';

const ORG_ID_KEY = 'mishmarot:orgId';

export interface AuthState {
  user: User | null;
  org: Organization | null;
  currentMember: Member | null;
  isAdmin: boolean;
  isLoading: boolean;
  orgId: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    org: null,
    currentMember: null,
    isAdmin: false,
    isLoading: true,
    orgId: null,
  });

  const loadOrgData = useCallback(async (user: User) => {
    try {
      const orgId = await AsyncStorage.getItem(ORG_ID_KEY);
      if (!orgId) {
        setState(s => ({ ...s, user, isLoading: false, org: null, orgId: null }));
        return;
      }
      const org = await getOrganization(orgId);
      if (!org) {
        setState(s => ({ ...s, user, isLoading: false, org: null, orgId: null }));
        return;
      }
      const members = await getMembers(orgId);
      const currentMember = members.find(m => m.id === user.uid) ?? null;
      const isAdmin = org.adminUid === user.uid;
      setState({ user, org, currentMember, isAdmin, isLoading: false, orgId });
    } catch {
      setState(s => ({ ...s, user, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (user) {
        loadOrgData(user);
      } else {
        setState({ user: null, org: null, currentMember: null, isAdmin: false, isLoading: false, orgId: null });
      }
    });
    return unsub;
  }, [loadOrgData]);

  const setOrgId = useCallback(async (orgId: string) => {
    await AsyncStorage.setItem(ORG_ID_KEY, orgId);
    if (state.user) await loadOrgData(state.user);
  }, [state.user, loadOrgData]);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(ORG_ID_KEY);
    await signOut(auth);
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const registerWithEmail = useCallback(async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  }, []);

  return { ...state, setOrgId, logout, loginWithEmail, registerWithEmail, reload: () => state.user && loadOrgData(state.user) };
}
