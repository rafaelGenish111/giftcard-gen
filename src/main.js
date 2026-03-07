import './styles/main.css';
import { route, start } from './lib/router.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderClientList } from './pages/client-list.js';
import { renderClientForm } from './pages/client-form.js';
import { renderClientProfile } from './pages/client-profile.js';
import { renderForm } from './pages/form.js';
import { renderPreview } from './pages/preview.js';
import { renderAdmin } from './pages/admin.js';
import { renderBooking } from './pages/booking.js';
import { renderSettings } from './pages/settings.js';
import { renderAppointments } from './pages/appointments.js';
import { renderPunchCards } from './pages/punch-cards.js';

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// Routes
route('/', renderDashboard);
route('/clients', renderClientList);
route('/clients/new', renderClientForm);
route('/clients/:id/edit', renderClientForm);
route('/clients/:id', renderClientProfile);
route('/gift-card', renderForm);
route('/preview', renderPreview);
route('/admin', renderAdmin);
route('/book', renderBooking);
route('/appointments', renderAppointments);
route('/punch-cards', renderPunchCards);
route('/settings', renderSettings);
route('*', renderDashboard);

// Start
start();
