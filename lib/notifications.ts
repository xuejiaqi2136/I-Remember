import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { reminderCopy } from '@/lib/copy';
import type { ReminderRepeat, ReminderRule } from '@/lib/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice && Platform.OS === 'web') {
    return false;
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }
  const asked = await Notifications.requestPermissionsAsync();
  return Boolean(
    asked.granted || asked.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

function nextTriggerDate(atIso: string, repeat: ReminderRepeat): Date {
  const at = new Date(atIso);
  const now = new Date();
  if (repeat === 'once') return at;
  let cursor = new Date(at);
  while (cursor.getTime() <= now.getTime()) {
    if (repeat === 'daily') {
      cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    } else {
      cursor = new Date(cursor.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }
  return cursor;
}

export async function cancelReminder(notificationId?: string | null) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // ignore missing ids
  }
}

export async function scheduleMemoReminder(input: {
  memoId: string;
  title: string;
  rule: Omit<ReminderRule, 'notificationId'>;
}): Promise<ReminderRule | null> {
  const ok = await ensureNotificationPermission();
  if (!ok) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('gentle', {
      name: '温柔提醒',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const when = nextTriggerDate(input.rule.at, input.rule.repeat);
  const copy = reminderCopy(input.title);

  const trigger: Notifications.NotificationTriggerInput =
    input.rule.repeat === 'once'
      ? {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: when,
          channelId: Platform.OS === 'android' ? 'gentle' : undefined,
        }
      : input.rule.repeat === 'daily'
        ? {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: when.getHours(),
            minute: when.getMinutes(),
            channelId: Platform.OS === 'android' ? 'gentle' : undefined,
          }
        : {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: ((when.getDay() + 6) % 7) + 1, // expo: 1=Mon ... 7=Sun
            hour: when.getHours(),
            minute: when.getMinutes(),
            channelId: Platform.OS === 'android' ? 'gentle' : undefined,
          };

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: copy.title,
      body: copy.body,
      data: { memoId: input.memoId, kind: 'memo-reminder' },
      sound: false,
    },
    trigger,
  });

  return {
    at: when.toISOString(),
    repeat: input.rule.repeat,
    notificationId,
  };
}

export function addNotificationResponseListener(
  handler: (memoId: string) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const memoId = response.notification.request.content.data?.memoId;
    if (typeof memoId === 'string') handler(memoId);
  });
}
