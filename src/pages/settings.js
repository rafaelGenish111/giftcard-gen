import { renderNav } from '../lib/nav.js';
import { getSettings, saveSettings } from '../lib/settings.js';

export function renderSettings(app) {
  const settings = getSettings();

  app.innerHTML = `
    <div class="screen settings-screen">
      <header class="settings-header">
        <h1>הגדרות</h1>
      </header>

      <main class="settings-main">
        <div class="settings-tabs">
          <button class="settings-tab active" data-tab="whatsapp">הודעת WhatsApp</button>
        </div>

        <div id="tab-whatsapp" class="settings-tab-content">
          <div class="settings-card">
            <h2>תבנית הודעה</h2>
            <p class="settings-hint">
              משתנים זמינים: <code>{name}</code> <code>{type}</code> <code>{date}</code> <code>{time}</code> <code>{link}</code> <code>{notes}</code>
            </p>
            <textarea id="wa-template" class="settings-textarea" rows="10">${escapeForTextarea(settings.waMessage)}</textarea>
          </div>

          <div class="settings-card">
            <h2>דגשים חשובים</h2>
            <p class="settings-hint">
              התוכן שיוחלף במקום <code>{notes}</code> בהודעה
            </p>
            <textarea id="wa-notes" class="settings-textarea" rows="5">${escapeForTextarea(settings.waNotes)}</textarea>
          </div>

          <div class="settings-card preview-card">
            <h2>תצוגה מקדימה</h2>
            <pre id="wa-preview" class="settings-preview"></pre>
          </div>

          <button id="btn-save-settings" class="btn-generate">שמור הגדרות</button>
          <button id="btn-reset-settings" class="btn-generate" style="background:var(--bg);color:var(--text);margin-top:8px">איפוס לברירת מחדל</button>
        </div>
      </main>

      ${renderNav('settings')}
    </div>
  `;

  updatePreview();

  const templateEl = document.getElementById('wa-template');
  const notesEl = document.getElementById('wa-notes');

  templateEl.addEventListener('input', updatePreview);
  notesEl.addEventListener('input', updatePreview);

  function updatePreview() {
    const template = document.getElementById('wa-template').value;
    const notes = document.getElementById('wa-notes').value;
    const preview = template
      .replace(/{name}/g, 'דנה כהן')
      .replace(/{type}/g, 'עיסוי הוליסטי - 60 דקות')
      .replace(/{date}/g, 'יום שלישי, 10 במרץ')
      .replace(/{time}/g, '14:00')
      .replace(/{link}/g, 'https://example.com/cal')
      .replace(/{notes}/g, notes);
    document.getElementById('wa-preview').textContent = preview;
  }

  const handleClick = (e) => {
    if (e.target.closest('#btn-save-settings')) {
      saveSettings({
        waMessage: templateEl.value,
        waNotes: notesEl.value,
      });
      alert('ההגדרות נשמרו בהצלחה!');
      return;
    }

    if (e.target.closest('#btn-reset-settings')) {
      if (!confirm('לאפס להגדרות ברירת מחדל?')) return;
      saveSettings({});
      localStorage.removeItem('leah_settings');
      const defaults = getSettings();
      templateEl.value = defaults.waMessage;
      notesEl.value = defaults.waNotes;
      updatePreview();
      return;
    }

    const tab = e.target.closest('.settings-tab');
    if (tab) {
      document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    }
  };

  app.addEventListener('click', handleClick);

  return () => {
    templateEl.removeEventListener('input', updatePreview);
    notesEl.removeEventListener('input', updatePreview);
    app.removeEventListener('click', handleClick);
  };
}

function escapeForTextarea(str) {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
