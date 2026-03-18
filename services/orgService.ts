import {
  doc, setDoc, getDoc, updateDoc, collection, addDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Organization, OrgSettings, ShiftSlot, DEFAULT_SHIFT_SLOTS } from '../types';

export async function createOrganization(name: string, adminUid: string): Promise<Organization> {
  const settings: OrgSettings = {
    shiftSlots: DEFAULT_SHIFT_SLOTS,
    notificationsEnabled: true,
  };

  const orgRef = await addDoc(collection(db, 'organizations'), {
    name,
    adminUid,
    settings,
    createdAt: serverTimestamp(),
  });

  // Register admin in fast lookup so they can find their org on login
  await setDoc(doc(db, 'userOrgs', adminUid), { orgId: orgRef.id });

  return { id: orgRef.id, name, adminUid, settings };
}

export async function getOrganization(orgId: string): Promise<Organization | null> {
  const snap = await getDoc(doc(db, 'organizations', orgId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Organization;
}

export async function updateShiftSlots(orgId: string, shiftSlots: ShiftSlot[]): Promise<void> {
  await updateDoc(doc(db, 'organizations', orgId), {
    'settings.shiftSlots': shiftSlots,
  });
}

export async function updateNotificationsEnabled(orgId: string, enabled: boolean): Promise<void> {
  await updateDoc(doc(db, 'organizations', orgId), {
    'settings.notificationsEnabled': enabled,
  });
}

export async function updateOrgPhoto(orgId: string, photoUrl: string): Promise<void> {
  await updateDoc(doc(db, 'organizations', orgId), { photoUrl });
}
