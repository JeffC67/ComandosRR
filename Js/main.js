/* ==========================================================
   PORTAL DE CAPACITACIÓN RR / AS400
   JavaScript Principal
   ========================================================== */

/* ---------- 1. MENÚ DE HAMBURGUESA ---------- */
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    menuToggle.classList.toggle('open');
    const isOpen = navLinks.classList.contains('active');
    menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    menuToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
  });

  // Cerrar menú al hacer clic en un enlace
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      menuToggle.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ---------- 2. INDICADOR DE SECCIÓN ACTIVA ---------- */
function setActiveNavLink() {
  const sections = document.querySelectorAll('section[id]');
  const navLinksList = document.querySelectorAll('.nav-link');

  let currentSectionId = '';

  sections.forEach(section => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= 120) {
      currentSectionId = section.id;
    }
  });

  navLinksList.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${currentSectionId}`);
  });
}

window.addEventListener('scroll', setActiveNavLink, { passive: true });
document.addEventListener('DOMContentLoaded', setActiveNavLink);

/* ---------- 3. CONTROL DE MODALES ---------- */
let currentModalIndex = 0;
let currentModalId = null;

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden'; // Bloquear scroll del body

  currentModalId = id;
  currentModalIndex = 0;
  updateModalSteps(0);

  // Reiniciar la búsqueda del modal al abrirlo
  const searchInput = modal.querySelector('.modal-search-input');
  if (searchInput) {
    searchInput.value = '';
    filterProcesses(searchInput);
  }

  // Focus en el botón de cerrar para accesibilidad
  setTimeout(() => {
    const closeBtn = modal.querySelector('.close-btn');
    if (closeBtn) closeBtn.focus();
  }, 100);
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  modal.classList.remove('active');

  // Solo desbloquear el scroll si no queda ningún modal abierto
  const anyActive = document.querySelector('.modal-overlay.active');
  if (!anyActive) {
    document.body.style.overflow = '';
  }
}

function closeModalOnOuterClick(event, id) {
  if (event.target.id === id) {
    closeModal(id);
  }
}

function filterProcesses(input) {
  const modal = input.closest('.modal-overlay');
  const query = input.value.trim().toLowerCase();
  const cards = modal.querySelectorAll('.process-card, .marcacion-item');
  const noResults = modal.querySelector('.modal-no-results');
  const emptyState = modal.querySelector('.modal-empty');

  let matches = 0;
  cards.forEach(card => {
    const text = [card.querySelector('h3'), card.querySelector('p'),
                  card.querySelector('.cmd-label'), card.querySelector('.cmd-key')]
      .filter(el => el)
      .map(el => el.textContent)
      .join(' ')
      .toLowerCase();
    const isMatch = query === '' || text.includes(query);
    card.classList.toggle('hidden', !isMatch);
    if (isMatch) matches++;
  });

  if (emptyState) {
    emptyState.classList.toggle('hidden', query !== '');
  }

  if (noResults) {
    const showNoResults = query !== '' && (cards.length === 0 || matches === 0);
    noResults.textContent = `No se encontró ningún proceso que coincida con "${input.value.trim()}".`;
    noResults.classList.toggle('hidden', !showNoResults);
  }
}

/* Navegación por pasos dentro del modal */
function updateModalSteps() {
  const steps = document.querySelectorAll(`#${currentModalId} .progress-step`);
  const bodies = document.querySelectorAll(`#${currentModalId} .modal-body-block`);

  // Actualizar bloques visibles
  bodies.forEach((block, index) => {
    if (index === currentModalIndex) {
      block.style.display = 'block';
    } else {
      block.style.display = 'none';
    }
  });

  // Actualizar indicadores de progreso
  steps.forEach((step, index) => {
    step.classList.remove('active', 'completed');
    if (index < currentModalIndex) {
      step.classList.add('completed');
    } else if (index === currentModalIndex) {
      step.classList.add('active');
    }
  });

  // Actualizar los dots de navegación inferior
  const navDots = document.querySelectorAll(`#${currentModalId} .nav-dot`);
  navDots.forEach((dot, index) => {
    dot.classList.toggle('active', index === currentModalIndex);
  });

  // Actualizar estado de botones
  const prevBtn = document.querySelector(`#${currentModalId} .modal-nav-btn.prev`);
  const nextBtn = document.querySelector(`#${currentModalId} .modal-nav-btn.next`);
  if (prevBtn) prevBtn.disabled = currentModalIndex === 0;
  if (nextBtn) {
    nextBtn.disabled = currentModalIndex >= bodies.length - 1;
  }
}

function nextModalStep() {
  const bodies = document.querySelectorAll(`#${currentModalId} .modal-body-block`);
  if (currentModalIndex < bodies.length - 1) {
    currentModalIndex++;
    updateModalSteps();
  }
}

function prevModalStep() {
  if (currentModalIndex > 0) {
    currentModalIndex--;
    updateModalSteps();
  }
}

/* Cerrar modal con tecla Escape */
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && currentModalId) {
    closeModal(currentModalId);
  }
});

