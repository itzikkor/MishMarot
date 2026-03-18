import { useState, useEffect, useCallback } from 'react';
import {
  subscribeWeekSchedule,
  getOrCreateWeekSchedule,
  assignShift,
  removeShift,
  applyToFullWeek,
  setWeekLocked,
  getWeekId,
  getWeekStartDate,
  getWeekDates,
} from '../services/scheduleService';
import { WeekSchedule } from '../types';

export function useSchedule(orgId: string | null) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedule, setSchedule] = useState<WeekSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const weekId = getWeekId(currentDate);
  const startDate = getWeekStartDate(currentDate);
  const weekDates = getWeekDates(startDate);

  useEffect(() => {
    if (!orgId) return;
    setIsLoading(true);
    getOrCreateWeekSchedule(orgId, weekId, startDate).then(s => {
      setSchedule(s);
      setIsLoading(false);
    });

    const unsub = subscribeWeekSchedule(orgId, weekId, s => {
      if (s) setSchedule(s);
      setIsLoading(false);
    });
    return unsub;
  }, [orgId, weekId, startDate]);

  const goToPrevWeek = useCallback(() => {
    setCurrentDate(d => {
      const nd = new Date(d);
      nd.setDate(d.getDate() - 7);
      return nd;
    });
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentDate(d => {
      const nd = new Date(d);
      nd.setDate(d.getDate() + 7);
      return nd;
    });
  }, []);

  const assign = useCallback(async (date: string, slotId: string, memberId: string) => {
    if (!orgId) return;
    await assignShift(orgId, weekId, date, slotId, memberId);
  }, [orgId, weekId]);

  const remove = useCallback(async (date: string, slotId: string, memberId: string) => {
    if (!orgId) return;
    await removeShift(orgId, weekId, date, slotId, memberId);
  }, [orgId, weekId]);

  const applyWeek = useCallback(async (slotId: string, memberIds: string[]) => {
    if (!orgId) return;
    await applyToFullWeek(orgId, weekId, slotId, memberIds, weekDates);
  }, [orgId, weekId, weekDates]);

  const lockWeek = useCallback(async (locked: boolean) => {
    if (!orgId) return;
    await setWeekLocked(orgId, weekId, locked);
  }, [orgId, weekId]);

  return {
    schedule,
    isLoading,
    weekId,
    startDate,
    weekDates,
    currentDate,
    goToPrevWeek,
    goToNextWeek,
    assign,
    remove,
    applyWeek,
    lockWeek,
  };
}
