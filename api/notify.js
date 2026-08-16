import webpush from 'web-push';
import Redis from 'ioredis';

webpush.setVapidDetails(
  'mailto:info@theibizaexpert.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.NOTIFY_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { title, body, sellerId } = req.body;
  const redis = new Redis(process.env.REDIS_URL);

  try {
    let subscriberIds;

    if (sellerId) {
      // Send only to specific seller
      subscriberIds = [String(sellerId)];
    } else {
      // Broadcast to all subscribers
      subscriberIds = await redis.smembers('push_subscribers');
    }

    const results = await Promise.allSettled(
  subscriberIds.map(async (id) => {
    const sub = await redis.get(`push_sub_${id}`);
    if (!sub) {
      return { id, status: 'no_subscription' };
    }

    const subscription = JSON.parse(sub);

    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify({ title, body })
      );

      return { id, status: 'sent' };

    } catch (err) {
      console.error(
        `Push failed for seller ${id}:`,
        err.statusCode,
        err.message
      );

      throw err;
    }
  })
);

console.log(
  'PUSH RESULTS:',
  results.map((r, i) => ({
    sellerId: subscriberIds[i],
    result: r.status,
    error: r.status === 'rejected' ? r.reason?.message : null,
    statusCode: r.status === 'rejected' ? r.reason?.statusCode : null
  }))
);

    await redis.quit();
    return res.status(200).json({ ok: true, count: subscriberIds.length });
  } catch (e) {
    await redis.quit();
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
