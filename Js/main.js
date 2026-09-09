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
  document.body.style.overflow = '';
}

function closeModalOnOuterClick(event, id) {
  if (event.target.id === id) {
    closeModal(id);
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
