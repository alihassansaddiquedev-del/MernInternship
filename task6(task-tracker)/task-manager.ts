import { readFile, writeFile } from 'node:fs/promises';

export const Priority = { low: 'low', medium: 'medium', high: 'high' } as const;
export type Priority = typeof Priority[keyof typeof Priority];
export type TaskStatus = 'pending' | 'in-progress' | 'completed';
export type SortDirection = 'asc' | 'desc';

export interface User { id: number; name: string; email: string; }
export interface Task {
  id: number;
  title: string;
  description: string;
  priority: Priority;
  dueDate: string | null;
  status: TaskStatus;
  createdAt: string;
  assignee?: User | null;
}
export type NewTask = Pick<Task, 'title'> & Partial<Pick<Task, 'description' | 'priority' | 'dueDate' | 'status' | 'assignee'>>;
type TaskConfig = { priorities: readonly Priority[]; statuses: readonly TaskStatus[] };
const config = { priorities: ['low', 'medium', 'high'], statuses: ['pending', 'in-progress', 'completed'] } as const satisfies TaskConfig;
const PRIORITY_RANK: Record<Priority, number> = { low: 1, medium: 2, high: 3 };

export class TaskTrackerError extends Error {
  constructor(message: string, options?: ErrorOptions) { super(message, options); this.name = new.target.name; }
}
export class TaskValidationError extends TaskTrackerError {}
export class TaskNotFoundError extends TaskTrackerError {}
export class TaskStorageError extends TaskTrackerError {}

export function findByProp<T, K extends keyof T>(items: readonly T[], key: K, value: T[K]): T | undefined {
  return items.find((item) => item[key] === value);
}
export function sortByProp<T, V extends string | number>(items: readonly T[], getValue: (item: T) => V, direction: SortDirection = 'asc'): T[] {
  const sign = direction === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    const left = getValue(a); const right = getValue(b);
    return (typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right))) * sign;
  });
}
export function filterBy<T>(items: readonly T[], predicate: (item: T) => boolean): T[] { return items.filter(predicate); }

function validateTaskData({ title, priority = 'medium', dueDate, status = 'pending' }: NewTask): void {
  if (typeof title !== 'string' || !title.trim()) throw new TaskValidationError('Task title cannot be empty.');
  if (!(config.priorities as readonly string[]).includes(priority)) throw new TaskValidationError(`Priority must be low, medium, or high; received: ${priority}`);
  if (!(config.statuses as readonly string[]).includes(status)) throw new TaskValidationError(`Status must be pending, in-progress, or completed; received: ${status}`);
  if (dueDate !== undefined && dueDate !== null) {
    const match = typeof dueDate === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.exec(dueDate);
    if (!match) throw new TaskValidationError('Due date must use YYYY-MM-DD format.');
    const [, y, m, d] = match; const year = Number(y); const month = Number(m); const day = Number(d);
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (year === 0 || month < 1 || month > 12 || day < 1 || day > days[month - 1]) throw new TaskValidationError('Due date must be a valid calendar date.');
  }
}
function validateLoadedTasks(tasks: unknown): asserts tasks is Task[] {
  if (!Array.isArray(tasks)) throw new TypeError('The JSON root must be an array.');
  const ids = new Set<number>();
  for (const task of tasks as Task[]) {
    if (!task || !Number.isInteger(task.id) || task.id < 1 || ids.has(task.id)) throw new TypeError('Every task must have a unique positive integer id.');
    validateTaskData(task); ids.add(task.id);
  }
}
function createPrivateIdCounter(startAt = 1): () => number { let nextId = startAt; return () => nextId++; }

