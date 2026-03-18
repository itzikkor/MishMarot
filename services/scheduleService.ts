import {
  doc, getDoc, setDoc, updateDoc, onSnapshot, Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { WeekSchedule, WeekDays } from '../types';

export function getWeekId(date: Date): string {
  const d = new Date(date);
  // ISO week number
  d.setHours(0, 0, 0, 0);
  const dayOfWeek = d.getDay(); // 0=Sun
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - dayOfWeek);

  const jan1 = new Date(sunday.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((sunday.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${sunday.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export function getWeekStartDate(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - d.getDay());
  return sunday.toISOString().split('T')[0];
}

export function getWeekDates(startDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function scheduleDocRef(orgId: string, weekId: string) {
  return doc(db, 'organizations', orgId, 'schedules', weekId);
}

export async function getOrCreateWeekSchedule(
  orgId: string,
  weekId: string,
  startDate: string,
): Promise<WeekSchedule> {
  const ref = scheduleDocRef(orgId, weekId);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as WeekSchedule;

  const dates = getWeekDates(startDate);
  const days: WeekDays = {};
  for (const date of dates) days[date] = {};

  const schedule: WeekSchedule = { weekId, startDate, days };
  await setDoc(ref, schedule);
  return schedule;
}

export async function assignShift(
  orgId: string,
  weekId: string,
  date: string,
  slotId: string,
  memberId: string,
): Promise<void> {
  const ref = scheduleDocRef(orgId, weekId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data() as WeekSchedule;
  const current: string[] = data.days?.[date]?.[slotId] ?? [];
  if (current.includes(memberId)) return;

  await updateDoc(ref, {
    [`days.${date}.${slotId}`]: [...current, memberId],
  });
}

export async function removeShift(
  orgId: string,
  weekId: string,
  date: string,
  slotId: string,
  memberId: string,
): Promise<void> {
  const ref = scheduleDocRef(orgId, weekId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data() as WeekSchedule;
  const current: string[] = data.days?.[date]?.[slotId] ?? [];

  await updateDoc(ref, {
    [`days.${date}.${slotId}`]: current.filter(id => id !== memberId),
  });
}

export async function applyToFullWeek(
  orgId: string,
  weekId: string,
  slotId: string,
  memberIds: string[],
  weekDates: string[],
): Promise<void> {
  const ref = scheduleDocRef(orgId, weekId);
  const updates: Record<string, string[]> = {};
  for (const date of weekDates) {
    updates[`days.${date}.${slotId}`] = memberIds;
  }
  await updateDoc(ref, updates);
}

export async function setWeekLocked(
  orgId: string,
  weekId: string,
  isLocked: boolean,
): Promise<void> {
  await updateDoc(scheduleDocRef(orgId, weekId), { isLocked });
}

export function subscribeWeekSchedule(
  orgId: string,
  weekId: string,
  callback: (schedule: WeekSchedule | null) => void,
): Unsubscribe {
  return onSnapshot(scheduleDocRef(orgId, weekId), snap => {
    callback(snap.exists() ? (snap.data() as WeekSchedule) : null);
  });
}
