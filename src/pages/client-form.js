import { renderNav } from '../lib/nav.js';
import { getClient, createClient, updateClient } from '../lib/api.js';
import { navigate } from '../lib/router.js';

export function renderClientForm(app, params) {
  const isEdit = !!params.id;
  const title = isEdit ? 'עריכת לקוח/ה' : 'לקוח/ה חדש/ה';

  app.innerHTML = `
    <div class="screen form-screen">
      <div class="form-header">
        <h1>${title}</h1>
      </div>

      <form id="client-form">
        ${'contacts' in navigator ? `
        <button type="button" id="btn-import-contact" class="btn-import-contact">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="12" y1="11" x2="12" y2="15"/><line x1="10" y1="13" x2="14" y2="13"/></svg>
          ייבוא מאנשי קשר
        </button>
        ` : ''}
        <div class="form-group">
          <label>שם מלא *</label>
          <input type="text" id="cf-name" autocomplete="name" required />
        </div>
        <div class="form-group">
          <label>טלפון *</label>
          <input type="tel" id="cf-phone" dir="ltr" autocomplete="tel" required />
        </div>
        <div class="form-group">
          <label>יום הולדת</label>
          <input type="date" id="cf-birthday" />
        </div>
        <div class="form-group">
          <label>הערות</label>
          <textarea id="cf-notes" rows="3"></textarea>
        </div>
        <button type="submit" class="btn-generate">${isEdit ? 'שמור שינויים' : 'צור לקוח/ה'}</button>
      </form>

      ${renderNav('clients')}
    </div>
  `;

  const importBtn = document.getElementById('btn-import-contact');
  if (importBtn) {
    importBtn.addEventListener('click', async () => {
      try {
        const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: false });
        if (contacts.length > 0) {
          const contact = contacts[0];
          if (contact.name && contact.name[0]) {
            document.getElementById('cf-name').value = contact.name[0];
          }
          if (contact.tel && contact.tel[0]) {
            document.getElementById('cf-phone').value = contact.tel[0];
          }
        }
      } catch {
        // User cancelled or API not available
      }
    });
  }

  if (isEdit) {
    getClient(params.id).then(client => {
      if (!client) return;
      document.getElementById('cf-name').value = client.name || '';
      document.getElementById('cf-phone').value = client.phone || '';
      document.getElementById('cf-birthday').value = client.birthday ? client.birthday.split('T')[0] : '';
      document.getElementById('cf-notes').value = client.notes || '';
    });
  }

  const form = document.getElementById('client-form');
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      name: document.getElementById('cf-name').value.trim(),
      phone: document.getElementById('cf-phone').value.trim(),
      birthday: document.getElementById('cf-birthday').value || null,
      notes: document.getElementById('cf-notes').value.trim() || null,
    };

    if (!data.name || !data.phone) return alert('נא למלא שם וטלפון');

    try {
      if (isEdit) {
        await updateClient(params.id, data);
        navigate(`/clients/${params.id}`);
      } else {
        const created = await createClient(data);
        navigate(`/clients/${created._id}`);
      }
    } catch {
      alert('שגיאה בשמירה');
    }
  };

  form.addEventListener('submit', handleSubmit);
  return () => form.removeEventListener('submit', handleSubmit);
}
