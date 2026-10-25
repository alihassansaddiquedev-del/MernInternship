import { readFile, writeFile } from 'node:fs/promises';

const VALID_PRIORITIES = new Set(['low', 'medium', 'high']);
const VALID_STATUSES = new Set(['pending', 'in-progress', 'completed']);
const PRIORITY_RANK = { low: 1, medium: 2, high: 3 };

export class TaskTrackerError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class TaskValidationError extends TaskTrackerError {}
export class TaskNotFoundError extends TaskTrackerError {}
export class TaskStorageError extends TaskTrackerError {}

function validateTaskData({ title, priority = 'medium', dueDate, status = 'pending' }) {
  if (typeof title !== 'string' || !title.trim()) {
    throw new TaskValidationError('Task title cannot be empty.');
  }
  if (!VALID_PRIORITIES.has(priority)) {
    throw new TaskValidationError(`Priority must be low, medium, or high; received: ${priority}`);
  }
  if (!VALID_STATUSES.has(status)) {
    throw new TaskValidationError(`Status must be pending, in-progress, or completed; received: ${status}`);
  }
  if (dueDate !== undefined && dueDate !== null) {
    const match = typeof dueDate === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.exec(dueDate);
    if (!match) throw new TaskValidationError('Due date must use YYYY-MM-DD format.');

    const [, yearText, monthText, dayText] = match;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    if (year === 0 || month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1]) {
      throw new TaskValidationError('Due date must be a valid calendar date.');
    }
  }
}

function validateLoadedTasks(tasks) {
  if (!Array.isArray(tasks)) throw new TypeError('The JSON root must be an array.');
  const ids = new Set();
  for (const task of tasks) {
    if (!task || !Number.isInteger(task.id) || task.id < 1 || ids.has(task.id)) {
      throw new TypeError('Every task must have a unique positive integer id.');
    }
    validateTaskData(task);
    ids.add(task.id);
  }
}

// The counter is private: callers can obtain an ID, but cannot access its variable.
function createPrivateIdCounter(startAt = 1) {
  let nextId = startAt;
  return () => nextId++;
}

export async function loadTasks(filePath) {
  try {
    const contents = await readFile(filePath, 'utf8');
    const tasks = JSON.parse(contents);
    validateLoadedTasks(tasks);
    return structuredClone(tasks);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw new TaskStorageError(`Could not load tasks from "${filePath}".`, { cause: error });
  }
}

export async function saveTasks(filePath, tasks) {
  try {
    await writeFile(filePath, `${JSON.stringify(tasks, null, 2)}\n`, 'utf8');
  } catch (error) {
    throw new TaskStorageError(`Could not save tasks to "${filePath}".`, { cause: error });
  }
}

export function createTaskManager(initialTasks = []) {
  validateLoadedTasks(initialTasks);
  let tasks = structuredClone(initialTasks);
  const largestId = tasks.reduce((largest, task) => Math.max(largest, task.id), 0);
  const nextId = createPrivateIdCounter(largestId + 1);

  function snapshot() {
    return structuredClone(tasks);
  }

  return Object.freeze({
    list() {
      return snapshot();
    },

    add({ title, description = '', priority = 'medium', dueDate, status = 'pending' }) {
      validateTaskData({ title, priority, dueDate, status });
      const task = {
        id: nextId(),
        title: title.trim(),
        description: String(description),
        priority,
        dueDate: dueDate ?? null,
        status,
        createdAt: new Date().toISOString()
      };
      tasks = [...tasks, task];
      return structuredClone(task);
    },

    remove(id) {
      const exists = tasks.some((task) => task.id === Number(id));
      if (!exists) throw new TaskNotFoundError(`No task found with ID ${id}.`);
      tasks = tasks.filter((task) => task.id !== Number(id));
      return snapshot();
    },

    search(query) {
      const needle = String(query).trim().toLocaleLowerCase();
      return tasks
        .filter((task) => `${task.title} ${task.description}`.toLocaleLowerCase().includes(needle))
        .map((task) => structuredClone(task));
    },

    sortByPriority(direction = 'desc') {
      const multiplier = direction === 'asc' ? 1 : -1;
      return tasks.toSorted((a, b) => (PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]) * multiplier);
    },

    sortByDate(direction = 'asc') {
      const multiplier = direction === 'desc' ? -1 : 1;
      return tasks.toSorted((a, b) => {
        const dateA = a.dueDate ?? '9999-12-31';
        const dateB = b.dueDate ?? '9999-12-31';
        return dateA.localeCompare(dateB) * multiplier;
      });
    },

    groupByStatus() {
      const groups = Object.groupBy(tasks, (task) => task.status);
      return structuredClone(groups);
    },

    stats() {
      const total = tasks.length;
      const completed = tasks.reduce((count, task) => count + Number(task.status === 'completed'), 0);
      const pending = tasks.reduce((count, task) => count + Number(task.status === 'pending'), 0);
      const inProgress = tasks.reduce((count, task) => count + Number(task.status === 'in-progress'), 0);
      return {
        total,
        completed,
        pending,
        inProgress,
        completionPercent: total === 0 ? 0 : Math.round((completed / total) * 100),
        hasOverdue: tasks.some((task) => task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10) && task.status !== 'completed'),
        allCompleted: tasks.every((task) => task.status === 'completed')
      };
    },

    updateStatus(id, status) {
      if (!VALID_STATUSES.has(status)) {
        throw new TaskValidationError(`Status must be pending, in-progress, or completed; received: ${status}`);
      }
      if (!tasks.some((task) => task.id === Number(id))) {
        throw new TaskNotFoundError(`No task found with ID ${id}.`);
      }
      tasks = tasks.map((task) => task.id === Number(id) ? { ...task, status } : task);
      return structuredClone(tasks.find((task) => task.id === Number(id)));
    }
  });
}
