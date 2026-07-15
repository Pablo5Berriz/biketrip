import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase/client';
import type { ServiceResult } from '@/types/database';

// ============================================================
// Service Notifications push (Expo)
// ============================================================

// Configuration du comportement des notifications en foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<ServiceResult<string>> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return { data: null, error: 'Permission refusée pour les notifications' };
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;

    // Sauvegarder le token dans le profil Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', user.id);
    }

    return { data: token, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement';
    return { data: null, error: message };
  }
}

export async function scheduleRideReminder(
  plannedDate: Date,
  trailName: string,
): Promise<ServiceResult<string>> {
  const trigger = new Date(plannedDate);
  trigger.setHours(trigger.getHours() - 1); // Rappel 1h avant

  if (trigger < new Date()) {
    return { data: null, error: 'La date est déjà passée' };
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🚴 Sortie bientôt !',
      body: `Ta sortie sur "${trailName}" commence dans 1 heure. Prépare ton équipement !`,
      data: { type: 'ride_reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: trigger,
    },
  });

  return { data: id, error: null };
}

export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: data ?? {} },
    trigger: null, // immédiat
  });
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void,
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

export function removeNotificationListener(
  subscription: Notifications.Subscription,
): void {
  Notifications.removeNotificationSubscription(subscription);
}
