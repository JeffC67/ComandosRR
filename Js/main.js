/* ==========================================================
   PORTAL DE CAPACITACIÓN RR / AS400
   Núcleo de navegación multipágina

   El navbar y el footer se construyen aquí desde una única
   configuración, de modo que todas las páginas comparten la
   misma navegación sin duplicar marcado.

   Cada página declara su profundidad con <body data-root="...">
   y su sección activa con <body data-nav="...">.
   ========================================================== */

/* ---------- 1. CONFIGURACIÓN DE NAVEGACIÓN ---------- */
const NAV = [
  { id: 'inicio',     label: 'Inicio',            href: 'index.html#inicio',     group: 'base' },
  { id: 'busqueda',   label: 'Búsqueda',          href: 'index.html#busqueda',   group: 'base' },
  { id: 'suscriptor', label: 'Suscriptor',        href: 'index.html#suscriptor', group: 'base' },
  { id: 'consultas',  label: 'Consultas',         href: 'index.html#consultas',  group: 'base' },

  { divider: true },

  { id: 'procesos',   label: 'Procesos específicos',  href: 'Paginas/procesos-especificos.html',      group: 'tools' },
  { id: 'juego',      label: 'Juego',                 href: 'Paginas/juego.html',                     group: 'tools' },
  { id: 'paso-a-paso', label: 'Procesos paso a paso', href: 'Paginas/procesos-paso-a-paso.html',      group: 'tools', last: true }
];

const ICONS = {
  inicio: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  busqueda: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
  suscriptor: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  consultas: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  procesos: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  juego: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M9 14h6"/>',
  'paso-a-paso': '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'
};

const ROOT = document.body.dataset.root || './';
const ACTIVE_NAV = document.body.dataset.nav || '';

function resolve(href) {
  return ROOT + href;
}

function buildIcon(id) {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"'
    + ' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
    + ' aria-hidden="true">' + (ICONS[id] || '') + '</svg>';
}

/* ---------- 2. RENDER DEL NAVBAR ---------- */
const BRAND_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>';

function renderNavbar() {
  const nav = document.getElementById('siteNav');
  if (!nav) return;

  nav.className = 'navbar';

  const brand = document.createElement('a');
  brand.className = 'navbar-brand';
  brand.href = resolve('index.html');

  brand.innerHTML = '<span class="navbar-logo" aria-hidden="true">' + BRAND_ICON + '</span>'
    + '<span class="navbar-brand-text">'
    + '<span class="navbar-title">Portal Capacitación</span>'
    + '<span class="navbar-badge">RR / AS400 · v2.0</span>'
    + '</span>';

  const wrapper = document.createElement('div');
  wrapper.className = 'navbar-nav';

  const toggle = document.createElement('button');
  toggle.className = 'menu-toggle';
  toggle.id = 'menuToggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Abrir menú');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'navLinks');
  toggle.innerHTML = '<span></span><span></span><span></span>';

  const list = document.createElement('ul');
  list.className = 'nav-links';
  list.id = 'navLinks';

  NAV.forEach(item => {
    if (item.divider) {
      const li = document.createElement('li');
      li.className = 'nav-divider';
      li.setAttribute('aria-hidden', 'true');
      list.appendChild(li);
      return;
    }

    const li = document.createElement('li');
    const link = document.createElement('a');
    link.className = 'nav-link';
    link.href = resolve(item.href);
    link.dataset.navId = item.id;
    if (item.id === ACTIVE_NAV) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
    link.insertAdjacentHTML('beforeend', buildIcon(item.id));
    link.appendChild(document.createTextNode(item.label));
    li.appendChild(link);
    list.appendChild(li);
  });

  wrapper.appendChild(toggle);
  wrapper.appendChild(list);
  nav.appendChild(brand);
  nav.appendChild(wrapper);
}

/* ---------- 3. RENDER DEL FOOTER ---------- */
function renderFooter() {
  const footer = document.getElementById('siteFooter');
  if (!footer) return;

  footer.className = 'footer';
  footer.innerHTML = '<div class="footer-content">'
    + '<div class="footer-brand">'
    + BRAND_ICON
    + '<span class="footer-brand-text">Portal Capacitación RR / AS400</span>'
    + '</div>'
    + '<p>&copy; 2026 Leonardo Beltr&aacute;n &amp; Jefferson Calder&oacute;n &amp; Julian Mendez &mdash; Todos los derechos reservados.</p>'
    + '<p>Documento interno de referencia. Uso exclusivo para agentes de servicio al cliente.</p>'
    + '</div>';
}

/* ---------- 4. MENÚ DE HAMBURGUESA ---------- */
function initMenuToggle() {
  const toggle = document.getElementById('menuToggle');
  const list = document.getElementById('navLinks');
  if (!toggle || !list) return;

  toggle.addEventListener('click', () => {
    const isOpen = list.classList.toggle('active');
    toggle.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    toggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
  });

  list.addEventListener('click', (event) => {
    if (!event.target.closest('a')) return;
    list.classList.remove('active');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  });
}