export async function loadTasks(filePath: string): Promise<Task[]> {
  try { const contents = await readFile(filePath, 'utf8'); const tasks: unknown = JSON.parse(contents); validateLoadedTasks(tasks); return structuredClone(tasks); }
  catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return [];
    throw new TaskStorageError(`Could not load tasks from "${filePath}".`, { cause: error });
  }
}
export async function saveTasks(filePath: string, tasks: readonly Task[]): Promise<void> {
  try { await writeFile(filePath, `${JSON.stringify(tasks, null, 2)}\n`, 'utf8'); }
  catch (error) { throw new TaskStorageError(`Could not save tasks to "${filePath}".`, { cause: error }); }
}

export interface TaskManager {
  list(): Task[];
  add(input: NewTask): Task;
  remove(id: number | string): Task[];
  search(query: string): Task[];
  sortByPriority(direction?: SortDirection): Task[];
  sortByDate(direction?: SortDirection): Task[];
  groupByStatus(): Partial<Record<TaskStatus, Task[]>>;
  stats(): { total: number; completed: number; pending: number; inProgress: number; completionPercent: number; hasOverdue: boolean; allCompleted: boolean };
  updateStatus(id: number | string, status: TaskStatus): Task;
}
export function createTaskManager(initialTasks: Task[] = []): TaskManager {
  validateLoadedTasks(initialTasks); let tasks = structuredClone(initialTasks);
  const nextId = createPrivateIdCounter(tasks.reduce((largest, task) => Math.max(largest, task.id), 0) + 1);
  const snapshot = (): Task[] => structuredClone(tasks);
  return Object.freeze({
    list: snapshot,
    add(input: NewTask): Task {
      validateTaskData(input);
      const task: Task = { id: nextId(), title: input.title.trim(), description: String(input.description ?? ''), priority: input.priority ?? 'medium', dueDate: input.dueDate ?? null, status: input.status ?? 'pending', createdAt: new Date().toISOString(), ...(input.assignee === undefined ? {} : { assignee: input.assignee }) };
      tasks = [...tasks, task]; return structuredClone(task);
    },
    remove(id: number | string): Task[] {
      const numericId = Number(id); if (!findByProp(tasks, 'id', numericId)) throw new TaskNotFoundError(`No task found with ID ${id}.`);
      tasks = filterBy(tasks, (task) => task.id !== numericId); return snapshot();
    },
    search(query: string): Task[] { const needle = String(query).trim().toLocaleLowerCase(); return filterBy(tasks, (task) => `${task.title} ${task.description}`.toLocaleLowerCase().includes(needle)).map((task) => structuredClone(task)); },
    sortByPriority(direction: SortDirection = 'desc'): Task[] { return sortByProp(tasks, (task) => PRIORITY_RANK[task.priority], direction); },
    sortByDate(direction: SortDirection = 'asc'): Task[] { return sortByProp(tasks, (task) => task.dueDate ?? '9999-12-31', direction); },
    groupByStatus(): Partial<Record<TaskStatus, Task[]>> {
      const groups: Partial<Record<TaskStatus, Task[]>> = {};
      for (const task of tasks) (groups[task.status] ??= []).push(task);
      return structuredClone(groups);
    },
    stats() {
      const total = tasks.length; const completed = tasks.filter((task) => task.status === 'completed').length;
      return { total, completed, pending: tasks.filter((task) => task.status === 'pending').length, inProgress: tasks.filter((task) => task.status === 'in-progress').length,
        completionPercent: total === 0 ? 0 : Math.round(completed / total * 100),
        hasOverdue: tasks.some((task) => task.dueDate !== null && task.dueDate < new Date().toISOString().slice(0, 10) && task.status !== 'completed'), allCompleted: tasks.every((task) => task.status === 'completed') };
    },
    updateStatus(id: number | string, status: TaskStatus): Task {
      const numericId = Number(id); const existing = findByProp(tasks, 'id', numericId);
      if (!existing) throw new TaskNotFoundError(`No task found with ID ${id}.`);
      tasks = tasks.map((task) => task.id === numericId ? { ...task, status } : task);
      return structuredClone(tasks.find((task) => task.id === numericId)!);
    }
  });
}
