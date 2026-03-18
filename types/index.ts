export interface ShiftSlot {
  id: string;
  label: string;
  startTime: string; // "08:00"
  endTime: string;   // "16:00"
  order: number;
}

export interface Member {
  id: string;        // Firebase Auth UID or invite token
  name: string;
  email: string;
  role: 'admin' | 'member';
  color: string;
}

export interface OrgSettings {
  shiftSlots: ShiftSlot[];
  notificationsEnabled: boolean;
}

export interface Organization {
  id: string;
  name: string;
  adminUid: string;
  settings: OrgSettings;
}

// days keyed by YYYY-MM-DD, slots keyed by slotId → array of memberIds
export type DayAssignments = Record<string, string[]>;
export type WeekDays = Record<string, DayAssignments>;

export interface WeekSchedule {
  weekId: string;     // "2026-W12"
  startDate: string;  // Sunday YYYY-MM-DD
  days: WeekDays;
  isLocked?: boolean;
}

export const DEFAULT_SHIFT_SLOTS: ShiftSlot[] = [
  { id: 'morning', label: 'יום', startTime: '08:00', endTime: '16:00', order: 0 },
  { id: 'afternoon', label: 'צהריים', startTime: '12:00', endTime: '20:00', order: 1 },
  { id: 'night', label: 'לילה', startTime: '20:00', endTime: '08:00', order: 2 },
];

export const MEMBER_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
];
