import {
  collection, doc, getDocs, setDoc, deleteDoc,
  onSnapshot, query, Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { Member, MEMBER_COLORS } from '../types';

function membersRef(orgId: string) {
  return collection(db, 'organizations', orgId, 'members');
}

export async function addMember(orgId: string, member: Omit<Member, 'color'>): Promise<Member> {
  const existing = await getDocs(membersRef(orgId));
  const color = MEMBER_COLORS[existing.size % MEMBER_COLORS.length];
  const fullMember: Member = { ...member, color };
  await setDoc(doc(membersRef(orgId), member.id), fullMember);
  return fullMember;
}

export async function updateMember(orgId: string, member: Member): Promise<void> {
  await setDoc(doc(membersRef(orgId), member.id), member, { merge: true });
}

export async function removeMember(orgId: string, memberId: string): Promise<void> {
  await deleteDoc(doc(membersRef(orgId), memberId));
}

export async function getMembers(orgId: string): Promise<Member[]> {
  const snap = await getDocs(membersRef(orgId));
  return snap.docs.map(d => d.data() as Member);
}

export function subscribeMembers(
  orgId: string,
  callback: (members: Member[]) => void,
): Unsubscribe {
  return onSnapshot(query(membersRef(orgId)), snap => {
    callback(snap.docs.map(d => d.data() as Member));
  });
}
