export function renderNav(activeTab) {
  const tabs = [
    { id: 'dashboard', label: 'ראשי', href: '/', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
    { id: 'clients', label: 'לקוחות', href: '/clients', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>' },
    { id: 'giftcard', label: 'כרטיס מתנה', href: '/gift-card', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8V21"/><path d="M19 12v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 010-5C9 3 12 8 12 8"/><path d="M16.5 8a2.5 2.5 0 000-5C15 3 12 8 12 8"/></svg>' },
    { id: 'book', label: 'זימון תור', href: '/book', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
  ];

  const menuItems = [
    { label: 'ראשי', href: '/', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
    { label: 'לקוחות', href: '/clients', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/></svg>' },
    { label: 'זימון תור', href: '/book', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
    { label: 'תורים', href: '/appointments', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>' },
    { label: 'כרטיס מתנה', href: '/gift-card', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8V21"/><path d="M19 12v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7"/></svg>' },
    { label: 'ניהול כרטיסים', href: '/admin', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>' },
    { label: 'הגדרות', href: '/settings', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>' },
  ];

  return `
    <div id="side-menu-overlay" class="side-menu-overlay"></div>
    <aside id="side-menu" class="side-menu">
      <div class="side-menu-header">
        <img src="/logo.png" alt="Leah Genish" class="side-menu-logo" />
        <button id="side-menu-close" class="side-menu-close">&times;</button>
      </div>
      <nav class="side-menu-nav">
        ${menuItems.map(item => `
          <a href="${item.href}" data-link class="side-menu-item">
            ${item.icon}
            <span>${item.label}</span>
          </a>
        `).join('')}
      </nav>
    </aside>

    <nav class="bottom-nav">
      <button id="btn-side-menu" class="nav-tab menu-tab" type="button">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        <span>תפריט</span>
      </button>
      ${tabs.map(t => `
        <a href="${t.href}" data-link class="nav-tab ${activeTab === t.id ? 'active' : ''}">
          ${t.icon}
          <span>${t.label}</span>
        </a>
      `).join('')}
    </nav>
  `;
}

export function initSideMenu() {
  const overlay = document.getElementById('side-menu-overlay');
  const menu = document.getElementById('side-menu');
  const openBtn = document.getElementById('btn-side-menu');
  const closeBtn = document.getElementById('side-menu-close');

  if (!menu || !openBtn) return;

  function open() {
    menu.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    menu.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);
  menu.addEventListener('click', (e) => {
    if (e.target.closest('[data-link]')) close();
  });
}
