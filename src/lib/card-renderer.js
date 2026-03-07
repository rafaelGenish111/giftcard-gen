// ============================================================
// Card text positioning (percentage of image dimensions)
// ============================================================
const FIELD_CONFIG = {
  recipient: { x: 0.42, y: 0.332, maxWidth: 0.45 },
  duration:  { x: 0.42, y: 0.385, maxWidth: 0.45 },
  validDate: { x: 0.42, y: 0.438, maxWidth: 0.45 },
  blessing:  { x: 0.50, y: 0.565, maxWidth: 0.68, lineHeight: 1.7 },
};

const TEXT_COLOR = '#4a3728';
const FIELD_FONT_SIZE = 0.038;
const BLESSING_FONT_SIZE = 0.020;

let bgImage = null;

function loadBg() {
  if (bgImage) return Promise.resolve(bgImage);
  return new Promise((resolve) => {
    bgImage = new Image();
    bgImage.onload = () => resolve(bgImage);
    bgImage.src = '/background.jpeg';
  });
}

export async function drawCard(canvas, data) {
  await document.fonts.load("400 16px 'Bellefair'");
  const img = await loadBg();
  const ctx = canvas.getContext('2d');
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  canvas.width = w;
  canvas.height = h;

  ctx.drawImage(img, 0, 0, w, h);

  const fieldFontSize = Math.round(h * FIELD_FONT_SIZE);
  ctx.fillStyle = TEXT_COLOR;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Fields
  ctx.font = `700 ${fieldFontSize}px 'Bellefair', serif`;

  ctx.fillText(data.recipient, w * FIELD_CONFIG.recipient.x, h * FIELD_CONFIG.recipient.y, w * FIELD_CONFIG.recipient.maxWidth);
  ctx.fillText(data.duration, w * FIELD_CONFIG.duration.x, h * FIELD_CONFIG.duration.y, w * FIELD_CONFIG.duration.maxWidth);
  ctx.fillText(data.validDate, w * FIELD_CONFIG.validDate.x, h * FIELD_CONFIG.validDate.y, w * FIELD_CONFIG.validDate.maxWidth);

  // Blessing
  if (data.blessing) {
    const blessingFontSize = Math.round(h * BLESSING_FONT_SIZE);
    ctx.font = `400 ${blessingFontSize}px 'Bellefair', serif`;
    const cfg = FIELD_CONFIG.blessing;
    const maxTextWidth = w * cfg.maxWidth;
    const lineHeight = blessingFontSize * cfg.lineHeight;

    const paragraphs = data.blessing.split('\n');
    const lines = [];
    for (const para of paragraphs) {
      const words = para.split(' ');
      let currentLine = '';
      for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        if (ctx.measureText(testLine).width > maxTextWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      lines.push(currentLine);
    }

    const totalHeight = lines.length * lineHeight;
    const startY = h * cfg.y - totalHeight / 2 + lineHeight / 2;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], w * cfg.x, startY + i * lineHeight, maxTextWidth);
    }
  }
}

export function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1.0));
}

export function downloadCanvas(canvas) {
  const link = document.createElement('a');
  link.download = 'gift-card-leah-genish.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export function formatPhone(phone) {
  let cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('0')) cleaned = '972' + cleaned.slice(1);
  else if (!cleaned.startsWith('972')) cleaned = '972' + cleaned;
  return cleaned;
}
