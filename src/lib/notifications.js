const VAPID_PUBLIC_KEY = 'BAlxPqS1rBwQLxFeix7Wu7ZTbWV9q9HcnGOO5Fi8CS2wC_uGYrFmoJK79d-Q8mwjup39xwISJDpl1FZ-jBCwExc';

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function getPermissionState() {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission; // 'default', 'granted', 'denied'
}

export async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready;

  // Check existing subscription
  let subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await saveSubscription(subscription);
    return subscription;
  }

  // Request permission and subscribe
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Permission denied');
  }

  subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  await saveSubscription(subscription);
  return subscription;
}

export async function unsubscribeFromPush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    // Remove from server
    await fetch('/api/push-subscriptions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    });
  }
}

export async function getCurrentSubscription() {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

async function saveSubscription(subscription) {
  await fetch('/api/push-subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
