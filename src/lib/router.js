const routes = [];
let currentCleanup = null;
let fallbackHandler = null;

export function route(path, handler) {
  if (path === '*') {
    fallbackHandler = handler;
    return;
  }

  // Convert /clients/:id to regex with named params
  const paramNames = [];
  const pattern = path.replace(/:([^/]+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  const regex = new RegExp(`^${pattern}$`);

  routes.push({ regex, paramNames, handler });
}

export function navigate(path) {
  window.history.pushState({}, '', path);
  handleRoute();
}

function handleRoute() {
  const path = window.location.pathname;
  const app = document.getElementById('app');

  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }

  for (const r of routes) {
    const match = path.match(r.regex);
    if (match) {
      const params = {};
      r.paramNames.forEach((name, i) => {
        params[name] = match[i + 1];
      });
      currentCleanup = r.handler(app, params) || null;
      return;
    }
  }

  if (fallbackHandler) {
    currentCleanup = fallbackHandler(app, {}) || null;
  }
}

window.addEventListener('popstate', handleRoute);

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
