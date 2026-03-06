import { navigate } from '../lib/router.js';
import { getCards, updateCard } from '../lib/api.js';
import { formatPhone } from '../lib/card-renderer.js';

let allCards = [];
let currentFilter = 'all';

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function getFiltered() {
  const now = new Date();
  switch (currentFilter) {
    case 'paid': return allCards.filter(c => c.isPaid);
    case 'unpaid': return allCards.filter(c => !c.isPaid);
    case 'expired': return allCards.filter(c => new Date(c.validUntil) < now);
    default: return allCards;
  }
}

function renderStats() {
  const total = allCards.length;
  const paid = allCards.filter(c => c.isPaid).length;
  const unpaid = total - paid;
  const expired = allCards.filter(c => new Date(c.validUntil) < new Date()).length;

  document.getElementById('stats').innerHTML = `
    <div class="stat-item"><div class="stat-number">${total}</div><div class="stat-label">סה"כ</div></div>
    <div class="stat-item"><div class="stat-number">${paid}</div><div class="stat-label">שולם</div></div>
    <div class="stat-item"><div class="stat-number">${unpaid}</div><div class="stat-label">לא שולם</div></div>
    <div class="stat-item"><div class="stat-number">${expired}</div><div class="stat-label">פג תוקף</div></div>
  `;
}

function renderList() {
  const filtered = getFiltered();
  const listEl = document.getElementById('cards-list');
  const emptyEl = document.getElementById('empty-state');
  const now = new Date();

  if (filtered.length === 0) {
    listEl.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }

  emptyEl.style.display = 'none';

  listEl.innerHTML = filtered.map(card => {
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
          <button class="btn-action btn-toggle-paid ${card.isPaid ? 'is-paid' : ''}" data-id="${card._id}" data-paid="${!card.isPaid}">
            ${card.isPaid ? 'סמן כלא שולם' : 'סמן כשולם'}
          </button>
          ${card.recipientPhone ? `<button class="btn-action btn-whatsapp-small" data-phone="${escapeHtml(card.recipientPhone)}">WhatsApp</button>` : ''}
          <button class="btn-action btn-delete" data-id="${card._id}">מחק</button>
        </div>
      </div>
    `;
  }).join('');
}

export function renderAdmin(app) {
  allCards = [];
  currentFilter = 'all';

  app.innerHTML = `
    <div class="screen admin-screen">
      <header class="admin-header">
        <div class="header-content">
          <h1>ניהול כרטיסי מתנה</h1>
          <a href="/" data-link class="btn-new">+ כרטיס חדש</a>
        </div>
        <div class="stats" id="stats"></div>
      </header>

      <main class="admin-main">
        <div class="filters">
          <button class="filter-btn active" data-filter="all">הכל</button>
          <button class="filter-btn" data-filter="paid">שולם</button>
          <button class="filter-btn" data-filter="unpaid">לא שולם</button>
          <button class="filter-btn" data-filter="expired">פג תוקף</button>
        </div>

        <div id="cards-list" class="cards-list">
          <div class="admin-loading">טוען...</div>
        </div>

        <div id="empty-state" class="empty-state" style="display:none">
          <p>אין כרטיסים להצגה</p>
        </div>
      </main>
    </div>
  `;

  // Load data
  getCards().then(cards => {
    allCards = cards;
    renderStats();
    renderList();
  }).catch(() => {
    document.getElementById('cards-list').innerHTML = '<div class="admin-loading">שגיאה בטעינת הנתונים</div>';
  });

  // Event delegation for filters
  const handleClick = async (e) => {
    // Filters
    const filterBtn = e.target.closest('.filter-btn');
    if (filterBtn) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      filterBtn.classList.add('active');
      currentFilter = filterBtn.dataset.filter;
      renderList();
      return;
    }

    // Toggle paid
    const paidBtn = e.target.closest('.btn-toggle-paid');
    if (paidBtn) {
      const id = paidBtn.dataset.id;
      const isPaid = paidBtn.dataset.paid === 'true';
      try {
        await updateCard(id, { isPaid });
        const card = allCards.find(c => c._id === id);
        if (card) card.isPaid = isPaid;
        renderStats();
        renderList();
      } catch { alert('שגיאה בעדכון'); }
      return;
    }

    // WhatsApp
    const waBtn = e.target.closest('.btn-whatsapp-small');
    if (waBtn) {
      const phone = formatPhone(waBtn.dataset.phone);
      window.open(`https://wa.me/${phone}`, '_blank');
      return;
    }

    // Delete
    const delBtn = e.target.closest('.btn-delete');
    if (delBtn) {
      if (!confirm('למחוק את הכרטיס?')) return;
      const id = delBtn.dataset.id;
      try {
        await updateCard(id, { deleted: true });
        allCards = allCards.filter(c => c._id !== id);
        renderStats();
        renderList();
      } catch { alert('שגיאה במחיקה'); }
    }
  };

  app.addEventListener('click', handleClick);
  return () => app.removeEventListener('click', handleClick);
}
