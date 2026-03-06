const routes = {};
let currentCleanup = null;

export function route(path, handler) {
  routes[path] = handler;
}

export function navigate(path) {
  window.history.pushState({}, '', path);
  handleRoute();
}

function handleRoute() {
  const path = window.location.pathname;
  const app = document.getElementById('app');

  // Cleanup previous page
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }

  // Find matching route
  const handler = routes[path] || routes['*'];
  if (handler) {
    currentCleanup = handler(app) || null;
  }
}

// Handle browser back/forward
window.addEventListener('popstate', handleRoute);

// Handle link clicks with data-link attribute
document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-link]');
  if (link) {
    e.preventDefault();
    navigate(link.getAttribute('href'));
  }
});

export function start() {
  handleRoute();
}
