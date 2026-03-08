import { getDb } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await getDb();
  const collection = db.collection('push_subscriptions');

  // POST - save push subscription
  if (req.method === 'POST') {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'subscription is required' });
    }

    // Upsert by endpoint to avoid duplicates
    await collection.updateOne(
      { 'subscription.endpoint': subscription.endpoint },
      {
        $set: {
          subscription,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    return res.status(200).json({ success: true });
  }

  // DELETE - remove push subscription
  if (req.method === 'DELETE') {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ error: 'endpoint is required' });
    }

    await collection.deleteOne({ 'subscription.endpoint': endpoint });
    return res.status(200).json({ success: true });
  }

  // GET - list subscriptions (for cron job)
  if (req.method === 'GET') {
    const subs = await collection.find({}).toArray();
    return res.status(200).json(subs);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
