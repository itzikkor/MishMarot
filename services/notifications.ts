import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ShiftSlot } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleShiftReminder(
  memberName: string,
  slot: ShiftSlot,
  shiftDate: string, // YYYY-MM-DD
): Promise<void> {
  const [h, m] = slot.startTime.split(':').map(Number);
  const date = new Date(shiftDate);
  date.setHours(h - 1, m, 0, 0); // 1 hour before

  if (date <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'MishMarot — תזכורת משמרת',
      body: `${memberName}, משמרת ${slot.label} מתחילה בשעה ${slot.startTime}`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
