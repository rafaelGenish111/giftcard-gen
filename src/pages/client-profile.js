import { renderNav } from '../lib/nav.js';
import { getClient, getTreatments, createTreatment, updateTreatment, getCards } from '../lib/api.js';
import { escapeHtml, formatDate, formatPhone, TREATMENT_TYPES } from '../lib/ui.js';
import { navigate } from '../lib/router.js';

let client = null;
let treatments = [];
let cards = [];

function renderTreatmentsList() {
  const el = document.getElementById('treatments-list');
  if (treatments.length === 0) {
    el.innerHTML = '<div class="empty-state"><p>אין טיפולים עדיין</p></div>';
    return;
  }

  el.innerHTML = treatments.map(t => `
    <div class="treatment-item ${t.isPaid ? 'paid' : ''}">
      <div class="treatment-top">
        <span class="treatment-type">${escapeHtml(t.type)}${t.duration ? ` - ${escapeHtml(t.duration)}` : ''}</span>
        <span class="card-badge ${t.isPaid ? 'badge-paid' : 'badge-unpaid'}">${t.isPaid ? 'שולם' : 'לא שולם'}</span>
      </div>
      <div class="treatment-meta">
        <span>${formatDate(t.date)}</span>
        ${t.price ? `<span>₪${escapeHtml(String(t.price))}</span>` : ''}
        ${t.notes ? `<span class="treatment-note">${escapeHtml(t.notes)}</span>` : ''}
      </div>
      <div class="card-actions">
        <button class="btn-action btn-toggle-paid ${t.isPaid ? 'is-paid' : ''}" data-treat-id="${t._id}" data-paid="${!t.isPaid}">
          ${t.isPaid ? 'סמן כלא שולם' : 'סמן כשולם'}
        </button>
        <button class="btn-action btn-delete" data-treat-del="${t._id}">מחק</button>
      </div>
    </div>
  `).join('');
}

function renderGiftCards() {
  const el = document.getElementById('client-cards');
  if (cards.length === 0) {
    el.innerHTML = '<div class="empty-state"><p>אין כרטיסי מתנה</p></div>';
    return;
  }

  el.innerHTML = cards.map(c => `
    <div class="card-item ${c.isPaid ? 'paid' : ''}">
      <div class="card-top">
        <span class="card-recipient">${escapeHtml(c.duration)}</span>
        <span class="card-badge ${c.isPaid ? 'badge-paid' : 'badge-unpaid'}">${c.isPaid ? 'שולם' : 'לא שולם'}</span>
      </div>
      <div class="treatment-meta">
        <span>${formatDate(c.createdAt)}</span>
        <span>עד ${formatDate(c.validUntil)}</span>
      </div>
    </div>
  `).join('');
}

