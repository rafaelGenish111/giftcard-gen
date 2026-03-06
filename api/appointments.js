import { getDb } from './_db.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await getDb();
  const collection = db.collection('appointments');

  // GET - list appointments (optional ?clientId=, ?from=, ?to=)
  if (req.method === 'GET') {
    const { clientId, from, to } = req.query || {};
    const filter = { deleted: { $ne: true } };
    if (clientId) filter.clientId = clientId;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    const appointments = await collection.find(filter).sort({ date: 1, time: 1 }).toArray();
    return res.status(200).json(appointments);
  }

  // POST - create appointment
  if (req.method === 'POST') {
    const { clientId, clientName, clientPhone, type, date, time, duration, status, notes } = req.body;
    if (!clientId || !type || !date || !time) {
      return res.status(400).json({ error: 'clientId, type, date, and time are required' });
    }

    const appointment = {
      clientId,
      clientName: clientName || '',
      clientPhone: clientPhone || '',
      type,
      date,
      time,
      duration: duration || '',
      status: status || 'scheduled',
      notes: notes || '',
      createdAt: new Date(),
    };

    const result = await collection.insertOne(appointment);
    return res.status(201).json({ ...appointment, _id: result.insertedId });
  }

  // PATCH - update appointment
  if (req.method === 'PATCH') {
    const { id, ...updates } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    await collection.updateOne({ _id: new ObjectId(id) }, { $set: updates });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
