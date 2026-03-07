import { renderNav } from '../lib/nav.js';
import { getPunchCards, createPunchCard, updatePunchCard, getClients } from '../lib/api.js';
import { escapeHtml } from '../lib/ui.js';
import { renderInlineClientForm, setupInlineClient } from '../lib/inline-client.js';

let cards = [];
let allClients = [];

function renderCards() {
  const listEl = document.getElementById('punch-list');
  if (cards.length === 0) {
    listEl.innerHTML = '<div class="empty-state"><p>אין כרטיסיות עדיין</p></div>';
    return;
  }

  listEl.innerHTML = cards.map(card => {
    const usedCount = card.slots.filter(s => s.used).length;
    const remaining = 11 - usedCount;

    return `
      <div class="punch-card" data-card-id="${card._id}">
        <div class="punch-card-header">
          <a href="/clients/${card.clientId}" data-link class="punch-client-name">${escapeHtml(card.clientName)}</a>
          <span class="punch-remaining">${remaining > 0 ? `נותרו ${remaining}` : 'הושלם!'}</span>
        </div>
        <div class="punch-grid">
          ${card.slots.map((slot, i) => `
            <button class="punch-slot ${slot.used ? 'used' : ''} ${slot.isFree ? 'free' : ''}"
                    data-card-id="${card._id}" data-slot="${i}">
              <span class="punch-num">${i < 10 ? i + 1 : ''}</span>
              ${slot.isFree ? '<span class="punch-free-label">מתנה</span>' : ''}
              ${slot.used ? '<svg class="punch-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
            </button>
          `).join('')}
        </div>
        <button class="punch-delete" data-delete-card="${card._id}">מחק כרטיסייה</button>
      </div>
    `;
  }).join('');
}

export function renderPunchCards(app) {
  cards = [];
  allClients = [];

  app.innerHTML = `
    <div class="screen punch-screen">
      <header class="appt-header">
        <div class="header-content">
          <h1>כרטיסיות טיפולים</h1>
          <button id="btn-new-punch" class="btn-new">+ כרטיסייה חדשה</button>
        </div>
      </header>

      <main class="punch-main">
        <div id="new-punch-form" class="new-punch-form" style="display:none">
          <input type="text" id="punch-client-search" placeholder="חיפוש לקוח/ה..." autocomplete="off" />
          <div id="punch-client-dropdown" class="client-dropdown" style="display:none"></div>
          <input type="hidden" id="punch-client-id" />
          <div id="punch-selected" class="selected-client" style="display:none"></div>
          ${renderInlineClientForm('punch')}
          <button id="btn-create-punch" class="btn-generate" style="padding:10px;font-size:15px" disabled>צור כרטיסייה</button>
        </div>

        <div id="punch-list">
          <div class="admin-loading">טוען...</div>
        </div>
      </main>

      ${renderNav()}
    </div>
  `;

  let selectedClient = null;
  let hideInlineForm = null;

  function selectPunchClient(c) {
    selectedClient = c;
    document.getElementById('punch-client-id').value = c._id;
    const searchEl = document.getElementById('punch-client-search');
    searchEl.style.display = 'none';
    document.getElementById('punch-client-dropdown').style.display = 'none';
    if (hideInlineForm) hideInlineForm();
    const selEl = document.getElementById('punch-selected');
    selEl.style.display = 'flex';
    selEl.innerHTML = `
      <span>${escapeHtml(c.name)}</span>
      <button type="button" id="punch-clear-client" class="btn-action btn-delete" style="padding:4px 10px;font-size:12px">x</button>
    `;
    document.getElementById('btn-create-punch').disabled = false;
  }

  Promise.all([getPunchCards(), getClients()]).then(([c, cl]) => {
    cards = c;
    allClients = cl;
    renderCards();
    hideInlineForm = setupInlineClient({
      prefix: 'punch',
      searchInput: document.getElementById('punch-client-search'),
      dropdownEl: document.getElementById('punch-client-dropdown'),
      allClients,
      onClientCreated: (c) => selectPunchClient(c),
    });
  });

  // Client search
  const searchInput = document.getElementById('punch-client-search');
  let debounce;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      const q = searchInput.value.trim();
      const dropdown = document.getElementById('punch-client-dropdown');
      if (!q) { dropdown.style.display = 'none'; return; }
      const filtered = allClients.filter(c => c.name.includes(q) || (c.phone && c.phone.includes(q)));
      if (filtered.length === 0) { dropdown.style.display = 'none'; return; }
      dropdown.style.display = 'block';
      dropdown.innerHTML = filtered.slice(0, 5).map(c => `
        <div class="dropdown-item" data-pclient-id="${c._id}" data-pclient-name="${escapeHtml(c.name)}">${escapeHtml(c.name)} - ${escapeHtml(c.phone || '')}</div>
      `).join('');
    }, 200);
  });

  const handleClick = async (e) => {
    // Toggle new form
    if (e.target.closest('#btn-new-punch')) {
      const form = document.getElementById('new-punch-form');
      form.style.display = form.style.display === 'none' ? 'block' : 'none';
      return;
    }

    // Select client from dropdown
    const dropItem = e.target.closest('[data-pclient-id]');
    if (dropItem) {
      selectPunchClient({ _id: dropItem.dataset.pclientId, name: dropItem.dataset.pclientName });
      return;
    }

    // Clear client
    if (e.target.closest('#punch-clear-client')) {
      selectedClient = null;
      document.getElementById('punch-client-id').value = '';
      document.getElementById('punch-selected').style.display = 'none';
      if (hideInlineForm) hideInlineForm();
      searchInput.style.display = 'block';
      searchInput.value = '';
      document.getElementById('btn-create-punch').disabled = true;
      return;
    }

    // Create punch card
    if (e.target.closest('#btn-create-punch')) {
      if (!selectedClient) return;
      try {
        const created = await createPunchCard({
          clientId: selectedClient._id,
          clientName: selectedClient.name,
        });
        cards.unshift(created);
        renderCards();
        // Reset form
        document.getElementById('new-punch-form').style.display = 'none';
        selectedClient = null;
        document.getElementById('punch-client-id').value = '';
        document.getElementById('punch-selected').style.display = 'none';
        searchInput.style.display = 'block';
        searchInput.value = '';
        document.getElementById('btn-create-punch').disabled = true;
      } catch { alert('שגיאה ביצירה'); }
      return;
    }

    // Toggle slot
    const slotBtn = e.target.closest('.punch-slot');
    if (slotBtn) {
      const cardId = slotBtn.dataset.cardId;
      const slotIndex = Number(slotBtn.dataset.slot);
      try {
        const result = await updatePunchCard(cardId, { slotIndex });
        const card = cards.find(c => c._id === cardId);
        if (card && result.slots) card.slots = result.slots;
        renderCards();
      } catch { alert('שגיאה בעדכון'); }
      return;
    }

    // Delete card
    const delBtn = e.target.closest('[data-delete-card]');
    if (delBtn) {
      if (!confirm('למחוק את הכרטיסייה?')) return;
      const id = delBtn.dataset.deleteCard;
      try {
        await updatePunchCard(id, { deleted: true });
        cards = cards.filter(c => c._id !== id);
        renderCards();
      } catch { alert('שגיאה במחיקה'); }
    }
  };

  app.addEventListener('click', handleClick);
  return () => app.removeEventListener('click', handleClick);
}
