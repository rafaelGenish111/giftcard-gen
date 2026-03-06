import { renderNav } from '../lib/nav.js';
import { getClients, getTreatments } from '../lib/api.js';
import { escapeHtml, formatDateShort } from '../lib/ui.js';
import { navigate } from '../lib/router.js';

export function renderDashboard(app) {
  app.innerHTML = `
    <div class="screen dashboard-screen">
      <header class="dash-header">
        <h1>Leah Genish</h1>
        <p class="subtitle">ניהול לקוחות וטיפולים</p>
      </header>

      <main class="dash-main">
        <div class="dash-stats" id="dash-stats">
          <div class="dash-stat"><div class="dash-stat-num">-</div><div class="dash-stat-label">לקוחות</div></div>
          <div class="dash-stat"><div class="dash-stat-num">-</div><div class="dash-stat-label">טיפולים החודש</div></div>
          <div class="dash-stat"><div class="dash-stat-num">-</div><div class="dash-stat-label">לא שולם</div></div>
        </div>

        <section class="dash-section">
          <h2>🎂 ימי הולדת קרובים</h2>
          <div id="birthdays" class="dash-list">טוען...</div>
        </section>

        <section class="dash-section">
          <h2>לקוחות אחרונים</h2>
          <div id="recent-clients" class="dash-list">טוען...</div>
        </section>

        <div class="dash-actions">
          <a href="/clients/new" data-link class="dash-action-btn">+ לקוח/ה חדש/ה</a>
          <a href="/gift-card" data-link class="dash-action-btn secondary">כרטיס מתנה</a>
        </div>
      </main>

      ${renderNav('dashboard')}
    </div>
  `;

  loadDashboardData();
}

async function loadDashboardData() {
  try {
    const clients = await getClients();

    // Stats
    const totalClients = clients.length;

    // Birthdays in next 7 days
    const today = new Date();
    const upcoming = clients.filter(c => {
      if (!c.birthday) return false;
      const bday = new Date(c.birthday);
      const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
      if (thisYear < today) thisYear.setFullYear(thisYear.getFullYear() + 1);
      const diff = (thisYear - today) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    });

    const birthdaysEl = document.getElementById('birthdays');
    if (upcoming.length === 0) {
      birthdaysEl.innerHTML = '<div class="dash-empty">אין ימי הולדת בשבוע הקרוב</div>';
    } else {
      birthdaysEl.innerHTML = upcoming.map(c => {
        const bday = new Date(c.birthday);
        const dateStr = `${bday.getDate()}/${bday.getMonth() + 1}`;
        return `<a href="/clients/${c._id}" data-link class="dash-item">
          <span class="dash-item-name">${escapeHtml(c.name)}</span>
          <span class="dash-item-meta">${dateStr}</span>
        </a>`;
      }).join('');
    }

    // Recent clients (last 5 by creation)
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

    // Update stats
    document.getElementById('dash-stats').innerHTML = `
      <div class="dash-stat"><div class="dash-stat-num">${totalClients}</div><div class="dash-stat-label">לקוחות</div></div>
      <div class="dash-stat"><div class="dash-stat-num">-</div><div class="dash-stat-label">טיפולים החודש</div></div>
      <div class="dash-stat"><div class="dash-stat-num">-</div><div class="dash-stat-label">לא שולם</div></div>
    `;
  } catch {
    document.getElementById('recent-clients').innerHTML = '<div class="dash-empty">שגיאה בטעינה</div>';
  }
}
