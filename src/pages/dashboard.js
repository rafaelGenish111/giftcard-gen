import { renderNav } from '../lib/nav.js';
import { getClients, getAppointments } from '../lib/api.js';
import { escapeHtml, formatPhone } from '../lib/ui.js';
import { buildBirthdayMessage } from '../lib/settings.js';

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

  const handleClick = (e) => {
    const bdayBtn = e.target.closest('[data-bday-wa]');
    if (bdayBtn) {
      e.preventDefault();
      e.stopPropagation();
      const name = bdayBtn.dataset.bdayName;
      const phone = bdayBtn.dataset.bdayWa;
      const withGift = bdayBtn.dataset.bdayGift === 'true';
      const message = buildBirthdayMessage(name, withGift);
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };
  app.addEventListener('click', handleClick);

  return () => app.removeEventListener('click', handleClick);
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
        const phone = formatPhone(c.phone);
        return `
          <div class="dash-bday-item">
            <a href="/clients/${c._id}" data-link class="dash-bday-info">
              <span class="dash-item-name">${escapeHtml(c.name)}</span>
              <span class="dash-item-meta">${dateStr}</span>
            </a>
            <button class="bday-wa-btn" data-bday-wa="${phone}" data-bday-name="${escapeHtml(c.name)}" data-bday-gift="false" title="שלח מזל טוב">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
            </button>
          </div>`;
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
