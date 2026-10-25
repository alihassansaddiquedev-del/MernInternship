const STORAGE_KEY = 'taskwell.tasks.v1';
const taskForm = document.querySelector('#task-form');
const taskList = document.querySelector('#task-list');
const titleInput = document.querySelector('#task-title');
const emailInput = document.querySelector('#task-email');
const dueInput = document.querySelector('#task-due');
const priorityInput = document.querySelector('#task-priority');
const taskIdInput = document.querySelector('#task-id');
const formHeading = document.querySelector('#form-heading');
const submitButton = document.querySelector('#submit-button');
const cancelEditButton = document.querySelector('#cancel-edit');
const formStatus = document.querySelector('#form-status');
const titleError = document.querySelector('#title-error');
const emailError = document.querySelector('#email-error');
const deleteDialog = document.querySelector('#delete-dialog');
const dialogCopy = document.querySelector('#dialog-copy');
const filterSelect = document.querySelector('#task-filter');
const emptyState = document.querySelector('#empty-state');

let tasks = readTasks();
let pendingDeleteId = null;
let validationTimer;
let resizeTimer;

function readTasks() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(value)) return [];
    return value.filter(task => task && typeof task.id === 'string' && typeof task.title === 'string')
      .map(task => ({
        id: task.id,
        title: task.title,
        email: typeof task.email === 'string' ? task.email : '',
        dueDate: typeof task.dueDate === 'string' ? task.dueDate : '',
        priority: ['gentle', 'steady', 'urgent'].includes(task.priority) ? task.priority : 'steady',
        completed: Boolean(task.completed),
        createdAt: typeof task.createdAt === 'string' ? task.createdAt : new Date().toISOString()
      }));
  } catch (error) {
    console.warn('Saved tasks could not be read:', error);
    return [];
  }
}

function persistTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.error('Tasks could not be saved:', error);
    formStatus.textContent = 'Could not save changes. Check available browser storage.';
    return false;
  }
}

