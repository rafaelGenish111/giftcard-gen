const { getDb } = require('./_db');
const { ObjectId } = require('mongodb');

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await getDb();
  const collection = db.collection('cards');

  // GET - list all cards (optional ?clientId= filter)
  if (req.method === 'GET') {
    const filter = { deleted: { $ne: true } };
    if (req.query.clientId) filter.clientId = req.query.clientId;
    const cards = await collection.find(filter).sort({ createdAt: -1 }).toArray();
    return res.status(200).json(cards);
  }

  // POST - create new card
  if (req.method === 'POST') {
    const { recipient, recipientPhone, duration, validUntil, blessing, buyerName, isPaid, clientId } = req.body;

    const card = {
      recipient,
      recipientPhone,
      duration,
      validUntil,
      blessing: blessing || '',
      buyerName: buyerName || '',
      isPaid: !!isPaid,
      createdAt: new Date(),
    };
    if (clientId) card.clientId = clientId;

    const result = await collection.insertOne(card);
    return res.status(201).json({ ...card, _id: result.insertedId });
  }

  // PATCH - update card (e.g. toggle paid)
  if (req.method === 'PATCH') {
    const { id, ...updates } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
