import { renderNav } from '../lib/nav.js';
import { getSettings, saveSettings, getDefaults } from '../lib/settings.js';
import { getNotificationSettings, saveNotificationSettings } from '../lib/api.js';
import { isPushSupported, getPermissionState, subscribeToPush, unsubscribeFromPush, getCurrentSubscription } from '../lib/notifications.js';

export function renderSettings(app) {
  const settings = getSettings();

  app.innerHTML = `
    <div class="screen settings-screen">
      <header class="settings-header">
        <h1>הגדרות</h1>
      </header>

      <main class="settings-main">
        <div class="settings-tabs">
          <button class="settings-tab active" data-tab="whatsapp">הודעת תור</button>
          <button class="settings-tab" data-tab="birthday-messages">הודעות יום הולדת</button>
          <button class="settings-tab" data-tab="notifications">התראות</button>
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

          <button id="btn-save-wa" class="btn-generate">שמור הגדרות</button>
          <button id="btn-reset-wa" class="btn-generate" style="background:var(--bg);color:var(--text);margin-top:8px">איפוס לברירת מחדל</button>
        </div>

        <div id="tab-birthday-messages" class="settings-tab-content" style="display:none">
          <div class="settings-card">
            <h2>הודעת יום הולדת (ללא מתנה)</h2>
            <p class="settings-hint">
              משתנים זמינים: <code>{name}</code>
            </p>
            <textarea id="bday-template" class="settings-textarea" rows="8">${escapeForTextarea(settings.bdayMessage)}</textarea>
          </div>

          <div class="settings-card preview-card">
            <h2>תצוגה מקדימה</h2>
            <pre id="bday-preview" class="settings-preview"></pre>
          </div>

          <div class="settings-card">
            <h2>הודעת יום הולדת (עם מתנה)</h2>
            <p class="settings-hint">
              משתנים זמינים: <code>{name}</code>
            </p>
            <textarea id="bday-gift-template" class="settings-textarea" rows="10">${escapeForTextarea(settings.bdayGiftMessage)}</textarea>
          </div>

          <div class="settings-card preview-card">
            <h2>תצוגה מקדימה (עם מתנה)</h2>
            <pre id="bday-gift-preview" class="settings-preview"></pre>
          </div>

          <button id="btn-save-bday" class="btn-generate">שמור הודעות יום הולדת</button>
          <button id="btn-reset-bday" class="btn-generate" style="background:var(--bg);color:var(--text);margin-top:8px">איפוס לברירת מחדל</button>
        </div>

        <div id="tab-notifications" class="settings-tab-content" style="display:none">
          <div class="notif-loading">טוען הגדרות...</div>
        </div>
      </main>

      ${renderNav('settings')}
    </div>
  `;

  // --- WhatsApp tab ---
  updateWaPreview();
  const templateEl = document.getElementById('wa-template');
  const notesEl = document.getElementById('wa-notes');
  templateEl.addEventListener('input', updateWaPreview);
  notesEl.addEventListener('input', updateWaPreview);

  function updateWaPreview() {
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

  // --- Birthday messages tab ---
  updateBdayPreview();
  const bdayTemplateEl = document.getElementById('bday-template');
  const bdayGiftTemplateEl = document.getElementById('bday-gift-template');
  bdayTemplateEl.addEventListener('input', updateBdayPreview);
  bdayGiftTemplateEl.addEventListener('input', updateBdayPreview);

  function updateBdayPreview() {
    const bdayTemplate = document.getElementById('bday-template').value;
    const bdayGiftTemplate = document.getElementById('bday-gift-template').value;
    document.getElementById('bday-preview').textContent = bdayTemplate.replace(/{name}/g, 'דנה כהן');
    document.getElementById('bday-gift-preview').textContent = bdayGiftTemplate.replace(/{name}/g, 'דנה כהן');
  }

  let notifTabLoaded = false;

  const handleClick = (e) => {
    // Save WhatsApp settings
    if (e.target.closest('#btn-save-wa')) {
      saveSettings({
        waMessage: templateEl.value,
        waNotes: notesEl.value,
      });
      alert('ההגדרות נשמרו בהצלחה!');
      return;
    }

    // Reset WhatsApp settings
    if (e.target.closest('#btn-reset-wa')) {
      if (!confirm('לאפס להגדרות ברירת מחדל?')) return;
      const defaults = getDefaults();
      templateEl.value = defaults.waMessage;
      notesEl.value = defaults.waNotes;
      saveSettings({ waMessage: defaults.waMessage, waNotes: defaults.waNotes });
      updateWaPreview();
      return;
    }

    // Save birthday messages
    if (e.target.closest('#btn-save-bday')) {
      saveSettings({
        bdayMessage: bdayTemplateEl.value,
        bdayGiftMessage: bdayGiftTemplateEl.value,
      });
      alert('הודעות יום הולדת נשמרו!');
      return;
    }

    // Reset birthday messages
    if (e.target.closest('#btn-reset-bday')) {
      if (!confirm('לאפס להגדרות ברירת מחדל?')) return;
      const defaults = getDefaults();
      bdayTemplateEl.value = defaults.bdayMessage;
      bdayGiftTemplateEl.value = defaults.bdayGiftMessage;
      saveSettings({ bdayMessage: defaults.bdayMessage, bdayGiftMessage: defaults.bdayGiftMessage });
      updateBdayPreview();
      return;
    }

    // Tab switching
    const tab = e.target.closest('.settings-tab');
    if (tab) {
      const tabId = tab.dataset.tab;
      document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.settings-tab-content').forEach(c => c.style.display = 'none');
      const target = document.getElementById(`tab-${tabId}`);
      if (target) target.style.display = '';

      if (tabId === 'notifications' && !notifTabLoaded) {
        notifTabLoaded = true;
        loadNotificationsTab();
      }
      return;
    }

    // Notifications tab handlers
    if (e.target.closest('#btn-enable-push')) {
      handleEnablePush();
      return;
    }
    if (e.target.closest('#btn-disable-push')) {
      handleDisablePush();
      return;
    }
    if (e.target.closest('#btn-save-notif')) {
      handleSaveNotifSettings();
      return;
    }
    if (e.target.closest('#btn-test-notif')) {
      handleTestNotification();
      return;
    }
  };

  app.addEventListener('click', handleClick);

  // --- Notifications tab ---
  async function loadNotificationsTab() {
    const container = document.getElementById('tab-notifications');
    try {
      const notifSettings = await getNotificationSettings();
      const pushSupported = isPushSupported();
      const permissionState = getPermissionState();
      const currentSub = pushSupported ? await getCurrentSubscription() : null;
      const isSubscribed = !!currentSub;

      container.innerHTML = `
        <div class="settings-card">
          <h2>התראות פוש</h2>
          ${!pushSupported ? `
            <p class="notif-warning">הדפדפן שלך לא תומך בהתראות פוש. נסי לפתוח את האפליקציה דרך Chrome ולהתקין אותה כ-PWA.</p>
          ` : permissionState === 'denied' ? `
            <p class="notif-warning">ההתראות חסומות בדפדפן. כדי לאפשר, יש לשנות את ההגדרות בדפדפן ולרענן את הדף.</p>
          ` : `
            <div class="notif-status ${isSubscribed ? 'active' : ''}">
              <div class="notif-status-dot"></div>
              <span>${isSubscribed ? 'התראות פעילות' : 'התראות כבויות'}</span>
            </div>
            ${isSubscribed ? `
              <button id="btn-disable-push" class="btn-generate" style="background:var(--bg);color:var(--red);border:1.5px solid var(--red);margin-top:12px">
                כבה התראות
              </button>
            ` : `
              <button id="btn-enable-push" class="btn-generate" style="margin-top:12px">
                הפעל התראות
              </button>
            `}
          `}
        </div>

        ${isSubscribed ? `
          <div class="settings-card">
            <h2>תזכורת לפני תור</h2>
            <div class="notif-toggle-row">
              <label class="notif-toggle-label">
                <span>שלח תזכורת לפני תור</span>
                <label class="notif-switch">
                  <input type="checkbox" id="notif-appt-enabled" ${notifSettings.appointmentEnabled ? 'checked' : ''}>
                  <span class="notif-slider"></span>
                </label>
              </label>
            </div>
            <div class="notif-option-row" id="appt-hours-row" ${!notifSettings.appointmentEnabled ? 'style="opacity:0.4;pointer-events:none"' : ''}>
              <label for="notif-appt-hours">כמה שעות לפני?</label>
              <select id="notif-appt-hours" class="notif-select">
                <option value="1" ${notifSettings.appointmentHoursBefore === 1 ? 'selected' : ''}>שעה</option>
                <option value="2" ${notifSettings.appointmentHoursBefore === 2 ? 'selected' : ''}>שעתיים</option>
                <option value="3" ${notifSettings.appointmentHoursBefore === 3 ? 'selected' : ''}>3 שעות</option>
                <option value="6" ${notifSettings.appointmentHoursBefore === 6 ? 'selected' : ''}>6 שעות</option>
                <option value="12" ${notifSettings.appointmentHoursBefore === 12 ? 'selected' : ''}>12 שעות</option>
                <option value="24" ${notifSettings.appointmentHoursBefore === 24 ? 'selected' : ''}>יום לפני</option>
                <option value="48" ${notifSettings.appointmentHoursBefore === 48 ? 'selected' : ''}>יומיים לפני</option>
              </select>
            </div>
          </div>

          <div class="settings-card">
            <h2>תזכורת יום הולדת</h2>
            <div class="notif-toggle-row">
              <label class="notif-toggle-label">
                <span>שלח תזכורת ליום הולדת</span>
                <label class="notif-switch">
                  <input type="checkbox" id="notif-bday-enabled" ${notifSettings.birthdayEnabled ? 'checked' : ''}>
                  <span class="notif-slider"></span>
                </label>
              </label>
            </div>
            <div class="notif-option-row" id="bday-days-row" ${!notifSettings.birthdayEnabled ? 'style="opacity:0.4;pointer-events:none"' : ''}>
              <label for="notif-bday-days">מתי לשלוח?</label>
              <select id="notif-bday-days" class="notif-select">
                <option value="0" ${notifSettings.birthdayDaysBefore === 0 ? 'selected' : ''}>ביום עצמו</option>
                <option value="1" ${notifSettings.birthdayDaysBefore === 1 ? 'selected' : ''}>יום לפני</option>
                <option value="2" ${notifSettings.birthdayDaysBefore === 2 ? 'selected' : ''}>יומיים לפני</option>
                <option value="3" ${notifSettings.birthdayDaysBefore === 3 ? 'selected' : ''}>3 ימים לפני</option>
                <option value="7" ${notifSettings.birthdayDaysBefore === 7 ? 'selected' : ''}>שבוע לפני</option>
              </select>
            </div>
          </div>

          <button id="btn-save-notif" class="btn-generate">שמור הגדרות התראות</button>
          <button id="btn-test-notif" class="btn-generate" style="background:var(--bg);color:var(--text);margin-top:8px;border:1.5px solid var(--primary-light)">
            שלח התראת בדיקה
          </button>
        ` : ''}
      `;

      const apptToggle = document.getElementById('notif-appt-enabled');
      const bdayToggle = document.getElementById('notif-bday-enabled');

      if (apptToggle) {
        apptToggle.addEventListener('change', () => {
          const row = document.getElementById('appt-hours-row');
          if (row) {
            row.style.opacity = apptToggle.checked ? '' : '0.4';
            row.style.pointerEvents = apptToggle.checked ? '' : 'none';
          }
        });
      }
      if (bdayToggle) {
        bdayToggle.addEventListener('change', () => {
          const row = document.getElementById('bday-days-row');
          if (row) {
            row.style.opacity = bdayToggle.checked ? '' : '0.4';
            row.style.pointerEvents = bdayToggle.checked ? '' : 'none';
          }
        });
      }
    } catch {
      container.innerHTML = `<div class="notif-warning">שגיאה בטעינת הגדרות התראות</div>`;
    }
  }

  async function handleEnablePush() {
    const btn = document.getElementById('btn-enable-push');
    btn.textContent = 'מפעיל...';
    btn.disabled = true;
    try {
      await subscribeToPush();
      notifTabLoaded = false;
      loadNotificationsTab();
    } catch (err) {
      btn.textContent = 'הפעל התראות';
      btn.disabled = false;
      if (err.message === 'Permission denied') {
        alert('לא ניתן להפעיל התראות - ההרשאה נדחתה');
      } else {
        alert('שגיאה בהפעלת התראות');
      }
    }
  }

  async function handleDisablePush() {
    if (!confirm('לכבות את ההתראות?')) return;
    try {
      await unsubscribeFromPush();
      notifTabLoaded = false;
      loadNotificationsTab();
    } catch {
      alert('שגיאה בכיבוי התראות');
    }
  }

  async function handleSaveNotifSettings() {
    const apptEnabled = document.getElementById('notif-appt-enabled')?.checked ?? true;
    const apptHours = parseInt(document.getElementById('notif-appt-hours')?.value || '24');
    const bdayEnabled = document.getElementById('notif-bday-enabled')?.checked ?? true;
    const bdayDays = parseInt(document.getElementById('notif-bday-days')?.value || '0');
    try {
      await saveNotificationSettings({
        appointmentEnabled: apptEnabled,
        appointmentHoursBefore: apptHours,
        birthdayEnabled: bdayEnabled,
        birthdayDaysBefore: bdayDays,
      });
      alert('הגדרות ההתראות נשמרו!');
    } catch {
      alert('שגיאה בשמירת הגדרות');
    }
  }

  function handleTestNotification() {
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification('התראת בדיקה', {
          body: 'ההתראות עובדות! 🎉',
          icon: '/apple-touch-icon.png',
          dir: 'rtl',
          lang: 'he',
          vibrate: [200, 100, 200],
        });
      });
    }
  }

  return () => {
    templateEl.removeEventListener('input', updateWaPreview);
    notesEl.removeEventListener('input', updateWaPreview);
    bdayTemplateEl.removeEventListener('input', updateBdayPreview);
    bdayGiftTemplateEl.removeEventListener('input', updateBdayPreview);
    app.removeEventListener('click', handleClick);
  };
}

function escapeForTextarea(str) {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
