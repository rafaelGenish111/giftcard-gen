import { getDb } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await getDb();
  const collection = db.collection('notification_settings');

  const DEFAULTS = {
    appointmentEnabled: true,
    appointmentHoursBefore: 24,
    birthdayEnabled: true,
    birthdayDaysBefore: 0,
  };

  // GET - get notification settings
  if (req.method === 'GET') {
    const settings = await collection.findOne({ _id: 'global' });
    return res.status(200).json(settings || DEFAULTS);
  }

  // PUT - update notification settings
  if (req.method === 'PUT') {
    const updates = req.body;
    const allowed = ['appointmentEnabled', 'appointmentHoursBefore', 'birthdayEnabled', 'birthdayDaysBefore'];
    const filtered = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) filtered[key] = updates[key];
    }

    await collection.updateOne(
      { _id: 'global' },
      { $set: { ...filtered, updatedAt: new Date() } },
      { upsert: true }
    );

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
