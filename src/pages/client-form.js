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
        <div class="form-group">
          <label>שם מלא *</label>
          <input type="text" id="cf-name" required />
        </div>
        <div class="form-group">
          <label>טלפון *</label>
          <input type="tel" id="cf-phone" dir="ltr" required />
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