/* ---------- 5. RESALTADO DEL ENLACE ACTIVO SEGÚN LA PESTAÑA ---------- */
function syncActiveNavLink() {
  const list = document.getElementById('navLinks');
  if (!list) return;

  const tabId = window.location.hash.replace('#', '');
  if (!tabId || !list.querySelector(`[data-nav-id="${tabId}"]`)) return;

  list.querySelectorAll('.nav-link').forEach(link => {
    const isTabLink = link.dataset.navId === tabId;
    link.classList.toggle('active', isTabLink);
    if (isTabLink) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

/* ==========================================================
   6. PESTAÑAS DE LA BASE DE COMANDOS
   Cada panel se declara con data-tab="id"; el hash de la URL
   (#busqueda, #suscriptor, #consultas) abre la pestaña correcta.
   ========================================================== */
function initTabs() {
  const tabButtons = Array.from(document.querySelectorAll('[role="tab"]'));
  const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
  if (tabButtons.length === 0 || panels.length === 0) return;

  function selectTab(id, focus) {
    const button = tabButtons.find(btn => btn.dataset.tab === id);
    if (!button) return;

    tabButtons.forEach(btn => {
      const selected = btn === button;
      btn.setAttribute('aria-selected', selected ? 'true' : 'false');
      btn.setAttribute('tabindex', selected ? '0' : '-1');
    });

    panels.forEach(panel => {
      panel.hidden = panel.dataset.tab !== id;
    });

    if (focus) button.focus();
    syncActiveNavLink();
  }

  function tabFromHash() {
    const id = window.location.hash.replace('#', '');
    return tabButtons.some(btn => btn.dataset.tab === id) ? id : tabButtons[0].dataset.tab;
  }

  tabButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      const id = button.dataset.tab;
      if (window.location.hash === '#' + id) {
        selectTab(id, false);
      } else {
        window.location.hash = id;
      }
    });

    button.addEventListener('keydown', (event) => {
      const offset = event.key === 'ArrowRight' ? 1
        : event.key === 'ArrowLeft' ? -1
        : event.key === 'Home' ? -index
        : event.key === 'End' ? tabButtons.length - 1 - index
        : 0;

      if (offset === 0 && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault();

      const target = event.key === 'Home' ? 0
        : event.key === 'End' ? tabButtons.length - 1
        : (index + offset + tabButtons.length) % tabButtons.length;

      selectTab(tabButtons[target].dataset.tab, true);
    });
  });

  window.addEventListener('hashchange', () => {
    selectTab(tabFromHash(), false);
    syncActiveNavLink();
  });
  selectTab(tabFromHash(), false);
}

/* ---------- 7. NAVEGACIÓN DE BLOQUES DENTRO DE UN PROCESO ---------- */
function initStepper() {
  const panel = document.querySelector('[data-stepper]');
  if (!panel) return;

  const blocks = Array.from(panel.querySelectorAll('.steps-block'));
  const steps = Array.from(panel.querySelectorAll('.stepper-step'));
  const dots = Array.from(panel.querySelectorAll('.stepper-dots .stepper-dot'));
  const prevBtn = panel.querySelector('.stepper-btn.prev');
  const nextBtn = panel.querySelector('.stepper-btn.next');
  let index = 0;

  function render() {
    blocks.forEach((block, i) => {
      block.hidden = i !== index;
    });
    steps.forEach((step, i) => {
      step.classList.toggle('active', i === index);
      step.classList.toggle('completed', i < index);
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index >= blocks.length - 1;
  }

  if (prevBtn) prevBtn.addEventListener('click', () => { if (index > 0) { index--; render(); } });
  if (nextBtn) nextBtn.addEventListener('click', () => { if (index < blocks.length - 1) { index++; render(); } });

  render();
}

/* ==========================================================
   8. FILTRO DE TARJETAS EN LAS PÁGINAS DE CATEGORÍA
   ========================================================== */
function initFilter() {
  const input = document.querySelector('[data-filter]');
  if (!input) return;

  const scope = document.querySelector(input.dataset.filter);
  if (!scope) return;

  const cards = Array.from(scope.querySelectorAll('[data-filter-item]'));
  const empty = scope.parentElement.querySelector('[data-filter-empty]');

  function apply() {
    const query = input.value.trim().toLowerCase();
    let matches = 0;

    cards.forEach(card => {
      const isMatch = query === '' || card.textContent.toLowerCase().includes(query);
      card.hidden = !isMatch;
      if (isMatch) matches++;
    });

    if (empty) empty.hidden = !(query !== '' && matches === 0);
  }

  input.addEventListener('input', apply);
  apply();
}

/* ---------- 9. ARRANQUE ---------- */
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  renderFooter();
  initMenuToggle();
  initTabs();
  initStepper();
  initFilter();
  syncActiveNavLink();
});
