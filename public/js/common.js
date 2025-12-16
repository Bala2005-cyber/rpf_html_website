export function setActiveNav() {
  const path = window.location.pathname;
  const links = document.querySelectorAll('[data-nav]');
  links.forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;
    const isActive = (href === '/' && (path === '/' || path.endsWith('/index.html'))) || path.endsWith(href);
    if (isActive) a.classList.add('active');
    else a.classList.remove('active');
  });
}

export function formatDeadline(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
