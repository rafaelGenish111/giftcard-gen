import { renderNav } from '../lib/nav.js';
import { getClients } from '../lib/api.js';
import { escapeHtml, formatDate } from '../lib/ui.js';

let allClients = [];

function renderList(filter) {
  const listEl = document.getElementById('client-list');
  const filtered = filter
    ? allClients.filter(c =>
        c.name.includes(filter) || (c.phone && c.phone.includes(filter))
      )
    : allClients;

  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="empty-state"><p>${filter ? 'לא נמצאו תוצאות' : 'אין לקוחות עדיין'}</p></div>`;
    return;
  }

  listEl.innerHTML = filtered.map(c => `
    <a href="/clients/${c._id}" data-link class="client-card">
      <div class="client-card-avatar">${escapeHtml(c.name.charAt(0))}</div>
      <div class="client-card-info">
        <span class="client-card-name">${escapeHtml(c.name)}</span>
        <span class="client-card-phone" dir="ltr">${escapeHtml(c.phone || '')}</span>
      </div>
      <svg class="client-card-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
    </a>
  `).join('');
}

export function renderClientList(app) {
  allClients = [];

  app.innerHTML = `
    <div class="screen client-list-screen">
      <header class="cl-header">
        <div class="cl-header-top">
          <h1>לקוחות</h1>
          <a href="/clients/new" data-link class="btn-new">+ חדש</a>
        </div>
        <div class="cl-search-wrap">
          <input type="text" id="client-search" placeholder="חיפוש לפי שם או טלפון..." class="cl-search" />
        </div>
      </header>

      <main class="cl-main">
        <div id="client-list" class="client-list">
          <div class="admin-loading">טוען...</div>
        </div>
      </main>

      ${renderNav('clients')}
    </div>
  `;

  getClients().then(clients => {
    allClients = clients;
    renderList('');
  }).catch(() => {
    document.getElementById('client-list').innerHTML = '<div class="empty-state"><p>שגיאה בטעינה</p></div>';
  });

  const searchInput = document.getElementById('client-search');
  let debounce;
  const handleInput = () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => renderList(searchInput.value.trim()), 200);
  };
  searchInput.addEventListener('input', handleInput);

  return () => searchInput.removeEventListener('input', handleInput);
}
