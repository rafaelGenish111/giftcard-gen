export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' });
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
}

export function showLoading() {
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = '<div class="loading-spinner"></div>';
  document.body.appendChild(overlay);
  return overlay;
}

export function renderEmptyState(message) {
  return `<div class="empty-state"><p>${message}</p></div>`;
}

export function formatPhone(phone) {
  let cleaned = (phone || '').replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('0')) cleaned = '972' + cleaned.slice(1);
  else if (!cleaned.startsWith('972')) cleaned = '972' + cleaned;
  return cleaned;
}

export const TREATMENT_TYPES = [
  { label: 'עיסוי הוליסטי - 60 דקות', type: 'עיסוי הוליסטי', duration: '60 דקות' },
  { label: 'עיסוי הוליסטי - 90 דקות', type: 'עיסוי הוליסטי', duration: '90 דקות' },
  { label: 'עיסוי הוליסטי - 120 דקות', type: 'עיסוי הוליסטי', duration: '120 דקות' },
  { label: 'רפלקסולוגיה - 60 דקות', type: 'רפלקסולוגיה', duration: '60 דקות' },
  { label: 'רפלקסולוגיה - 90 דקות', type: 'רפלקסולוגיה', duration: '90 דקות' },
  { label: 'נרות הופי', type: 'נרות הופי', duration: '' },
];
