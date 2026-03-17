import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface InviteRecord {
  orgId: string;
  name: string;
  email: string;
  memberId: string; // pre-assigned doc ID for the member
  used: boolean;
}

export async function createInvite(
  orgId: string,
  name: string,
  email: string,
  memberId: string,
): Promise<string> {
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await setDoc(doc(db, 'invites', token), {
    orgId, name, email, memberId, used: false, createdAt: serverTimestamp(),
  });
  return token;
}

export async function getInvite(token: string): Promise<InviteRecord | null> {
  const snap = await getDoc(doc(db, 'invites', token));
  if (!snap.exists()) return null;
  return snap.data() as InviteRecord;
}

export async function markInviteUsed(token: string): Promise<void> {
  await setDoc(doc(db, 'invites', token), { used: true }, { merge: true });
}

export function buildInviteLink(token: string): string {
  // Deep link: mishmarot://join?token=xxx
  return `mishmarot://join?token=${token}`;
}
