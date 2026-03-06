const { MongoClient } = require('mongodb');

let cachedClient = null;

async function getDb() {
  if (cachedClient) return cachedClient.db('giftcards');

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client.db('giftcards');
}

module.exports = { getDb };
