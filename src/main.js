import './styles/main.css';
import { route, start } from './lib/router.js';
import { renderForm } from './pages/form.js';
import { renderPreview } from './pages/preview.js';
import { renderAdmin } from './pages/admin.js';

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// Routes
route('/', renderForm);
route('/preview', renderPreview);
route('/admin', renderAdmin);
route('*', renderForm); // fallback

// Start
start();
