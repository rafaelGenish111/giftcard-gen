const BASE = '/api';

// --- Cards ---
export async function createCard(data) {
  const res = await fetch(`${BASE}/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getCards(clientId) {
  const url = clientId ? `${BASE}/cards?clientId=${clientId}` : `${BASE}/cards`;
  const res = await fetch(url);
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

// --- Clients ---
export async function getClients(search) {
  const url = search ? `${BASE}/clients?search=${encodeURIComponent(search)}` : `${BASE}/clients`;
  const res = await fetch(url);
  return res.json();
}

export async function getClient(id) {
  const res = await fetch(`${BASE}/clients?id=${id}`);
  return res.json();
}

export async function createClient(data) {
  const res = await fetch(`${BASE}/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateClient(id, updates) {
  const res = await fetch(`${BASE}/clients`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates }),
  });
  return res.json();
}

// --- Treatments ---
export async function getTreatments(clientId) {
  const res = await fetch(`${BASE}/treatments?clientId=${clientId}`);
  return res.json();
}

export async function createTreatment(data) {
  const res = await fetch(`${BASE}/treatments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateTreatment(id, updates) {
  const res = await fetch(`${BASE}/treatments`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates }),
  });
  return res.json();
}
