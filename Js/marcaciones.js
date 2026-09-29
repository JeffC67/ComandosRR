/* ==========================================================
   PORTAL DE CAPACITACIÓN RR / AS400
   Marcaciones cerradas
   Cada marcación muestra su propio guion de cierre.
   ========================================================== */
(function initMarcaciones() {
  const lista = document.getElementById('marcacionList');
  if (!lista) return;

  const PASOS = [
    'Presiona <strong>F22</strong> para registrar la <strong>marcación y las notas</strong>.',
    'Presiona <strong>Enter</strong>.',
    'Ingresa el <strong>código de cierre</strong> y el campo <strong>Answer</strong>.',
    'Presiona <strong>F2</strong>.',
    'Presiona <strong>F5</strong> para finalizar.'
  ];

  const titleEl = document.getElementById('marcacionProcessTitle');
  const stepsEl = document.getElementById('marcacionProcessSteps');

  function mostrar(codigo) {
    if (titleEl) titleEl.textContent = `Proceso de marcación cerrada · ${codigo}`;

    if (stepsEl) {
      stepsEl.textContent = '';
      PASOS.forEach((paso) => {
        const li = document.createElement('li');
        li.innerHTML = paso;
        stepsEl.appendChild(li);
      });
    }

    lista.querySelectorAll('.marcacion-item').forEach(item => {
      const key = item.querySelector('.cmd-key');
      const isActive = !!key && key.textContent.trim() === codigo;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  lista.addEventListener('click', (event) => {
    const item = event.target.closest('.marcacion-item');
    if (!item) return;
    const key = item.querySelector('.cmd-key');
    if (key) mostrar(key.textContent.trim());
  });

  lista.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const item = event.target.closest('.marcacion-item');
    if (!item) return;
    event.preventDefault();
    const key = item.querySelector('.cmd-key');
    if (key) mostrar(key.textContent.trim());
  });

  const inicial = lista.querySelector('.marcacion-item .cmd-key');
  mostrar(inicial ? inicial.textContent.trim() : 'SAC NPP');
})();
