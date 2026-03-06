const { getDb } = require('./_db');
const { ObjectId } = require('mongodb');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await getDb();
  const collection = db.collection('clients');

  // GET - list or single client
  if (req.method === 'GET') {
    const { id, search } = req.query || {};

    if (id) {
      const client = await collection.findOne({ _id: new ObjectId(id), deleted: { $ne: true } });
      if (!client) return res.status(404).json({ error: 'Client not found' });
      return res.status(200).json(client);
    }

    const filter = { deleted: { $ne: true } };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search } },
      ];
    }

    const clients = await collection.find(filter).sort({ name: 1 }).toArray();
    return res.status(200).json(clients);
  }

  // POST - create client
  if (req.method === 'POST') {
    const { name, phone, birthday, notes } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'name and phone are required' });

    const client = {
      name,
      phone,
      birthday: birthday || null,
      notes: notes || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(client);
    return res.status(201).json({ ...client, _id: result.insertedId });
  }

  // PATCH - update client
  if (req.method === 'PATCH') {
    const { id, ...updates } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    updates.updatedAt = new Date();
    await collection.updateOne({ _id: new ObjectId(id) }, { $set: updates });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
