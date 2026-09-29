/* ==========================================================
   PORTAL DE CAPACITACIÓN RR / AS400
   Juego de teclas de función (F1 - F24)
   ========================================================== */
(function initFunctionKeyGame() {
  const MAX_KEY = 24;
  const panel = document.getElementById('gamePanel');
  if (!panel) return;

  const mapGrid = document.getElementById('gameMappingGrid');
  if (!mapGrid) return;

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
    const cell = cells[n - 13];
    if (cell) cell.classList.add(type);
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

  /* Construye la rejilla de referencia F13 - F24 */
  (function buildMap() {
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
      mapGrid.appendChild(cell);
    }
  })();

  document.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    if (Date.now() < lockUntil) return;

    const target = event.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

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
      setFeedback('correct', `¡Correcto! ${label.name}`, '\u2713');
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

  if (resetBtn) resetBtn.addEventListener('click', resetGame);

  resetGame();
})();
