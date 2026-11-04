import type { ReminderNotification } from "@/lib/domain/reminders";

const ICON = "/icons/icon-192.png";

/**
 * Shows a notification through the service worker registration.
 *
 * `new Notification()` throws on Android Chrome and is unsupported in iOS
 * home-screen apps, so the registration is the only route that works on phones.
 * The constructor stays as a desktop fallback for when no worker is registered
 * (development builds).
 */
export async function deliverNotification(
  notification: ReminderNotification,
): Promise<boolean> {
  const options: NotificationOptions = {
    body: notification.body,
    tag: notification.tag,
    icon: ICON,
    badge: ICON,
    data: { url: "/app" },
  };

  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration) {
      await registration.showNotification(notification.title, options);
      return true;
    }
  } catch {
    // Fall through to the constructor.
  }

  try {
    new Notification(notification.title, options);
    return true;
  } catch {
    return false;
  }
}
