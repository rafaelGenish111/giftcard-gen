import { getDb } from './_db.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await getDb();
  const collection = db.collection('gcal_links');

  // POST - create short link
  if (req.method === 'POST') {
    const { title, start, end, description } = req.body;
    if (!title || !start || !end) return res.status(400).json({ error: 'title, start, end required' });

    const doc = { title, start, end, description: description || '', createdAt: new Date() };
    const result = await collection.insertOne(doc);
    const shortId = result.insertedId.toString().slice(-8);

    // Store the shortId for lookup
    await collection.updateOne({ _id: result.insertedId }, { $set: { shortId } });

    return res.status(201).json({ shortId, url: `/api/gcal?id=${shortId}` });
  }

  // GET - redirect to Google Calendar
  if (req.method === 'GET') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id required' });

    const doc = await collection.findOne({ shortId: id });
    if (!doc) return res.status(404).json({ error: 'link not found' });

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: doc.title,
      dates: `${doc.start}/${doc.end}`,
      details: doc.description,
    });

    const gcalUrl = `https://calendar.google.com/calendar/render?${params}`;
    res.setHeader('Location', gcalUrl);
    return res.status(302).end();
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
