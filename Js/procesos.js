/* ==========================================================
   PORTAL DE CAPACITACIÓN RR / AS400
   Módulo "Nuestros procesos"
   CRUD de procesos y sus pasos, persistido en MySQL vía api/procesos.php
   ========================================================== */
(function initProcessBuilder() {
  const panel = document.getElementById('processBuilder');
  if (!panel) return;

  const form = document.getElementById('processForm');
  const nameInput = document.getElementById('processName');
  const descInput = document.getElementById('processDescription');
  const stepsList = document.getElementById('pbSteps');
  const addStepBtn = document.getElementById('pbAddStep');
  const saveBtn = document.getElementById('pbSave');
  const saveLabel = document.getElementById('pbSaveLabel');
  const cancelBtn = document.getElementById('pbCancel');
  const feedbackEl = document.getElementById('pbFeedback');
  const counterEl = document.getElementById('pbStepCounter');
  const savedList = document.getElementById('pbSavedList');
  const savedCounterEl = document.getElementById('pbSavedCounter');
  const collectionEl = document.getElementById('pbCollection');
  const previewName = document.getElementById('pbPreviewName');
  const previewDesc = document.getElementById('pbPreviewDesc');
  const previewSteps = document.getElementById('pbPreviewSteps');
  const noticeEl = document.getElementById('pbApiNotice');

  if (!form || !stepsList || !addStepBtn || !savedList) return;

  const API_URL = 'api/procesos.php';
  const MODAL_ID = 'modal-proceso-detalle';
  const IS_FILE = window.location.protocol === 'file:';

  const ICON_EDIT = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>';
  const ICON_DELETE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';

  /* ---------- Estado ---------- */

  let steps = [];                 // Pasos del formulario: { id, value }
  let nextId = 1;
  let editingId = null;           // Paso abierto en edición
  const nodeById = new Map();

  let processes = [];             // Procesos cargados desde la base
  let editingProcessId = null;    // Proceso abierto en modo edición
  let busy = false;

  /* ---------- Cliente de la API ---------- */

  async function api(action, options) {
    const opts = options || {};
    const url = new URL(API_URL, window.location.href);
    url.searchParams.set('action', action);
    if (opts.id) url.searchParams.set('id', String(opts.id));

    const init = { method: opts.method || 'GET', headers: {} };
    if (opts.body) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(opts.body);
    }

    const response = await fetch(url, init);
    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      throw new Error('El servidor no devolvió una respuesta válida.');
    }
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || 'Ocurrió un error inesperado.');
    }
    return payload.data;
  }

  function isApiAvailable() {
    return !IS_FILE;
  }

  /* ---------- Aviso de entorno ---------- */

  function showApiNotice(message) {
    if (!noticeEl) return;
    noticeEl.textContent = message;
    noticeEl.hidden = false;
  }

  function checkEnvironment() {
    if (IS_FILE) {
      showApiNotice('Estás abriendo el portal como archivo local (file://), así que no se puede guardar en la base de datos. Inicia XAMPP y entra por http://localhost/ComandosRR/');
      if (saveBtn) saveBtn.disabled = true;
      return false;
    }
    return true;
  }

  /* ---------- Creación de nodos de paso ---------- */

  function createStepNode(step) {
    const li = document.createElement('li');
    li.className = 'pb-step';
    li.dataset.id = String(step.id);

    const num = document.createElement('span');
    num.className = 'pb-step-num';
    num.setAttribute('aria-hidden', 'true');

    const body = document.createElement('div');
    body.className = 'pb-step-body';

    const textarea = document.createElement('textarea');
    textarea.className = 'pb-step-text';
    textarea.rows = 1;
    textarea.value = step.value;

    const actions = document.createElement('div');
    actions.className = 'pb-step-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'pb-step-btn pb-step-btn--edit';
    editBtn.dataset.action = 'edit';
    editBtn.innerHTML = ICON_EDIT;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'pb-step-btn pb-step-btn--delete';
    deleteBtn.dataset.action = 'delete';
    deleteBtn.innerHTML = ICON_DELETE;

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    body.appendChild(textarea);
    li.appendChild(num);
    li.appendChild(body);
    li.appendChild(actions);

    return li;
  }

  function getNode(step) {
    let node = nodeById.get(step.id);
    if (!node) {
      node = createStepNode(step);
      nodeById.set(step.id, node);
    }
    return node;
  }

  function getTextarea(node) {
    return node.querySelector('.pb-step-text');
  }

  /* Ajusta la altura del textarea al contenido */
  function autoGrow(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  /* ---------- Renderizado de los pasos ---------- */

  function render() {
    steps.forEach((step, index) => {
      const node = getNode(step);
      const textarea = getTextarea(node);

      node.querySelector('.pb-step-num').textContent = index + 1;
      textarea.placeholder = `Describe el paso ${index + 1}`;
      textarea.setAttribute('aria-label', `Paso ${index + 1}`);
      node.dataset.state = step.id === editingId ? 'edit' : 'saved';
      node.querySelector('.pb-step-btn--edit').setAttribute('aria-label', `Editar paso ${index + 1}`);
      node.querySelector('.pb-step-btn--delete').setAttribute('aria-label', `Eliminar paso ${index + 1}`);

      if (document.activeElement !== textarea) {
        if (textarea.value !== step.value) textarea.value = step.value;
        autoGrow(textarea);
      }

      const current = stepsList.children[index];
      if (current !== node) stepsList.insertBefore(node, current || null);
    });

    nodeById.forEach((node, id) => {
      if (!steps.some(step => step.id === id)) {
        node.remove();
        nodeById.delete(id);
      }
    });

    if (counterEl) {
      counterEl.textContent = steps.length === 1 ? '1 paso' : `${steps.length} pasos`;
    }
    updatePreview();
  }

  function updatePreview() {
    if (previewName) {
      previewName.textContent = (nameInput && nameInput.value.trim()) || 'Proceso sin título';
    }
    if (previewDesc) {
      previewDesc.textContent = (descInput && descInput.value.trim())
        || 'Agrega una descripción general para contextualizar el proceso.';
    }
    if (!previewSteps) return;

    previewSteps.textContent = '';
    const filled = steps.filter(step => step.value.trim());

    if (filled.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'pb-preview-empty';
      empty.textContent = 'Aún no hay pasos definidos.';
      previewSteps.appendChild(empty);
      return;
    }

    steps.forEach((step, index) => {
      if (!step.value.trim()) return;
      const li = document.createElement('li');
      li.className = 'pb-preview-item';
      const num = document.createElement('span');
      num.className = 'pb-preview-item-num';
      num.setAttribute('aria-hidden', 'true');
      num.textContent = index + 1;
      const text = document.createElement('span');
      text.textContent = step.value.trim();
      li.appendChild(num);
      li.appendChild(text);
      previewSteps.appendChild(li);
    });
  }

  /* ---------- Acciones sobre los pasos ---------- */

  function editStep(id) {
    editingId = id;
    render();
    const node = nodeById.get(id);
    if (node) getTextarea(node).focus();
  }

  function lockStep(id) {
    if (editingId !== id) return;
    editingId = null;
    render();
  }

  function addStep() {
    if (editingId !== null) lockStep(editingId);
    const step = { id: nextId++, value: '' };
    steps.push(step);
    render();
    editStep(step.id);
  }

  function deleteStep(id) {
    steps = steps.filter(step => step.id !== id);
    if (editingId === id) editingId = null;

    // Nunca se deja la lista vacía: se crea un paso 1 nuevo en edición
    if (steps.length === 0) {
      const step = { id: nextId++, value: '' };
      steps.push(step);
      render();
      editStep(step.id);
      return;
    }

    render();
    addStepBtn.focus();
  }

  /* ---------- Mensajes ---------- */

  function setFeedback(state, text) {
    if (!feedbackEl) return;
    feedbackEl.dataset.state = state;
    feedbackEl.textContent = text;
  }

  function clearFeedback() {
    if (!feedbackEl) return;
    feedbackEl.dataset.state = 'idle';
    feedbackEl.textContent = '';
  }

  function setBusy(value) {
    busy = value;
    if (saveBtn) saveBtn.disabled = value || IS_FILE;
    if (saveLabel) saveLabel.textContent = value
      ? 'Guardando...'
      : (editingProcessId ? 'Actualizar proceso' : 'Guardar proceso');
  }

  /* ---------- Colección de procesos ---------- */

  function formatDate(timestamp) {
    if (!timestamp) return 'sin fecha';
    const date = new Date(String(timestamp).replace(' ', 'T'));
    if (isNaN(date.getTime())) return 'sin fecha';
    return date.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function renderCollection() {
    savedList.textContent = '';

    if (savedCounterEl) {
      savedCounterEl.textContent = processes.length === 1 ? '1 proceso' : `${processes.length} procesos`;
    }
    if (collectionEl) collectionEl.hidden = false;

    if (processes.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'pb-collection-empty';
      empty.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
      const text = document.createElement('span');
      text.textContent = isApiAvailable()
        ? 'Aún no hay procesos guardados. Completa el formulario y pulsa "Guardar proceso".'
        : 'No se pudieron cargar los procesos guardados.';
      empty.appendChild(text);
      savedList.appendChild(empty);
      return;
    }

    processes.forEach((process) => {
      const card = document.createElement('article');
      card.className = 'pb-saved-card';
      card.dataset.id = String(process.id);
      card.dataset.action = 'view';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Ver detalle del proceso ${process.nombre}`);
      if (process.id === editingProcessId) card.dataset.editing = 'true';

      const head = document.createElement('div');
      head.className = 'pb-saved-head';

      const name = document.createElement('h4');
      name.className = 'pb-saved-name';
      name.textContent = process.nombre;

      const cardActions = document.createElement('div');
      cardActions.className = 'pb-saved-actions';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'pb-step-btn pb-step-btn--edit';
      editBtn.dataset.action = 'edit';
      editBtn.setAttribute('aria-label', `Editar proceso ${process.nombre}`);
      editBtn.innerHTML = ICON_EDIT;

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'pb-step-btn pb-step-btn--delete';
      deleteBtn.dataset.action = 'delete';
      deleteBtn.setAttribute('aria-label', `Eliminar proceso ${process.nombre}`);
      deleteBtn.innerHTML = ICON_DELETE;

      cardActions.appendChild(editBtn);
      cardActions.appendChild(deleteBtn);
      head.appendChild(name);
      head.appendChild(cardActions);

      const desc = document.createElement('p');
      desc.className = 'pb-saved-desc';
      desc.textContent = process.descripcion || 'Sin descripción general.';

      const list = document.createElement('ol');
      list.className = 'pb-saved-steps';
      process.pasos.forEach((text, index) => {
        const li = document.createElement('li');
        li.className = 'pb-saved-step';
        const num = document.createElement('span');
        num.className = 'pb-saved-step-num';
        num.setAttribute('aria-hidden', 'true');
        num.textContent = index + 1;
        const span = document.createElement('span');
        span.textContent = text;
        li.appendChild(num);
        li.appendChild(span);
        list.appendChild(li);
      });

      const meta = document.createElement('p');
      meta.className = 'pb-saved-meta';
      const total = process.pasos.length;
      meta.textContent = `${total} ${total === 1 ? 'paso' : 'pasos'} · creado el ${formatDate(process.created_at)}`;

      card.appendChild(head);
      card.appendChild(desc);
      card.appendChild(list);
      card.appendChild(meta);
      savedList.appendChild(card);
    });
  }

  async function loadProcesses() {
    if (!isApiAvailable()) {
      renderCollection();
      return;
    }
    try {
      processes = await api('list');
      renderCollection();
    } catch (error) {
      processes = [];
      renderCollection();
      setFeedback('error', 'No se pudieron cargar los procesos: ' + error.message);
    }
  }

  /* ---------- Detalle del proceso (modal) ---------- */

  function openDetail(process) {
    const title = document.getElementById('procesoDetalleTitle');
    const subtitle = document.getElementById('procesoDetalleSubtitle');
    const body = document.getElementById('procesoDetalleBody');
    if (!title || !subtitle || !body) return;

    title.textContent = process.nombre;
    const total = process.pasos.length;
    subtitle.textContent = `${total} ${total === 1 ? 'paso' : 'pasos'} · creado el ${formatDate(process.created_at)}`;

    body.textContent = '';

    if (process.descripcion) {
      const desc = document.createElement('p');
      desc.className = 'pb-detail-desc';
      desc.textContent = process.descripcion;
      body.appendChild(desc);
    }

    const label = document.createElement('span');
    label.className = 'sub-section-title';
    label.textContent = 'Pasos del proceso';
    body.appendChild(label);

    const list = document.createElement('ol');
    process.pasos.forEach((text) => {
      const li = document.createElement('li');
      li.textContent = text;
      list.appendChild(li);
    });
    body.appendChild(list);

    if (typeof window.openModal === 'function') {
      window.openModal(MODAL_ID);
    }
  }

  /* ---------- Guardar / actualizar ---------- */

  function collectForm() {
    const name = nameInput ? nameInput.value.trim() : '';
    const description = descInput ? descInput.value.trim() : '';
    const filledSteps = steps.map(step => step.value.trim()).filter(Boolean);

    if (!name) {
      setFeedback('error', 'Escribe un nombre para el proceso.');
      if (nameInput) nameInput.focus();
      return null;
    }
    if (filledSteps.length === 0) {
      setFeedback('error', 'Agrega al menos un paso con contenido.');
      const first = stepsList.querySelector('.pb-step-text');
      if (first) first.focus();
      return null;
    }
    return { nombre: name, descripcion: description, pasos: filledSteps };
  }

  async function submitForm() {
    if (busy || !isApiAvailable()) return;
    const data = collectForm();
    if (!data) return;

    const isUpdate = editingProcessId !== null;
    setBusy(true);

    try {
      if (isUpdate) {
        await api('update', { method: 'PUT', body: Object.assign({ id: editingProcessId }, data) });
      } else {
        await api('create', { method: 'POST', body: data });
      }
      await loadProcesses();
      setFeedback('success', isUpdate
        ? `Proceso "${data.nombre}" actualizado.`
        : `Proceso "${data.nombre}" guardado. Ya puedes crear el siguiente.`);
      resetForm();
    } catch (error) {
      setFeedback('error', 'No se pudo guardar: ' + error.message);
    } finally {
      setBusy(false);
    }
  }

  /* ---------- Modo edición ---------- */

  function setFormMode(mode) {
    const isEdit = mode === 'edit';
    if (saveLabel) saveLabel.textContent = isEdit ? 'Actualizar proceso' : 'Guardar proceso';
    if (cancelBtn) cancelBtn.hidden = !isEdit;
    panel.dataset.mode = mode;
  }

  function loadIntoForm(process) {
    if (nameInput) nameInput.value = process.nombre;
    if (descInput) descInput.value = process.descripcion || '';

    steps = [];
    editingId = null;
    nodeById.forEach(node => node.remove());
    nodeById.clear();

    process.pasos.forEach(text => {
      steps.push({ id: nextId++, value: text });
    });
    if (steps.length === 0) {
      steps.push({ id: nextId++, value: '' });
    }

    editingProcessId = process.id;
    editingId = steps[steps.length - 1].id;
    setFormMode('edit');
    render();
    renderCollection();
    clearFeedback();

    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (nameInput) nameInput.focus();
  }

  function resetForm() {
    if (nameInput) nameInput.value = '';
    if (descInput) descInput.value = '';

    steps = [];
    editingId = null;
    nodeById.forEach(node => node.remove());
    nodeById.clear();

    const step = { id: nextId++, value: '' };
    steps.push(step);
    editingProcessId = null;
    editingId = step.id;
    setFormMode('create');
    render();
    renderCollection();
    if (nameInput) nameInput.focus();
  }

  function cancelEdit() {
    if (editingProcessId === null) return;
    const name = processes.find(p => p.id === editingProcessId);
    resetForm();
    setFeedback('success', `Edición cancelada. "${name ? name.nombre : ''}" sigue sin cambios.`);
  }

  /* ---------- Eliminar ---------- */

  async function deleteProcess(process) {
    if (busy) return;
    if (!window.confirm(`¿Eliminar el proceso "${process.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    setBusy(true);
    try {
      await api('delete', { method: 'DELETE', id: process.id });
      if (editingProcessId === process.id) {
        resetForm();
      }
      await loadProcesses();
      setFeedback('success', `Proceso "${process.nombre}" eliminado.`);
    } catch (error) {
      setFeedback('error', 'No se pudo eliminar: ' + error.message);
    } finally {
      setBusy(false);
    }
  }

  /* ---------- Eventos ---------- */

  addStepBtn.addEventListener('click', addStep);
  if (saveBtn) saveBtn.addEventListener('click', submitForm);
  if (cancelBtn) cancelBtn.addEventListener('click', cancelEdit);

  /* Botones de editar/eliminar de cualquier paso del formulario */
  stepsList.addEventListener('click', (event) => {
    const btn = event.target.closest('.pb-step-btn');
    if (!btn) return;
    const node = btn.closest('.pb-step');
    if (!node) return;
    const id = Number(node.dataset.id);
    if (btn.dataset.action === 'edit') editStep(id);
    else deleteStep(id);
  });

  /* Sincroniza el valor digitado con el estado */
  stepsList.addEventListener('input', (event) => {
    if (!event.target.classList.contains('pb-step-text')) return;
    const node = event.target.closest('.pb-step');
    const step = steps.find(item => item.id === Number(node.dataset.id));
    if (!step) return;
    step.value = event.target.value;
    autoGrow(event.target);
    updatePreview();
    clearFeedback();
  });

  /* Al perder el foco el paso se bloquea, salvo que el foco siga dentro del mismo paso */
  stepsList.addEventListener('focusout', (event) => {
    const node = event.target.closest('.pb-step');
    if (!node) return;
    if (event.relatedTarget && node.contains(event.relatedTarget)) return;
    lockStep(Number(node.dataset.id));
  });

  /* Escape o Ctrl/Cmd+Enter cierran la edición del paso */
  stepsList.addEventListener('keydown', (event) => {
    if (!event.target.classList.contains('pb-step-text')) return;
    if (event.key === 'Escape' || (event.key === 'Enter' && (event.ctrlKey || event.metaKey))) {
      event.preventDefault();
      event.target.blur();
    }
  });

  /* Vista previa en vivo */
  if (nameInput) nameInput.addEventListener('input', updatePreview);
  if (descInput) descInput.addEventListener('input', updatePreview);

  /* Acciones sobre las tarjetas de la colección (delegación) */
  savedList.addEventListener('click', (event) => {
    const card = event.target.closest('.pb-saved-card');
    if (!card) return;
    const process = processes.find(p => p.id === Number(card.dataset.id));
    if (!process) return;

    const btn = event.target.closest('.pb-step-btn');
    if (btn) {
      event.stopPropagation();
      if (btn.dataset.action === 'edit') loadIntoForm(process);
      else deleteProcess(process);
      return;
    }
    openDetail(process);
  });

  /* Abrir el detalle con Enter desde el teclado */
  savedList.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = event.target.closest('.pb-saved-card');
    if (!card) return;
    event.preventDefault();
    const process = processes.find(p => p.id === Number(card.dataset.id));
    if (process) openDetail(process);
  });

  /* Evita el envío por Enter fuera de los textareas de pasos */
  form.addEventListener('submit', (event) => event.preventDefault());

  /* ---------- Estado inicial ---------- */

  steps.push({ id: nextId++, value: '' });
  editingId = steps[0].id;
  setFormMode('create');
  render();
  renderCollection();

  if (checkEnvironment()) {
    loadProcesses();
  }
})();
