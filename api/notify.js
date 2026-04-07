import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:info@theibizaexpert.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Simple in-memory store won't work across requests
// Instead we'll use a KV approach via fetch to Upstash REST API
async function getSubscribers() {
  const url = process.env.KV_REST_API_URL || process.env.REDIS_URL;
  const token = process.env.KV_REST_API_TOKEN;
  
  const r = await fetch(`${url}/smembers/push_subscribers`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await r.json();
  return data.result || [];
}

async function getSubscription(id) {
  const url = process.env.KV_REST_API_URL || process.env.REDIS_URL;
  const token = process.env.KV_REST_API_TOKEN;
  
  const r = await fetch(`${url}/get/push_sub_${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await r.json();
  return data.result ? JSON.parse(data.result) : null;
}

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

  const { title, body } = req.body;

  try {
    const subscriberIds = await getSubscribers();
    
    await Promise.allSettled(
      subscriberIds.map(async (id) => {
        const subscription = await getSubscription(id);
        if (!subscription) return;
        await webpush.sendNotification(subscription, JSON.stringify({ title, body }));
      })
    );

    return res.status(200).json({ ok: true, count: subscriberIds.length });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
