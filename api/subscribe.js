import Redis from 'ioredis';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const redis = new Redis(process.env.REDIS_URL);

  try {
    const { subscription, sellerId } = req.body;
    if (!subscription) return res.status(400).json({ error: 'No subscription' });

    await redis.set(`push_sub_${sellerId}`, JSON.stringify(subscription));
    await redis.sadd('push_subscribers', sellerId);
    await redis.quit();

    return res.status(200).json({ ok: true });
  } catch (e) {
    await redis.quit();
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