/* ---------- 4. JUEGO DE TECLAS DE FUNCIÓN (F1 - F24) ---------- */
(function initFunctionKeyGame() {
  const MAX_KEY = 24;
  const panel = document.getElementById('gamePanel');
  if (!panel) return;

  const targetEl = document.getElementById('gameTarget');
  const feedbackEl = document.getElementById('gameFeedback');
  const feedbackIconEl = document.getElementById('gameFeedbackIcon');
  const feedbackTextEl = document.getElementById('gameFeedbackText');
  const correctBarEl = document.getElementById('gameCorrectBar');
  const correctTextEl = document.getElementById('gameCorrectText');
  const scoreEl = document.getElementById('gameScore');
  const missEl = document.getElementById('gameMiss');
  const streakEl = document.getElementById('gameStreak');
  const resetBtn = document.getElementById('gameReset');

  let score = 0;
  let misses = 0;
  let streak = 0;
  let currentTarget = 0;
  let previousTarget = 0;
  let active = false;
  let lockUntil = 0;
  let nextTimer = null;

  function labelOf(n) {
    if (n <= 12) return { name: `F${n}`, combo: `F${n}` };
    return { name: `F${n}`, combo: `Shift+F${n - 12}` };
  }

  function updateStats() {
    scoreEl.textContent = score;
    missEl.textContent = misses;
    streakEl.textContent = streak;
  }

  function setFeedback(state, text, icon) {
    feedbackEl.dataset.state = state;
    feedbackTextEl.textContent = text;
    feedbackIconEl.textContent = icon;
    feedbackEl.classList.remove('pulse');
    void feedbackEl.offsetWidth;
    feedbackEl.classList.add('pulse');
  }

  function setCorrectBar(state, text) {
    correctBarEl.dataset.state = state;
    correctTextEl.textContent = text;
  }

  function clearMapHighlights() {
    document.querySelectorAll('.game-map-cell.hit, .game-map-cell.miss')
      .forEach(cell => cell.classList.remove('hit', 'miss'));
  }

  function highlightMap(n, type) {
    const cells = document.querySelectorAll('.game-map-cell');
    const idx = n - 13;
    if (cells[idx]) {
      cells[idx].classList.add(type);
    }
  }

  function nextTarget() {
    clearMapHighlights();
    do {
      currentTarget = Math.floor(Math.random() * MAX_KEY) + 1;
    } while (currentTarget === previousTarget && MAX_KEY > 1);
    previousTarget = currentTarget;

    targetEl.textContent = labelOf(currentTarget).name;
    targetEl.classList.remove('flash');
    void targetEl.offsetWidth;
    targetEl.classList.add('flash');

    setFeedback('idle', 'Presiona la tecla indicada', '\u2713');
    setCorrectBar('idle', 'El comando correcto aparecerá aquí si fallas.');
  }

  function resetGame() {
    clearTimeout(nextTimer);
    score = 0;
    misses = 0;
    streak = 0;
    previousTarget = 0;
    updateStats();
    nextTarget();
  }

  /* Construir rejilla de referencia F13-F24 */
  (function buildMap() {
    const grid = document.getElementById('gameMappingGrid');
    if (!grid) return;
    for (let n = 13; n <= 24; n++) {
      const label = labelOf(n);
      const cell = document.createElement('div');
      cell.className = 'game-map-cell';
      const name = document.createElement('span');
      name.className = 'game-map-name';
      name.textContent = label.name;
      const combo = document.createElement('span');
      combo.className = 'game-map-combo';
      combo.textContent = label.combo.replace('Shift+', 'Shift ');
      cell.appendChild(name);
      cell.appendChild(combo);
      grid.appendChild(cell);
    }
  })();

  /* Solo interceptar teclas cuando el juego esté visible */
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      active = entries[0].isIntersecting;
    }, { threshold: 0.35 });
    observer.observe(panel);
  } else {
    active = true;
  }

  document.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    if (!active) return;
    if (Date.now() < lockUntil) return;
    // No interferir con la búsqueda dentro de los modales
    const target = event.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
    if (document.querySelector('.modal-overlay.active')) return;

    const match = /^F(\d{1,2})$/.exec(event.key);
    if (!match) return;

    event.preventDefault();

    let n = parseInt(match[1], 10);
    if (n <= 12 && event.shiftKey) n += 12;

    nextTimer = setTimeout(nextTarget, 650);

    if (n === currentTarget) {
      score++;
      streak++;
      updateStats();
      const label = labelOf(currentTarget);
      setFeedback('correct', `\u00A1Correcto! ${label.name}`, '\u2713');
      setCorrectBar('correct', `Comando correcto: ${label.name} = ${label.combo}`);
      if (currentTarget > 12) highlightMap(currentTarget, 'hit');
    } else {
      misses++;
      streak = 0;
      updateStats();
      const label = labelOf(currentTarget);
      const pressed = labelOf(n);
      setFeedback('wrong', `Incorrecto · ${pressed.combo}`, '\u2715');
      setCorrectBar('wrong', `Comando correcto: ${label.name} = ${label.combo} · Tu respuesta: ${pressed.combo}`);
      if (currentTarget > 12) highlightMap(currentTarget, 'miss');
    }

    lockUntil = Date.now() + 700;
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', resetGame);
  }

  resetGame();
})();

/* ---------- 5. MARCACIONES CERRADAS ---------- */
const MARCA_PASOS = [
  'Presiona <strong>F22</strong> para registrar la <strong>marcación y las notas</strong>.',
  'Presiona <strong>Enter</strong>.',
  'Ingresa el <strong>código de cierre</strong> y el campo <strong>Answer</strong>.',
  'Presiona <strong>F2</strong>.',
  'Presiona <strong>F5</strong> para finalizar.'
];

function mostrarProcesoMarcacion(codigo) {
  const title = document.getElementById('marcacionProcessTitle');
  const steps = document.getElementById('marcacionProcessSteps');
  if (!title || !steps) return;

  title.textContent = `Proceso de marcación cerrada · ${codigo}`;
  steps.innerHTML = MARCA_PASOS.map(paso => `<li>${paso}</li>`).join('');

  document.querySelectorAll('.marcacion-item').forEach(item => {
    const key = item.querySelector('.cmd-key');
    item.classList.toggle('active', !!key && key.textContent === codigo);
  });
}

document.addEventListener('DOMContentLoaded', () => mostrarProcesoMarcacion('SAC NPP'));
