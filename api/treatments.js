const { getDb } = require('./_db');
const { ObjectId } = require('mongodb');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await getDb();
  const collection = db.collection('treatments');

  // GET - list treatments for a client
  if (req.method === 'GET') {
    const { clientId } = req.query || {};
    const filter = { deleted: { $ne: true } };
    if (clientId) filter.clientId = clientId;

    const treatments = await collection.find(filter).sort({ date: -1 }).toArray();
    return res.status(200).json(treatments);
  }

  // POST - create treatment
  if (req.method === 'POST') {
    const { clientId, date, type, duration, price, isPaid, notes } = req.body;
    if (!clientId || !date || !type) return res.status(400).json({ error: 'clientId, date, and type are required' });

    const treatment = {
      clientId,
      date,
      type,
      duration: duration || '',
      price: price != null ? Number(price) : null,
      isPaid: !!isPaid,
      notes: notes || '',
      createdAt: new Date(),
    };

    const result = await collection.insertOne(treatment);
    return res.status(201).json({ ...treatment, _id: result.insertedId });
  }

  // PATCH - update treatment
  if (req.method === 'PATCH') {
    const { id, ...updates } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    await collection.updateOne({ _id: new ObjectId(id) }, { $set: updates });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