export function renderClientProfile(app, params) {
  client = null;
  treatments = [];
  cards = [];

  app.innerHTML = `
    <div class="screen profile-screen">
      <header class="profile-header">
        <div class="profile-back">
          <a href="/clients" data-link class="btn-icon back-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </a>
        </div>
        <div id="profile-info" class="profile-info">
          <div class="admin-loading">טוען...</div>
        </div>
      </header>

      <main class="profile-main">
        <div class="profile-actions">
          <button id="btn-wa" class="profile-action-btn wa">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
            WhatsApp
          </button>
          <a href="/clients/${params.id}/edit" data-link class="profile-action-btn edit">עריכה</a>
          <a href="/book?client=${params.id}" data-link class="profile-action-btn book">קביעת תור</a>
        </div>

        <section class="profile-section">
          <div class="section-header">
            <h2>טיפולים</h2>
            <button id="btn-add-treatment" class="btn-new">+ הוסף</button>
          </div>
          <div id="add-treatment-form" class="add-treatment-form" style="display:none">
            <select id="treat-type" class="treat-select">
              ${TREATMENT_TYPES.map(t => `<option value="${t.label}">${t.label}</option>`).join('')}
            </select>
            <input type="date" id="treat-date" class="treat-input" />
            <input type="number" id="treat-price" placeholder="מחיר (₪)" class="treat-input" />
            <input type="text" id="treat-notes" placeholder="הערות" class="treat-input" />
            <button id="btn-save-treatment" class="btn-generate" style="padding:10px;font-size:15px">שמור טיפול</button>
          </div>
          <div id="treatments-list"></div>
        </section>

        <section class="profile-section">
          <div class="section-header">
            <h2>כרטיסי מתנה</h2>
            <a href="/gift-card?client=${params.id}" data-link class="btn-new">+ חדש</a>
          </div>
          <div id="client-cards"></div>
        </section>
      </main>

      ${renderNav('clients')}
    </div>
  `;

  // Set today as default date
  const dateInput = document.getElementById('treat-date');
  dateInput.value = new Date().toISOString().split('T')[0];

  // Load data
  Promise.all([
    getClient(params.id),
    getTreatments(params.id),
    getCards(params.id),
  ]).then(([c, t, gc]) => {
    client = c;
    treatments = t;
    cards = gc;

    const infoEl = document.getElementById('profile-info');
    if (!client) {
      infoEl.innerHTML = '<p>לקוח/ה לא נמצא/ה</p>';
      return;
    }

    infoEl.innerHTML = `
      <div class="profile-avatar">${escapeHtml(client.name.charAt(0))}</div>
      <h1 class="profile-name">${escapeHtml(client.name)}</h1>
      <p class="profile-phone" dir="ltr">${escapeHtml(client.phone || '')}</p>
      ${client.birthday ? `<p class="profile-birthday">🎂 ${formatDate(client.birthday)}</p>` : ''}
      ${client.notes ? `<p class="profile-notes">${escapeHtml(client.notes)}</p>` : ''}
    `;

    renderTreatmentsList();
    renderGiftCards();
  }).catch(() => {
    document.getElementById('profile-info').innerHTML = '<p>שגיאה בטעינה</p>';
  });

  // Event handlers
  const handleClick = async (e) => {
    // WhatsApp
    if (e.target.closest('#btn-wa') && client) {
      const phone = formatPhone(client.phone);
      window.open(`https://wa.me/${phone}`, '_blank');
      return;
    }

    // Toggle add treatment form
    if (e.target.closest('#btn-add-treatment')) {
      const form = document.getElementById('add-treatment-form');
      form.style.display = form.style.display === 'none' ? 'flex' : 'none';
      return;
    }

    // Save treatment
    if (e.target.closest('#btn-save-treatment')) {
      const typeLabel = document.getElementById('treat-type').value;
      const tt = TREATMENT_TYPES.find(t => t.label === typeLabel);
      const data = {
        clientId: params.id,
        type: tt ? tt.type : typeLabel,
        duration: tt ? tt.duration : '',
        date: document.getElementById('treat-date').value,
        price: Number(document.getElementById('treat-price').value) || null,
        notes: document.getElementById('treat-notes').value.trim() || null,
        isPaid: false,
      };
      try {
        const created = await createTreatment(data);
        treatments.unshift(created);
        renderTreatmentsList();
        document.getElementById('add-treatment-form').style.display = 'none';
        document.getElementById('treat-price').value = '';
        document.getElementById('treat-notes').value = '';
      } catch { alert('שגיאה בשמירה'); }
      return;
    }

    // Toggle paid treatment
    const paidBtn = e.target.closest('[data-treat-id]');
    if (paidBtn) {
      const id = paidBtn.dataset.treatId;
      const isPaid = paidBtn.dataset.paid === 'true';
      try {
        await updateTreatment(id, { isPaid });
        const t = treatments.find(t => t._id === id);
        if (t) t.isPaid = isPaid;
        renderTreatmentsList();
      } catch { alert('שגיאה בעדכון'); }
      return;
    }

    // Delete treatment
    const delBtn = e.target.closest('[data-treat-del]');
    if (delBtn) {
      if (!confirm('למחוק את הטיפול?')) return;
      const id = delBtn.dataset.treatDel;
      try {
        await updateTreatment(id, { deleted: true });
        treatments = treatments.filter(t => t._id !== id);
        renderTreatmentsList();
      } catch { alert('שגיאה במחיקה'); }
    }
  };

  app.addEventListener('click', handleClick);
  return () => app.removeEventListener('click', handleClick);
}
