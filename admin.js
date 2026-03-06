let allCards = [];
let currentFilter = 'all';

const cardsList = document.getElementById('cards-list');
const emptyState = document.getElementById('empty-state');
const statsEl = document.getElementById('stats');

// Load cards
async function loadCards() {
  try {
    const res = await fetch('/api/cards');
    allCards = await res.json();
    renderStats();
    renderCards();
  } catch (err) {
    cardsList.innerHTML = '<div class="loading">שגיאה בטעינת הנתונים</div>';
  }
}

// Stats
function renderStats() {
  const total = allCards.length;
  const paid = allCards.filter(c => c.isPaid).length;
  const unpaid = total - paid;
  const expired = allCards.filter(c => new Date(c.validUntil) < new Date()).length;

  statsEl.innerHTML = `
    <div class="stat-item"><div class="stat-number">${total}</div><div class="stat-label">סה"כ</div></div>
    <div class="stat-item"><div class="stat-number">${paid}</div><div class="stat-label">שולם</div></div>
    <div class="stat-item"><div class="stat-number">${unpaid}</div><div class="stat-label">לא שולם</div></div>
    <div class="stat-item"><div class="stat-number">${expired}</div><div class="stat-label">פג תוקף</div></div>
  `;
}

// Filter
function getFilteredCards() {
  const now = new Date();
  switch (currentFilter) {
    case 'paid': return allCards.filter(c => c.isPaid);
    case 'unpaid': return allCards.filter(c => !c.isPaid);
    case 'expired': return allCards.filter(c => new Date(c.validUntil) < now);
    default: return allCards;
  }
}

// Render cards
function renderCards() {
  const filtered = getFilteredCards();

  if (filtered.length === 0) {
    cardsList.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  const now = new Date();

  cardsList.innerHTML = filtered.map(card => {
    const isExpired = new Date(card.validUntil) < now;
    const statusClass = isExpired ? 'expired' : (card.isPaid ? 'paid' : '');
    const badgeClass = isExpired ? 'badge-expired' : (card.isPaid ? 'badge-paid' : 'badge-unpaid');
    const badgeText = isExpired ? 'פג תוקף' : (card.isPaid ? 'שולם' : 'לא שולם');
    const date = new Date(card.createdAt).toLocaleDateString('he-IL');
    const validDate = new Date(card.validUntil).toLocaleDateString('he-IL');

    return `
      <div class="card-item ${statusClass}">
        <div class="card-top">
          <span class="card-recipient">${escapeHtml(card.recipient)}</span>
          <span class="card-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="card-details">
          <div class="card-detail">
            <span class="detail-label">נותן/ת</span>
            <span class="detail-value">${escapeHtml(card.buyerName || '-')}</span>
          </div>
          <div class="card-detail">
            <span class="detail-label">משך טיפול</span>
            <span class="detail-value">${escapeHtml(card.duration)}</span>
          </div>
          <div class="card-detail">
            <span class="detail-label">תאריך יצירה</span>
            <span class="detail-value">${date}</span>
          </div>
          <div class="card-detail">
            <span class="detail-label">תוקף</span>
            <span class="detail-value">${validDate}</span>
          </div>
          <div class="card-detail">
            <span class="detail-label">טלפון</span>
            <span class="detail-value" dir="ltr">${escapeHtml(card.recipientPhone || '-')}</span>
          </div>
        </div>
        ${card.blessing ? `<div class="card-blessing">"${escapeHtml(card.blessing)}"</div>` : ''}
        <div class="card-actions">
          <button class="btn-action btn-toggle-paid ${card.isPaid ? 'is-paid' : ''}" onclick="togglePaid('${card._id}', ${!card.isPaid})">
            ${card.isPaid ? 'סמן כלא שולם' : 'סמן כשולם'}
          </button>
          ${card.recipientPhone ? `<button class="btn-action btn-whatsapp-small" onclick="openWhatsApp('${escapeHtml(card.recipientPhone)}')">WhatsApp</button>` : ''}
          <button class="btn-action btn-delete" onclick="deleteCard('${card._id}')">מחק</button>
        </div>
      </div>
    `;
  }).join('');
}

// Toggle paid status
async function togglePaid(id, isPaid) {
  try {
    await fetch('/api/cards', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isPaid }),
    });
    const card = allCards.find(c => c._id === id);
    if (card) card.isPaid = isPaid;
    renderStats();
    renderCards();
  } catch (err) {
    alert('שגיאה בעדכון');
  }
}

// Delete card
async function deleteCard(id) {
  if (!confirm('למחוק את הכרטיס?')) return;
  try {
    await fetch('/api/cards', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, deleted: true }),
    });
    allCards = allCards.filter(c => c._id !== id);
    renderStats();
    renderCards();
  } catch (err) {
    alert('שגיאה במחיקה');
  }
}

// Open WhatsApp
function openWhatsApp(phone) {
  let cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('0')) cleaned = '972' + cleaned.slice(1);
  else if (!cleaned.startsWith('972')) cleaned = '972' + cleaned;
  window.open(`https://wa.me/${cleaned}`, '_blank');
}

// Escape HTML
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderCards();
  });
});

// Init
loadCards();
