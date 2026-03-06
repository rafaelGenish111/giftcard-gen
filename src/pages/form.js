import { navigate } from '../lib/router.js';
import { createCard } from '../lib/api.js';
import { drawCard } from '../lib/card-renderer.js';

export function renderForm(app) {
  // Set default date 3 months out
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
          <label for="recipientName">שם מקבל/ת המתנה (עבור)</label>
          <input type="text" id="recipientName" placeholder="לדוגמה: דנה כהן" required>
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
    </div>
  `;

  const form = document.getElementById('gift-form');

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const recipientPhone = document.getElementById('recipientPhone').value.trim();
    const validUntilRaw = document.getElementById('validUntil').value;
    const recipient = document.getElementById('recipientName').value.trim();
    const duration = document.getElementById('treatmentDuration').value;
    const blessing = document.getElementById('blessing').value.trim();
    const buyerName = document.getElementById('buyerName').value.trim();
    const isPaid = document.getElementById('isPaid').checked;

    // Save to backend
    try {
      await createCard({ recipient, recipientPhone, duration, validUntil: validUntilRaw, blessing, buyerName, isPaid });
    } catch (err) {
      console.warn('Failed to save card:', err);
    }

    // Store data for preview page
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
  return () => form.removeEventListener('submit', handleSubmit);
}
