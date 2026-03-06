// Register Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// Elements
const formScreen = document.getElementById('form-screen');
const previewScreen = document.getElementById('preview-screen');
const form = document.getElementById('gift-form');
const btnBack = document.getElementById('btn-back');
const btnWhatsapp = document.getElementById('btn-whatsapp');
const btnDownload = document.getElementById('btn-download');
const canvas = document.getElementById('gift-card-canvas');
const ctx = canvas.getContext('2d');

// Current recipient phone
let currentPhone = '';

// Preload background image
const bgImage = new Image();
bgImage.src = 'background.jpeg';

// Set default date to 3 months from now
const validUntilInput = document.getElementById('validUntil');
const defaultDate = new Date();
defaultDate.setMonth(defaultDate.getMonth() + 3);
validUntilInput.value = defaultDate.toISOString().split('T')[0];

// Screen navigation
function showScreen(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

// Format date to Hebrew format
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  });
}

// ============================================================
// Card text positioning (percentage of image dimensions)
// Adjust these values to fine-tune text placement on the image
// ============================================================
const FIELD_CONFIG = {
  // The text fields sit inside the white bars in the image
  // x = horizontal center of the text area (left of the label)
  // y = vertical center of each field bar
  recipient: { x: 0.42, y: 0.332, maxWidth: 0.45 },
  duration:  { x: 0.42, y: 0.385, maxWidth: 0.45 },
  validDate: { x: 0.42, y: 0.438, maxWidth: 0.45 },
  // Blessing area - the semi-transparent box below the fields
  blessing:  { x: 0.50, y: 0.565, maxWidth: 0.68, lineHeight: 1.7 },
};

const TEXT_COLOR = '#4a3728';
const FIELD_FONT_SIZE = 0.038;   // as fraction of image height (larger for Amatic SC)
const BLESSING_FONT_SIZE = 0.032;

// Draw the gift card on canvas
function drawCard(data) {
  return new Promise((resolve) => {
    const draw = () => {
      const w = bgImage.naturalWidth;
      const h = bgImage.naturalHeight;
      canvas.width = w;
      canvas.height = h;

      // Draw background image
      ctx.drawImage(bgImage, 0, 0, w, h);

      // Field text style
      const fieldFontSize = Math.round(h * FIELD_FONT_SIZE);
      ctx.fillStyle = TEXT_COLOR;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Draw recipient name
      ctx.font = `700 ${fieldFontSize}px 'Amatic SC', cursive`;
      ctx.fillText(
        data.recipient,
        w * FIELD_CONFIG.recipient.x,
        h * FIELD_CONFIG.recipient.y,
        w * FIELD_CONFIG.recipient.maxWidth
      );

      // Draw treatment duration
      ctx.fillText(
        data.duration,
        w * FIELD_CONFIG.duration.x,
        h * FIELD_CONFIG.duration.y,
        w * FIELD_CONFIG.duration.maxWidth
      );

      // Draw valid until date
      ctx.fillText(
        data.validDate,
        w * FIELD_CONFIG.validDate.x,
        h * FIELD_CONFIG.validDate.y,
        w * FIELD_CONFIG.validDate.maxWidth
      );

      // Draw blessing text (multi-line)
      if (data.blessing) {
        const blessingFontSize = Math.round(h * BLESSING_FONT_SIZE);
        ctx.font = `400 ${blessingFontSize}px 'Amatic SC', cursive`;
        const cfg = FIELD_CONFIG.blessing;
        const maxTextWidth = w * cfg.maxWidth;
        const lineHeight = blessingFontSize * cfg.lineHeight;

        // Split text into lines (respect manual line breaks + word wrap)
        const paragraphs = data.blessing.split('\n');
        const lines = [];
        for (const para of paragraphs) {
          const words = para.split(' ');
          let currentLine = '';
          for (const word of words) {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxTextWidth && currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          lines.push(currentLine);
        }

        // Center the block vertically around the blessing area center
        const totalHeight = lines.length * lineHeight;
        const startY = h * cfg.y - totalHeight / 2 + lineHeight / 2;

        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], w * cfg.x, startY + i * lineHeight, maxTextWidth);
        }
      }

      resolve();
    };

    if (bgImage.complete && bgImage.naturalWidth > 0) {
      draw();
    } else {
      bgImage.onload = draw;
    }
  });
}

// Generate card on form submit
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    recipient: document.getElementById('recipientName').value.trim(),
    duration: document.getElementById('treatmentDuration').value,
    validDate: formatDate(document.getElementById('validUntil').value),
    blessing: document.getElementById('blessing').value.trim(),
    phone: document.getElementById('recipientPhone').value.trim(),
  };

  // Store phone for WhatsApp send
  currentPhone = data.phone;

  await drawCard(data);
  showScreen(previewScreen);
});

// Back button
btnBack.addEventListener('click', () => {
  showScreen(formScreen);
});

// Loading overlay
function showLoading() {
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = '<div class="loading-spinner"></div>';
  document.body.appendChild(overlay);
  return overlay;
}

// Get canvas as blob
function canvasToBlob() {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png', 1.0);
  });
}

// Download image
function downloadImage() {
  const link = document.createElement('a');
  link.download = 'gift-card-leah-genish.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// Format phone to international format (Israel)
function formatPhone(phone) {
  let cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '972' + cleaned.slice(1);
  } else if (!cleaned.startsWith('972')) {
    cleaned = '972' + cleaned;
  }
  return cleaned;
}

// WhatsApp - send directly to recipient
btnWhatsapp.addEventListener('click', async () => {
  const loading = showLoading();
  try {
    const blob = await canvasToBlob();
    const file = new File([blob], 'gift-card.png', { type: 'image/png' });
    const phone = formatPhone(currentPhone);

    // Try Web Share API first (works best on iOS - lets user pick WhatsApp)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Gift Card - Leah Genish',
        text: 'קיבלת כרטיס מתנה לטיפול אצל Leah Genish!',
      });
    } else {
      // Fallback: open WhatsApp chat with the recipient's number
      const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent('קיבלת כרטיס מתנה לטיפול אצל Leah Genish! 🎁')}`;
      window.open(waUrl, '_blank');
      // Also download the image so user can attach it
      downloadImage();
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      const phone = formatPhone(currentPhone);
      const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent('קיבלת כרטיס מתנה לטיפול אצל Leah Genish! 🎁')}`;
      window.open(waUrl, '_blank');
      downloadImage();
    }
  } finally {
    loading.remove();
  }
});

// Download button
btnDownload.addEventListener('click', async () => {
  const loading = showLoading();
  try {
    const blob = await canvasToBlob();
    const file = new File([blob], 'gift-card.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Gift Card - Leah Genish',
      });
    } else {
      downloadImage();
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      downloadImage();
    }
  } finally {
    loading.remove();
  }
});
