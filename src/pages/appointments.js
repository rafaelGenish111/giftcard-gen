import { renderNav } from '../lib/nav.js';
import { getAppointments, updateAppointment } from '../lib/api.js';
import { escapeHtml, formatPhone } from '../lib/ui.js';

let allAppointments = [];
let currentFilter = 'upcoming';

function getFiltered() {
  const today = new Date().toISOString().split('T')[0];
  switch (currentFilter) {
    case 'upcoming': return allAppointments.filter(a => a.date >= today && a.status !== 'cancelled');
    case 'past': return allAppointments.filter(a => a.date < today);
    case 'cancelled': return allAppointments.filter(a => a.status === 'cancelled');
    default: return allAppointments;
  }
}

function formatDateHe(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' });
}

function renderList() {
  const filtered = getFiltered();
  const listEl = document.getElementById('appt-list');

  if (filtered.length === 0) {
    listEl.innerHTML = '<div class="empty-state"><p>אין תורים להצגה</p></div>';
    return;
  }

  // Group by date
  const grouped = {};
  for (const a of filtered) {
    if (!grouped[a.date]) grouped[a.date] = [];
    grouped[a.date].push(a);
  }

  listEl.innerHTML = Object.entries(grouped).map(([date, appts]) => `
    <div class="appt-date-group">
      <div class="appt-date-header">${formatDateHe(date)}</div>
      ${appts.map(a => `
        <div class="appt-item ${a.status === 'cancelled' ? 'cancelled' : ''}">
          <div class="appt-time">${escapeHtml(a.time)}</div>
          <div class="appt-details">
            <div class="appt-client">${escapeHtml(a.clientName)}</div>
            <div class="appt-type">${escapeHtml(a.type)}${a.duration ? ` - ${escapeHtml(a.duration)}` : ''}</div>
          </div>
          <div class="appt-actions-col">
            ${a.clientPhone ? `<button class="btn-action btn-whatsapp-small" data-wa-phone="${escapeHtml(a.clientPhone)}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
            </button>` : ''}
            ${a.status !== 'cancelled' ? `<button class="btn-action btn-delete" data-cancel-id="${a._id}">ביטול</button>` : '<span class="appt-cancelled-badge">בוטל</span>'}
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');
}

export function renderAppointments(app) {
  allAppointments = [];
  currentFilter = 'upcoming';

  app.innerHTML = `
    <div class="screen appt-screen">
      <header class="appt-header">
        <div class="header-content">
          <h1>תורים</h1>
          <a href="/book" data-link class="btn-new">+ תור חדש</a>
        </div>
      </header>

      <main class="appt-main">
        <div class="filters">
          <button class="filter-btn active" data-filter="upcoming">קרובים</button>
          <button class="filter-btn" data-filter="all">הכל</button>
          <button class="filter-btn" data-filter="past">עברו</button>
          <button class="filter-btn" data-filter="cancelled">בוטלו</button>
        </div>

        <div id="appt-list" class="appt-list">
          <div class="admin-loading">טוען...</div>
        </div>
      </main>

      ${renderNav('book')}
    </div>
  `;

  getAppointments().then(appts => {
    allAppointments = appts;
    renderList();
  }).catch(() => {
    document.getElementById('appt-list').innerHTML = '<div class="empty-state"><p>שגיאה בטעינה</p></div>';
  });

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

    // WhatsApp
    const waBtn = e.target.closest('[data-wa-phone]');
    if (waBtn) {
      const phone = formatPhone(waBtn.dataset.waPhone);
      window.open(`https://wa.me/${phone}`, '_blank');
      return;
    }

    // Cancel appointment
    const cancelBtn = e.target.closest('[data-cancel-id]');
    if (cancelBtn) {
      if (!confirm('לבטל את התור?')) return;
      const id = cancelBtn.dataset.cancelId;
      try {
        await updateAppointment(id, { status: 'cancelled' });
        const a = allAppointments.find(a => a._id === id);
        if (a) a.status = 'cancelled';
        renderList();
      } catch {
        alert('שגיאה בביטול');
      }
    }
  };

  app.addEventListener('click', handleClick);
  return () => app.removeEventListener('click', handleClick);
}
