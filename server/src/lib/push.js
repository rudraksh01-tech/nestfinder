// Web Push: sends notifications to browsers that subscribed via the service worker.
import webpush from 'web-push';
import { PushSubscription } from '../models/PushSubscription.js';

export const pushEnabled = () => Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

let configured = false;
function configure() {
  if (configured) return;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:alerts@nestfinder.test', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  configured = true;
}

// Sends `payload` ({ title, body, url, tag }) to every device of the broker matching `filter`.
// Returns how many devices accepted it; subscriptions the push service reports as gone are deleted.
export async function pushToBroker(brokerId, payload, filter = {}) {
  if (!pushEnabled()) return 0;
  configure();
  const subs = await PushSubscription.find({ broker: brokerId, ...filter }).lean();
  const results = await Promise.allSettled(
    subs.map((s) => webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify(payload), { TTL: 24 * 3600 })),
  );
  const gone = subs.filter((s, i) => [404, 410].includes(results[i].reason?.statusCode)).map((s) => s._id);
  if (gone.length) await PushSubscription.deleteMany({ _id: { $in: gone } });
  for (const r of results) {
    if (r.status === 'rejected' && ![404, 410].includes(r.reason?.statusCode)) console.error('Push failed:', r.reason?.statusCode, r.reason?.body ?? r.reason?.message);
  }
  return results.filter((r) => r.status === 'fulfilled').length;
}
