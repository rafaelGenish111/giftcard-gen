const STORAGE_KEY = 'leah_settings';

const DEFAULTS = {
  waMessage: `שלום {name} 👋
נקבע לך תור ל{type} ביום {date} בשעה {time}.

להוספה ליומן:
{link}

*דגשים חשובים*
{notes}

לאה גניש - מטפלת הוליסטית`,
  waNotes: `- נא להגיע 5 דקות לפני התור
- במקרה של ביטול, נא להודיע 24 שעות מראש`,
};

export function getSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...DEFAULTS, ...stored };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function buildWhatsAppMessage({ name, type, date, time, link }) {
  const settings = getSettings();
  return settings.waMessage
    .replace(/{name}/g, name)
    .replace(/{type}/g, type)
    .replace(/{date}/g, date)
    .replace(/{time}/g, time)
    .replace(/{link}/g, link)
    .replace(/{notes}/g, settings.waNotes);
}
