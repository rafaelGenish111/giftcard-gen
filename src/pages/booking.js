import { renderNav } from '../lib/nav.js';
import { getClients, getClient } from '../lib/api.js';
import { escapeHtml, formatPhone, TREATMENT_TYPES } from '../lib/ui.js';

export function renderBooking(app, params) {
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedClientId = urlParams.get('client');

  app.innerHTML = `
    <div class="screen form-screen">
      <div class="form-header">
        <h1>קביעת תור</h1>
        <p class="subtitle">שליחה דרך WhatsApp</p>
      </div>

      <form id="booking-form">
        <div class="form-group">
          <label>לקוח/ה *</label>
          <input type="text" id="book-client-search" placeholder="חיפוש לפי שם..." autocomplete="off" />
          <div id="client-dropdown" class="client-dropdown" style="display:none"></div>
          <input type="hidden" id="book-client-id" />
          <div id="selected-client" class="selected-client" style="display:none"></div>
        </div>
        <div class="form-group">
          <label>סוג טיפול</label>
          <select id="book-type">
            ${TREATMENT_TYPES.map(t => `<option value="${t.label}">${t.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>תאריך</label>
          <input type="date" id="book-date" required />
        </div>
        <div class="form-group">
          <label>שעה</label>
          <input type="time" id="book-time" required />
        </div>
        <div class="form-group">
          <label>הודעה</label>
          <textarea id="book-message" rows="4" readonly></textarea>
        </div>
        <button type="submit" class="btn-generate" style="background:#25D366">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle;margin-left:8px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
          שלח ב-WhatsApp
        </button>
      </form>

      ${renderNav('book')}
    </div>
  `;

  // Set default date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById('book-date').value = tomorrow.toISOString().split('T')[0];

  let allClients = [];
  let selectedClient = null;

  // Load clients
  getClients().then(clients => {
    allClients = clients;
    if (preselectedClientId) {
      const c = clients.find(c => c._id === preselectedClientId);
      if (c) selectClient(c);
    }
  });

  function selectClient(c) {
    selectedClient = c;
    document.getElementById('book-client-id').value = c._id;
    document.getElementById('book-client-search').style.display = 'none';
    document.getElementById('client-dropdown').style.display = 'none';
    const selEl = document.getElementById('selected-client');
    selEl.style.display = 'flex';
    selEl.innerHTML = `
      <span>${escapeHtml(c.name)} - ${escapeHtml(c.phone || '')}</span>
      <button type="button" id="clear-client" class="btn-action btn-delete" style="padding:4px 10px;font-size:12px">×</button>
    `;
    updateMessage();
  }

  function updateMessage() {
    const type = document.getElementById('book-type').value;
    const date = document.getElementById('book-date').value;
    const time = document.getElementById('book-time').value;
    const name = selectedClient ? selectedClient.name : '';

    if (!name || !date || !time) {
      document.getElementById('book-message').value = '';
      return;
    }

    const dateStr = new Date(date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
    const msg = `שלום ${name} 👋\nנקבע לך תור ל${type} ביום ${dateStr} בשעה ${time}.\nמחכה לך! 🙏\n\nלאה גניש - מטפלת הוליסטית`;
    document.getElementById('book-message').value = msg;
  }

  // Event handlers
  const searchInput = document.getElementById('book-client-search');
  let debounce;
  const handleSearch = () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      const q = searchInput.value.trim();
      const dropdown = document.getElementById('client-dropdown');
      if (!q) { dropdown.style.display = 'none'; return; }
      const filtered = allClients.filter(c => c.name.includes(q) || (c.phone && c.phone.includes(q)));
      if (filtered.length === 0) {
        dropdown.style.display = 'none';
        return;
      }
      dropdown.style.display = 'block';
      dropdown.innerHTML = filtered.slice(0, 5).map(c => `
        <div class="dropdown-item" data-client-id="${c._id}">${escapeHtml(c.name)} - ${escapeHtml(c.phone || '')}</div>
      `).join('');
    }, 200);
  };
  searchInput.addEventListener('input', handleSearch);

  // Update message on any field change
  const typeEl = document.getElementById('book-type');
  const dateEl = document.getElementById('book-date');
  const timeEl = document.getElementById('book-time');
  typeEl.addEventListener('change', updateMessage);
  dateEl.addEventListener('change', updateMessage);
  timeEl.addEventListener('change', updateMessage);

  const handleClick = (e) => {
    // Select client from dropdown
    const item = e.target.closest('.dropdown-item');
    if (item) {
      const c = allClients.find(c => c._id === item.dataset.clientId);
      if (c) selectClient(c);
      return;
    }

    // Clear selected client
    if (e.target.closest('#clear-client')) {
      selectedClient = null;
      document.getElementById('book-client-id').value = '';
      document.getElementById('selected-client').style.display = 'none';
      searchInput.style.display = 'block';
      searchInput.value = '';
      updateMessage();
    }
  };
  app.addEventListener('click', handleClick);

  const form = document.getElementById('booking-form');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedClient) return alert('נא לבחור לקוח/ה');
    const message = document.getElementById('book-message').value;
    if (!message) return alert('נא למלא את כל השדות');
    const phone = formatPhone(selectedClient.phone);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };
  form.addEventListener('submit', handleSubmit);

  return () => {
    searchInput.removeEventListener('input', handleSearch);
    typeEl.removeEventListener('change', updateMessage);
    dateEl.removeEventListener('change', updateMessage);
    timeEl.removeEventListener('change', updateMessage);
    app.removeEventListener('click', handleClick);
    form.removeEventListener('submit', handleSubmit);
  };
}
