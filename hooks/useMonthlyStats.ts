import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { WeekSchedule } from '../types';

export function useMonthlyStats(orgId: string | null, year: number, month: number) {
  // month is 0-indexed (same as Date.getMonth())
  const [shiftCounts, setShiftCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    setIsLoading(true);

    const fetchStats = async () => {
      try {
        const snap = await getDocs(collection(db, 'organizations', orgId, 'schedules'));
        const counts: Record<string, number> = {};

        for (const docSnap of snap.docs) {
          const schedule = docSnap.data() as WeekSchedule;
          for (const [date, slots] of Object.entries(schedule.days)) {
            const d = new Date(date);
            if (d.getFullYear() !== year || d.getMonth() !== month) continue;
            for (const memberIds of Object.values(slots)) {
              for (const memberId of memberIds) {
                counts[memberId] = (counts[memberId] ?? 0) + 1;
              }
            }
          }
        }
        setShiftCounts(counts);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [orgId, year, month]);

  return { shiftCounts, isLoading };
}
