/**
 * Browser Notification API wrapper.
 * Works on localhost without HTTPS.
 */

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export function fireNotification(title: string, body: string, tag?: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  new Notification(title, {
    body,
    tag: tag ?? 'job-tracker-reminder',
    icon: '/favicon.ico',
  });
}

export function canNotify(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}
