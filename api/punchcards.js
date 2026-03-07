import { getDb } from './_db.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await getDb();
  const collection = db.collection('punchcards');

  // GET - list punch cards
  if (req.method === 'GET') {
    const { clientId, id } = req.query || {};
    if (id) {
      const card = await collection.findOne({ _id: new ObjectId(id) });
      return res.status(200).json(card);
    }
    const filter = { deleted: { $ne: true } };
    if (clientId) filter.clientId = clientId;
    const cards = await collection.find(filter).sort({ createdAt: -1 }).toArray();
    return res.status(200).json(cards);
  }

  // POST - create punch card
  if (req.method === 'POST') {
    const { clientId, clientName } = req.body;
    if (!clientId || !clientName) return res.status(400).json({ error: 'clientId and clientName are required' });

    const slots = Array.from({ length: 11 }, (_, i) => ({
      index: i,
      used: false,
      usedAt: null,
      isFree: i === 10,
    }));

    const card = {
      clientId,
      clientName,
      slots,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(card);
    return res.status(201).json({ ...card, _id: result.insertedId });
  }

  // PATCH - update punch card (toggle slot, delete)
  if (req.method === 'PATCH') {
    const { id, slotIndex, deleted } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    if (deleted) {
      await collection.updateOne({ _id: new ObjectId(id) }, { $set: { deleted: true } });
      return res.status(200).json({ success: true });
    }

    if (slotIndex != null) {
      const card = await collection.findOne({ _id: new ObjectId(id) });
      if (!card) return res.status(404).json({ error: 'Not found' });

      const slot = card.slots[slotIndex];
      slot.used = !slot.used;
      slot.usedAt = slot.used ? new Date() : null;

      await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { slots: card.slots } }
      );
      return res.status(200).json({ success: true, slots: card.slots });
    }

    return res.status(400).json({ error: 'slotIndex or deleted required' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
