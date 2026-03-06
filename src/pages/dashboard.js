import { renderNav } from '../lib/nav.js';
import { getClients, getAppointments } from '../lib/api.js';
import { escapeHtml } from '../lib/ui.js';

function formatDateHe(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function renderDashboard(app) {
  app.innerHTML = `
    <div class="screen dashboard-screen">
      <header class="dash-header">
        <img src="/logo.png" alt="Leah Genish" class="dash-logo" />
        <p class="subtitle">ניהול לקוחות וטיפולים</p>
      </header>

      <main class="dash-main">
        <div class="dash-stats" id="dash-stats">
          <div class="dash-stat"><div class="dash-stat-num">-</div><div class="dash-stat-label">לקוחות</div></div>
          <div class="dash-stat"><div class="dash-stat-num">-</div><div class="dash-stat-label">תורים היום</div></div>
          <div class="dash-stat"><div class="dash-stat-num">-</div><div class="dash-stat-label">תורים השבוע</div></div>
        </div>

        <section class="dash-section">
          <div class="section-header">
            <h2>תורים קרובים</h2>
            <a href="/appointments" data-link class="dash-see-all">הכל →</a>
          </div>
          <div id="upcoming-appts" class="dash-list">טוען...</div>
        </section>

        <section class="dash-section">
          <h2>🎂 ימי הולדת קרובים</h2>
          <div id="birthdays" class="dash-list">טוען...</div>
        </section>

        <section class="dash-section">
          <h2>לקוחות אחרונים</h2>
          <div id="recent-clients" class="dash-list">טוען...</div>
        </section>

        <div class="dash-actions">
          <a href="/book" data-link class="dash-action-btn">+ קביעת תור</a>
          <a href="/clients/new" data-link class="dash-action-btn secondary">+ לקוח/ה</a>
        </div>
      </main>

      ${renderNav('dashboard')}
    </div>
  `;

  loadDashboardData();
}

async function loadDashboardData() {
  try {
    const [clients, appointments] = await Promise.all([
      getClients(),
      getAppointments(),
    ]);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Week range
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    const activeAppts = appointments.filter(a => a.status !== 'cancelled');
    const todayAppts = activeAppts.filter(a => a.date === todayStr);
    const weekAppts = activeAppts.filter(a => a.date >= todayStr && a.date <= weekEndStr);

    // Stats
    document.getElementById('dash-stats').innerHTML = `
      <div class="dash-stat"><div class="dash-stat-num">${clients.length}</div><div class="dash-stat-label">לקוחות</div></div>
      <div class="dash-stat"><div class="dash-stat-num">${todayAppts.length}</div><div class="dash-stat-label">תורים היום</div></div>
      <div class="dash-stat"><div class="dash-stat-num">${weekAppts.length}</div><div class="dash-stat-label">תורים השבוע</div></div>
    `;

    // Upcoming appointments (next 7 days, max 6)
    const upcoming = activeAppts
      .filter(a => a.date >= todayStr)
      .sort((a, b) => a.date === b.date ? (a.time || '').localeCompare(b.time || '') : a.date.localeCompare(b.date))
      .slice(0, 6);

    const apptsEl = document.getElementById('upcoming-appts');
    if (upcoming.length === 0) {
      apptsEl.innerHTML = '<div class="dash-empty">אין תורים קרובים</div>';
    } else {
      apptsEl.innerHTML = upcoming.map(a => {
        const isToday = a.date === todayStr;
        const dateLabel = isToday ? 'היום' : formatDateHe(a.date);
        return `
          <div class="dash-appt-item ${isToday ? 'today' : ''}">
            <div class="dash-appt-time">
              <span class="dash-appt-hour">${escapeHtml(a.time)}</span>
              <span class="dash-appt-date">${dateLabel}</span>
            </div>
            <div class="dash-appt-info">
              <span class="dash-appt-client">${escapeHtml(a.clientName)}</span>
              <span class="dash-appt-type">${escapeHtml(a.type)}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    // Birthdays in next 7 days
    const upcomingBdays = clients.filter(c => {
      if (!c.birthday) return false;
      const bday = new Date(c.birthday);
      const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
      if (thisYear < today) thisYear.setFullYear(thisYear.getFullYear() + 1);
      const diff = (thisYear - today) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    });

    const birthdaysEl = document.getElementById('birthdays');
    if (upcomingBdays.length === 0) {
      birthdaysEl.innerHTML = '<div class="dash-empty">אין ימי הולדת בשבוע הקרוב</div>';
    } else {
      birthdaysEl.innerHTML = upcomingBdays.map(c => {
        const bday = new Date(c.birthday);
        const dateStr = `${bday.getDate()}/${bday.getMonth() + 1}`;
        return `<a href="/clients/${c._id}" data-link class="dash-item">
          <span class="dash-item-name">${escapeHtml(c.name)}</span>
          <span class="dash-item-meta">${dateStr}</span>
        </a>`;
      }).join('');
    }

    // Recent clients
    const recent = [...clients].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    const recentEl = document.getElementById('recent-clients');
    if (recent.length === 0) {
      recentEl.innerHTML = '<div class="dash-empty">אין לקוחות עדיין</div>';
    } else {
      recentEl.innerHTML = recent.map(c => `
        <a href="/clients/${c._id}" data-link class="dash-item">
          <span class="dash-item-name">${escapeHtml(c.name)}</span>
          <span class="dash-item-meta">${escapeHtml(c.phone || '')}</span>
        </a>
      `).join('');
    }
  } catch {
    document.getElementById('upcoming-appts').innerHTML = '<div class="dash-empty">שגיאה בטעינה</div>';
  }
}
