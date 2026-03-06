const BASE = '/api';

export async function createCard(data) {
  const res = await fetch(`${BASE}/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getCards() {
  const res = await fetch(`${BASE}/cards`);
  return res.json();
}

export async function updateCard(id, updates) {
  const res = await fetch(`${BASE}/cards`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates }),
  });
  return res.json();
}