function formatDate(value) {
  if (!value) return 'No due date';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

function visibleTasks() {
  const filter = filterSelect.value;
  return tasks.filter(task => filter === 'all' || (filter === 'done' ? task.completed : !task.completed));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function render() {
  const shown = visibleTasks();
  taskList.innerHTML = shown.map(task => `
    <article class="task-row ${task.completed ? 'is-done' : ''}" data-task-id="${escapeHtml(task.id)}">
      <input class="task-check" type="checkbox" data-action="toggle" aria-label="Mark ${escapeHtml(task.title)} ${task.completed ? 'not completed' : 'completed'}" ${task.completed ? 'checked' : ''}>
      <div class="task-main">
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-meta"><span class="priority priority-${escapeHtml(task.priority)}">${escapeHtml(task.priority)}</span><span>·</span><span>${escapeHtml(formatDate(task.dueDate))}</span>${task.email ? `<span>·</span><span class="task-email">${escapeHtml(task.email)}</span>` : ''}</div>
      </div>
      <div class="task-actions"><button class="icon-button" type="button" data-action="edit" aria-label="Edit ${escapeHtml(task.title)}" title="Edit">✎</button><button class="icon-button delete" type="button" data-action="delete" aria-label="Delete ${escapeHtml(task.title)}" title="Delete">⌫</button></div>
    </article>`).join('');

  const completed = tasks.filter(task => task.completed).length;
  const count = tasks.length;
  document.querySelector('#task-count').textContent = `${count} ${count === 1 ? 'task' : 'tasks'}`;
  document.querySelector('#list-count').textContent = String(shown.length);
  document.querySelector('#progress-bar').style.width = `${count ? (completed / count) * 100 : 0}%`;
  document.querySelector('#completion-label').textContent = count ? `${completed} of ${count} complete` : 'A good plan starts small.';
  document.querySelector('#clear-completed').hidden = completed === 0;
  emptyState.classList.toggle('visible', shown.length === 0);
  taskList.hidden = shown.length === 0;
}

function clearValidation() {
  titleInput.setCustomValidity('');
  emailInput.setCustomValidity('');
  titleInput.removeAttribute('aria-invalid');
  emailInput.removeAttribute('aria-invalid');
  titleError.textContent = '';
  emailError.textContent = '';
}

function validateField(input, messageElement) {
  input.setCustomValidity('');
  if (input === titleInput && input.value.trim().length > 0 && input.value.trim().length < 3) {
    input.setCustomValidity('Please enter at least 3 non-space characters.');
  }
  const valid = input.checkValidity();
  input.setAttribute('aria-invalid', String(!valid));
  messageElement.textContent = valid ? '' : input.validationMessage;
  return valid;
}

function validateForm(showMessages = true) {
  const validTitle = showMessages ? validateField(titleInput, titleError) : titleInput.checkValidity();
  const validEmail = showMessages ? validateField(emailInput, emailError) : emailInput.checkValidity();
  return validTitle && validEmail && taskForm.checkValidity();
}

function resetForm() {
  taskForm.reset();
  taskIdInput.value = '';
  formHeading.textContent = 'Add a task';
  submitButton.innerHTML = '<span>＋</span> Add task';
  cancelEditButton.hidden = true;
  formStatus.textContent = '';
  clearValidation();
}

function startEdit(task) {
  taskIdInput.value = task.id;
  titleInput.value = task.title;
  emailInput.value = task.email;
  dueInput.value = task.dueDate;
  priorityInput.value = task.priority;
  formHeading.textContent = 'Edit task';
  submitButton.innerHTML = '<span>✓</span> Save changes';
  cancelEditButton.hidden = false;
  formStatus.textContent = '';
  clearValidation();
  titleInput.focus();
  document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function saveTask(event) {
  event.preventDefault();
  formStatus.textContent = '';
  if (!validateForm(true)) {
    const firstInvalid = taskForm.querySelector(':invalid');
    firstInvalid?.focus();
    return;
  }
  const formData = new FormData(taskForm);
  const title = String(formData.get('title')).trim();
  const task = {
    id: taskIdInput.value || crypto.randomUUID(),
    title,
    email: String(formData.get('email')).trim(),
    dueDate: String(formData.get('dueDate')),
    priority: String(formData.get('priority')),
    completed: tasks.find(item => item.id === taskIdInput.value)?.completed ?? false,
    createdAt: tasks.find(item => item.id === taskIdInput.value)?.createdAt ?? new Date().toISOString()
  };
  const editing = Boolean(taskIdInput.value);
  tasks = editing ? tasks.map(item => item.id === task.id ? task : item) : [task, ...tasks];
  if (persistTasks()) {
    resetForm();
    filterSelect.value = 'all';
    render();
    formStatus.textContent = editing ? 'Changes saved.' : 'Task added. Nice work.';
  }
}

function updateTask(taskId, updater) {
  tasks = tasks.map(task => task.id === taskId ? updater(task) : task);
  persistTasks();
  render();
}

// One delegated listener handles controls for every current and future task row.
taskList.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const row = button.closest('[data-task-id]');
  const task = tasks.find(item => item.id === row?.dataset.taskId);
  if (!task) return;
  switch (button.dataset.action) {
    case 'edit': startEdit(task); break;
    case 'delete':
      pendingDeleteId = task.id;
      dialogCopy.textContent = `“${task.title}” will be removed from your list.`;
      deleteDialog.showModal();
      break;
  }
});

taskList.addEventListener('change', event => {
  const checkbox = event.target.closest('[data-action="toggle"]');
  if (!checkbox) return;
  const row = checkbox.closest('[data-task-id]');
  updateTask(row.dataset.taskId, task => ({ ...task, completed: checkbox.checked }));
});

taskForm.addEventListener('submit', saveTask);
taskForm.addEventListener('input', event => {
  if (event.target !== titleInput && event.target !== emailInput) return;
  clearTimeout(validationTimer);
  validationTimer = setTimeout(() => {
    if (event.target === titleInput) validateField(titleInput, titleError);
    if (event.target === emailInput) validateField(emailInput, emailError);
  }, 240);
});

cancelEditButton.addEventListener('click', resetForm);
document.querySelector('#keep-task').addEventListener('click', () => {
  pendingDeleteId = null;
  deleteDialog.close();
});
document.querySelector('#confirm-delete').addEventListener('click', () => {
  if (pendingDeleteId) {
    tasks = tasks.filter(task => task.id !== pendingDeleteId);
    persistTasks();
    if (taskIdInput.value === pendingDeleteId) resetForm();
    pendingDeleteId = null;
    render();
  }
  deleteDialog.close();
});
deleteDialog.addEventListener('click', event => {
  if (event.target === deleteDialog) {
    pendingDeleteId = null;
    deleteDialog.close();
  }
});
filterSelect.addEventListener('change', render);
document.querySelector('#clear-completed').addEventListener('click', () => {
  tasks = tasks.filter(task => !task.completed);
  persistTasks();
  render();
});

// ResizeObserver adjusts the compact date badge without polling or layout loops.
const workspaceObserver = new ResizeObserver(entries => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    for (const entry of entries) {
      document.body.dataset.compact = entry.contentRect.width < 620 ? 'true' : 'false';
    }
  }, 100);
});
workspaceObserver.observe(document.querySelector('.workspace'));

document.querySelector('#today-label').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date());
render();
