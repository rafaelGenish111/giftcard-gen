import { renderNav } from '../lib/nav.js';
import { getClient, getTreatments, createTreatment, updateTreatment, getCards, getAppointments, updateAppointment, getPunchCards } from '../lib/api.js';
import { escapeHtml, formatDate, formatPhone, TREATMENT_TYPES } from '../lib/ui.js';
import { buildBirthdayMessage } from '../lib/settings.js';
import { navigate } from '../lib/router.js';

let client = null;
let treatments = [];
let cards = [];
let appointments = [];
let punchCards = [];

function renderPunchInfo() {
  const el = document.getElementById('punch-info');
  if (!el) return;
  const active = punchCards.filter(c => {
    const usedCount = c.slots.filter(s => s.used).length;
    return usedCount < 11;
  });
  if (active.length === 0) {
    el.innerHTML = '<div class="empty-state"><p>אין כרטיסיות פעילות</p></div>';
    return;
  }
  el.innerHTML = active.map(card => {
    const usedCount = card.slots.filter(s => s.used).length;
    const remaining = 11 - usedCount;
    return `<div class="punch-info-item">
      <span>כרטיסייה: נותרו <strong>${remaining}</strong> טיפולים</span>
      <a href="/punch-cards" data-link class="punch-info-link">צפייה</a>
    </div>`;
  }).join('');
}

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

function formatDateHe(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' });
}

function renderAppointmentsList() {
  const el = document.getElementById('client-appointments');
  const today = new Date().toISOString().split('T')[0];
  const upcoming = appointments.filter(a => a.date >= today && a.status !== 'cancelled');
  const past = appointments.filter(a => a.date < today || a.status === 'cancelled');

  if (appointments.length === 0) {
    el.innerHTML = '<div class="empty-state"><p>אין תורים</p></div>';
    return;
  }

  let html = '';
  if (upcoming.length > 0) {
    html += '<div class="appt-sub-label">קרובים</div>';
    html += upcoming.map(a => `
      <div class="appt-item">
        <div class="appt-time">${escapeHtml(a.time)}</div>
        <div class="appt-details">
          <div class="appt-type">${escapeHtml(a.type)}</div>
          <div class="appt-date-text">${formatDateHe(a.date)}</div>
        </div>
        <div class="appt-actions-col">
          <button class="btn-action btn-delete" data-cancel-appt="${a._id}">ביטול</button>
        </div>
      </div>
    `).join('');
  }
  if (past.length > 0) {
    html += '<div class="appt-sub-label">עברו</div>';
    html += past.map(a => `
      <div class="appt-item ${a.status === 'cancelled' ? 'cancelled' : ''}">
        <div class="appt-time">${escapeHtml(a.time)}</div>
        <div class="appt-details">
          <div class="appt-type">${escapeHtml(a.type)}</div>
          <div class="appt-date-text">${formatDateHe(a.date)}</div>
        </div>
        ${a.status === 'cancelled' ? '<span class="appt-cancelled-badge">בוטל</span>' : ''}
      </div>
    `).join('');
  }
  el.innerHTML = html;
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

function isBirthdaySoon(birthday) {
  if (!birthday) return false;
  const today = new Date();
  const bday = new Date(birthday);
  const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
  if (thisYear < today) thisYear.setFullYear(thisYear.getFullYear() + 1);
  const diff = (thisYear - today) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 14;
}

function renderBirthdaySection() {
  const el = document.getElementById('bday-section');
  if (!el || !client || !client.birthday || !isBirthdaySoon(client.birthday)) {
    if (el) el.style.display = 'none';
    return;
  }

  el.style.display = '';
  const phone = formatPhone(client.phone);

  el.innerHTML = `
    <div class="settings-card bday-greeting-card">
      <h2>🎂 שלח מזל טוב</h2>
      <div class="bday-toggle-row">
        <button class="bday-type-btn active" data-gift="false">ללא מתנה</button>
        <button class="bday-type-btn" data-gift="true">עם מתנה 🎁</button>
      </div>
      <pre class="bday-msg-preview settings-preview">${escapeHtml(buildBirthdayMessage(client.name, false))}</pre>
      <button class="btn-generate btn-wa bday-send-btn" data-bday-send data-phone="${phone}" style="margin-top:10px">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle;margin-left:6px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
        שלח מזל טוב ב-WhatsApp
      </button>
    </div>
  `;
}

export function renderClientProfile(app, params) {
  client = null;
  treatments = [];
  cards = [];
  appointments = [];
  punchCards = [];

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

        <div id="bday-section" class="profile-section" style="display:none"></div>

        <div id="punch-info" class="punch-info-section"></div>

        <section class="profile-section">
          <div class="section-header">
            <h2>תורים</h2>
            <a href="/book?client=${params.id}" data-link class="btn-new">+ תור חדש</a>
          </div>
          <div id="client-appointments"></div>
        </section>

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

  let bdayWithGift = false;

  // Load data
  Promise.all([
    getClient(params.id),
    getTreatments(params.id),
    getCards(params.id),
    getAppointments({ clientId: params.id }),
    getPunchCards(params.id),
  ]).then(([c, t, gc, appts, pc]) => {
    client = c;
    treatments = t;
    cards = gc;
    appointments = appts.sort((a, b) => a.date === b.date ? (a.time || '').localeCompare(b.time || '') : a.date.localeCompare(b.date));
    punchCards = pc;

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

    renderPunchInfo();
    renderAppointmentsList();
    renderTreatmentsList();
    renderGiftCards();
    renderBirthdaySection();
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

    // Birthday toggle
    const giftBtn = e.target.closest('.bday-type-btn');
    if (giftBtn) {
      bdayWithGift = giftBtn.dataset.gift === 'true';
      document.querySelectorAll('.bday-type-btn').forEach(b => b.classList.remove('active'));
      giftBtn.classList.add('active');
      const preview = document.querySelector('.bday-msg-preview');
      if (preview && client) {
        preview.textContent = buildBirthdayMessage(client.name, bdayWithGift);
      }
      return;
    }

    // Birthday send
    if (e.target.closest('[data-bday-send]') && client) {
      const phone = formatPhone(client.phone);
      const message = buildBirthdayMessage(client.name, bdayWithGift);
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
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

    // Cancel appointment
    const cancelApptBtn = e.target.closest('[data-cancel-appt]');
    if (cancelApptBtn) {
      if (!confirm('לבטל את התור?')) return;
      const id = cancelApptBtn.dataset.cancelAppt;
      try {
        await updateAppointment(id, { status: 'cancelled' });
        const a = appointments.find(a => a._id === id);
        if (a) a.status = 'cancelled';
        renderAppointmentsList();
      } catch { alert('שגיאה בביטול'); }
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
