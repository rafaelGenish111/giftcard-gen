import { createClient } from './api.js';
import { escapeHtml } from './ui.js';

/**
 * Renders an inline "new client" form HTML.
 * @param {string} prefix - unique prefix for element IDs
 */
export function renderInlineClientForm(prefix) {
  return `
    <div id="${prefix}-new-client" class="inline-client-form" style="display:none">
      <div class="inline-client-title">לקוח/ה חדש/ה</div>
      ${'contacts' in navigator ? `
      <button type="button" id="${prefix}-import-contact" class="btn-import-contact compact">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        ייבוא מאנשי קשר
      </button>
      ` : ''}
      <input type="text" id="${prefix}-new-name" placeholder="שם *" class="treat-input" autocomplete="name" />
      <input type="tel" id="${prefix}-new-phone" placeholder="טלפון" dir="ltr" class="treat-input" autocomplete="tel" />
      <button type="button" id="${prefix}-create-client" class="btn-generate compact-btn">צור ושייך</button>
    </div>
  `;
}

/**
 * Sets up inline client form logic.
 * @param {Object} opts
 * @param {string} opts.prefix - unique prefix for element IDs
 * @param {HTMLInputElement} opts.searchInput - the search input element
 * @param {HTMLElement} opts.dropdownEl - the dropdown element
 * @param {Array} opts.allClients - reference to all clients array
 * @param {Function} opts.onClientCreated - callback(client) when a new client is created
 */
export function setupInlineClient({ prefix, searchInput, dropdownEl, allClients, onClientCreated }) {
  const formEl = document.getElementById(`${prefix}-new-client`);
  const importBtn = document.getElementById(`${prefix}-import-contact`);
  const createBtn = document.getElementById(`${prefix}-create-client`);
  const nameInput = document.getElementById(`${prefix}-new-name`);
  const phoneInput = document.getElementById(`${prefix}-new-phone`);

  if (!formEl) return;

  // Show inline form when search has text but no match and user leaves the field
  searchInput.addEventListener('blur', () => {
    setTimeout(() => {
      const q = searchInput.value.trim();
      if (!q) return;
      // Check if dropdown is visible (has matches)
      if (dropdownEl.style.display === 'block') return;
      // Check no client was selected (search input still visible)
      if (searchInput.style.display === 'none') return;

      const hasMatch = allClients.some(c => c.name === q || (c.phone && c.phone === q));
      if (!hasMatch) {
        formEl.style.display = 'flex';
        nameInput.value = q;
        searchInput.style.display = 'none';
      }
    }, 300);
  });

  // Contact Picker API
  if (importBtn) {
    importBtn.addEventListener('click', async () => {
      try {
        const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: false });
        if (contacts.length > 0) {
          const contact = contacts[0];
          if (contact.name && contact.name[0]) nameInput.value = contact.name[0];
          if (contact.tel && contact.tel[0]) phoneInput.value = contact.tel[0];
        }
      } catch {
        // User cancelled
      }
    });
  }

  // Create client button
  createBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    if (!name) return alert('נא להזין שם');
    const phone = phoneInput.value.trim();

    try {
      const created = await createClient({ name, phone: phone || null });
      allClients.push(created);
      formEl.style.display = 'none';
      nameInput.value = '';
      phoneInput.value = '';
      onClientCreated(created);
    } catch {
      alert('שגיאה ביצירת לקוח/ה');
    }
  });

  // Return a function to reset/hide the form
  return function hideForm() {
    formEl.style.display = 'none';
    nameInput.value = '';
    phoneInput.value = '';
  };
}
