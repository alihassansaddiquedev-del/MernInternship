import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createTaskManager,
  loadTasks,
  saveTasks,
  TaskNotFoundError,
  TaskStorageError,
  TaskValidationError
} from '../task-manager.js';

const seed = [
  { id: 1, title: 'Write report', description: 'Monthly report', priority: 'high', dueDate: '2026-10-22', status: 'pending', createdAt: '2026-10-20T10:00:00.000Z' },
  { id: 2, title: 'Buy milk', description: 'Grocery shop', priority: 'low', dueDate: '2026-10-20', status: 'completed', createdAt: '2026-10-20T10:10:00.000Z' },
  { id: 3, title: 'Read docs', description: 'Read API docs', priority: 'medium', dueDate: null, status: 'in-progress', createdAt: '2026-10-20T10:20:00.000Z' }
];

test('adds tasks with a private, increasing ID counter', () => {
  const manager = createTaskManager(seed);
  const task = manager.add({ title: 'New task' });
  assert.equal(task.id, 4);
  assert.equal(manager.add({ title: 'Another task' }).id, 5);

});

test('rejects invalid task input', () => {
  const manager = createTaskManager();
  assert.throws(() => manager.add({ title: ' ' }), TaskValidationError);
  assert.throws(() => manager.add({ title: 'Task', priority: 'urgent' }), TaskValidationError);
});

test('rejects impossible due dates and accepts valid leap days', () => {
  const manager = createTaskManager();
  for (const dueDate of ['2026-35-10', '2026-02-29', '2026-04-31', '2026-00-10']) {
    assert.throws(() => manager.add({ title: 'Task', dueDate }), TaskValidationError);
  }
  assert.equal(manager.add({ title: 'Task', dueDate: '2024-02-29' }).dueDate, '2024-02-29');
});

test('removes tasks and throws a custom error for unknown IDs', () => {
  const manager = createTaskManager(seed);
  manager.remove(2);
  assert.equal(manager.list().length, 2);
  assert.throws(() => manager.remove(99), TaskNotFoundError);
});

test('search is case-insensitive across title and description', () => {
  const manager = createTaskManager(seed);
  assert.equal(manager.search('API').length, 1);
  assert.equal(manager.search('BUY')[0].id, 2);
});

test('sorts by priority/date without mutating original task order', () => {
  const manager = createTaskManager(seed);
  assert.deepEqual(manager.sortByPriority('desc').map((task) => task.id), [1, 3, 2]);
  assert.deepEqual(manager.sortByDate('asc').map((task) => task.id), [2, 1, 3]);
  assert.deepEqual(manager.list().map((task) => task.id), [1, 2, 3]);
});



test('groups by status and calculates completion statistics', () => {
  const manager = createTaskManager(seed);
  const groups = manager.groupByStatus();
  assert.equal(groups.pending.length, 1);
  assert.equal(groups.completed.length, 1);
  assert.equal(groups['in-progress'].length, 1);
  assert.deepEqual(manager.stats(), {
    total: 3, completed: 1, pending: 1, inProgress: 1,
    completionPercent: 33,
    hasOverdue: false,
    allCompleted: false
  });
});

test('updates status immutably', () => {
  const manager = createTaskManager(seed);
  manager.updateStatus(1, 'completed');
  assert.equal(manager.list()[0].status, 'completed');
  assert.equal(seed[0].status, 'pending');
});

test('clones returned state so callers cannot mutate internal state', () => {
  const manager = createTaskManager(seed);
  const copy = manager.list();
  copy[0].title = 'Changed outside';
  assert.equal(manager.list()[0].title, 'Write report');
});

test('saves and loads JSON tasks', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'task-tracker-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const path = join(dir, 'tasks.json');
  await saveTasks(path, seed);
  assert.deepEqual(await loadTasks(path), seed);
  assert.equal(JSON.parse(await readFile(path, 'utf8')).length, 3);
});

test('missing JSON file loads as an empty task list', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'task-tracker-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  assert.deepEqual(await loadTasks(join(dir, 'missing.json')), []);
});

test('malformed JSON throws a storage error with a cause', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'task-tracker-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const path = join(dir, 'broken.json');
  await writeFile(path, '{not valid json');
  await assert.rejects(loadTasks(path), (error) => {
    assert.ok(error instanceof TaskStorageError);
    assert.ok(error.cause instanceof SyntaxError);
    return true;
  });
});
