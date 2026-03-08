import { navigate } from '../lib/router.js';
import { createCard, getClients } from '../lib/api.js';
import { drawCard } from '../lib/card-renderer.js';
import { renderNav } from '../lib/nav.js';
import { escapeHtml } from '../lib/ui.js';

export function renderForm(app) {
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedClientId = urlParams.get('client');

  const defaultDate = new Date();
  defaultDate.setMonth(defaultDate.getMonth() + 3);
  const defaultDateStr = defaultDate.toISOString().split('T')[0];

  app.innerHTML = `
    <div class="screen form-screen">
      <div class="form-header">
        <div class="logo-small">
          <svg viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 10 C40 25, 20 30, 15 45 C10 60, 25 75, 50 70 C75 75, 90 60, 85 45 C80 30, 60 25, 50 10Z" stroke="#b8967a" stroke-width="2" fill="none"/>
            <path d="M50 20 C43 30, 30 33, 27 42 C24 51, 33 60, 50 58 C67 60, 76 51, 73 42 C70 33, 57 30, 50 20Z" stroke="#b8967a" stroke-width="1.5" fill="none"/>
            <path d="M50 30 C46 36, 40 38, 38 43 C36 48, 41 53, 50 52 C59 53, 64 48, 62 43 C60 38, 54 36, 50 30Z" stroke="#b8967a" stroke-width="1" fill="none"/>
          </svg>
        </div>
        <h1>Leah Genish</h1>
        <p class="subtitle">Gift Card Generator</p>
        <a href="/admin" data-link class="admin-link">ניהול כרטיסים</a>
      </div>

      <form id="gift-form">
        <div class="form-group">
          <label for="recipientName">שם מקבל/ת המתנה</label>
          <input type="text" id="recipientName" placeholder="הקלד/י שם..." required autocomplete="off">
          <div id="recipient-dropdown" class="client-dropdown" style="display:none"></div>
          <input type="hidden" id="link-client-id" />
          <div id="link-selected" class="selected-client" style="display:none"></div>
        </div>

        <div class="form-group">
          <label for="treatmentDuration">משך טיפול</label>
          <select id="treatmentDuration" required>
            <option value="">בחר/י משך טיפול</option>
            <option value="30 דקות">30 דקות</option>
            <option value="45 דקות">45 דקות</option>
            <option value="60 דקות">60 דקות</option>
            <option value="75 דקות">75 דקות</option>
            <option value="90 דקות">90 דקות</option>
          </select>
        </div>

        <div class="form-group">
          <label for="validUntil">תוקף</label>
          <input type="date" id="validUntil" value="${defaultDateStr}" required>
        </div>

        <div class="form-group">
          <label for="blessing">ברכה</label>
          <textarea id="blessing" rows="3" placeholder="כתוב/כתבי ברכה אישית..."></textarea>
        </div>

        <div class="form-group">
          <label for="recipientPhone">טלפון מקבל/ת המתנה</label>
          <input type="tel" id="recipientPhone" placeholder="לדוגמה: 0541234567" dir="ltr" required>
        </div>

        <div class="form-group">
          <label for="buyerName">שם הקונה (לא יופיע בכרטיס)</label>
          <input type="text" id="buyerName" placeholder="לדוגמה: יוסי ישראלי">
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" id="isPaid">
            <span class="checkmark"></span>
            שולם
          </label>
        </div>

        <button type="submit" class="btn-generate">צור כרטיס מתנה</button>
      </form>

      ${renderNav('giftcard')}
    </div>
  `;

  let allClients = [];
  let linkedClient = null;

  const recipientInput = document.getElementById('recipientName');
  const phoneInput = document.getElementById('recipientPhone');
  const clientIdInput = document.getElementById('link-client-id');
  const selectedEl = document.getElementById('link-selected');
  const dropdown = document.getElementById('recipient-dropdown');

  // Load clients
  getClients().then(clients => {
    allClients = clients;
    if (preselectedClientId) {
      const c = clients.find(c => c._id === preselectedClientId);
      if (c) selectClient(c);
    }
  });

  function selectClient(c) {
    linkedClient = c;
    clientIdInput.value = c._id;
    recipientInput.style.display = 'none';
    dropdown.style.display = 'none';
    selectedEl.style.display = 'flex';
    selectedEl.innerHTML = `
      <span>${escapeHtml(c.name)}</span>
      <button type="button" id="clear-link" class="btn-action btn-delete" style="padding:4px 10px;font-size:12px">×</button>
    `;
    phoneInput.value = c.phone || '';
  }

  function clearClient() {
    linkedClient = null;
    clientIdInput.value = '';
    selectedEl.style.display = 'none';
    recipientInput.style.display = '';
    recipientInput.value = '';
    recipientInput.focus();
  }

  let debounce;
  const handleSearch = () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      const q = recipientInput.value.trim();
      if (!q || q.length < 2) { dropdown.style.display = 'none'; return; }
      const filtered = allClients.filter(c => c.name.includes(q) || (c.phone && c.phone.includes(q)));
      if (filtered.length === 0) { dropdown.style.display = 'none'; return; }
      dropdown.style.display = 'block';
      dropdown.innerHTML = filtered.slice(0, 5).map(c => `
        <div class="dropdown-item" data-rcid="${c._id}">${escapeHtml(c.name)} - ${escapeHtml(c.phone || '')}</div>
      `).join('');
    }, 200);
  };
  recipientInput.addEventListener('input', handleSearch);

  const handleClick = (e) => {
    const item = e.target.closest('[data-rcid]');
    if (item) {
      const c = allClients.find(c => c._id === item.dataset.rcid);
      if (c) selectClient(c);
      return;
    }
    if (e.target.closest('#clear-link')) {
      clearClient();
    }
  };
  app.addEventListener('click', handleClick);

  const form = document.getElementById('gift-form');

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const recipientPhone = phoneInput.value.trim();
    const validUntilRaw = document.getElementById('validUntil').value;
    const recipient = linkedClient ? linkedClient.name : recipientInput.value.trim();
    const duration = document.getElementById('treatmentDuration').value;
    const blessing = document.getElementById('blessing').value.trim();
    const buyerName = document.getElementById('buyerName').value.trim();
    const isPaid = document.getElementById('isPaid').checked;
    const clientId = clientIdInput.value || null;

    try {
      await createCard({ recipient, recipientPhone, duration, validUntil: validUntilRaw, blessing, buyerName, isPaid, clientId });
    } catch (err) {
      console.warn('Failed to save card:', err);
    }

    window.__cardData = {
      recipient,
      duration,
      validDate: formatDate(validUntilRaw),
      blessing,
      phone: recipientPhone,
    };

    navigate('/preview');
  };

  form.addEventListener('submit', handleSubmit);
  return () => {
    form.removeEventListener('submit', handleSubmit);
    recipientInput.removeEventListener('input', handleSearch);
    app.removeEventListener('click', handleClick);
  };
}
