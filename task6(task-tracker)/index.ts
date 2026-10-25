import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  type Task,
  type TaskStatus,
  type SortDirection,
  createTaskManager,
  loadTasks,
  saveTasks,
  TaskTrackerError
} from './task-manager.js';

const here = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(here, 'tasks.json');
const rl = createInterface({ input, output });

function printTasks(tasks: readonly Task[]): void {
  if (tasks.length === 0) {
    console.log('\nNo tasks found.');
    return;
  }
  console.table(tasks.map(({ id, title, priority, dueDate, status }) => ({
    ID: id, Title: title, Priority: priority, Due: dueDate ?? 'Not set', Status: status
  })));
}

async function askRequired(prompt: string): Promise<string> {
  const answer = (await rl.question(prompt)).trim();
  if (!answer) throw new Error('Input cannot be empty.');
  return answer;
}

async function main(): Promise<void> {
  let manager: ReturnType<typeof createTaskManager>;
  try {
    manager = createTaskManager(await loadTasks(dataPath));
  } catch (error) {
    const startupError = error instanceof Error ? error : new Error(String(error));
    console.error(`Startup error: ${startupError.message}`);
    if (startupError.cause instanceof Error) console.error(`Reason: ${startupError.cause.message}`);
    process.exitCode = 1;
    return;
  }

  console.log('\n=== Daily Task Tracker ===');
  let running = true;
  while (running) {
    console.log(`\n1. List tasks\n2. Add task\n3. Remove task\n4. Search tasks\n5. Sort by priority\n6. Sort by due date\n7. Group by status\n8. Completion statistics\n9. Update task status\n0. Save and exit`);
    try {
      const choice = (await rl.question('\nChoose an option: ')).trim();
      switch (choice) {
        case '1':
          printTasks(manager.list());
          break;
        case '2': {
          const title = await askRequired('Title: ');
          const description = (await rl.question('Description (optional): ')).trim();
          const priorityText = ((await rl.question('Priority (low/medium/high, default medium): ')).trim() || 'medium').toLowerCase();
          if (!['low', 'medium', 'high'].includes(priorityText)) throw new Error('Priority must be low, medium, or high.');
          const priority = priorityText as Task['priority'];
          const dueDate = (await rl.question('Due date YYYY-MM-DD (optional): ')).trim() || undefined;
          console.log('Added task:', manager.add({ title, description, priority, dueDate }));
          break;
        }
        case '3': {
          const id = await askRequired('Task ID to remove: ');
          manager.remove(id);
          console.log(`Removed task ${id}.`);
          break;
        }
        case '4':
          printTasks(manager.search(await askRequired('Search title or description: ')));
          break;
        case '5': {
          const directionText = ((await rl.question('Direction (asc/desc, default desc): ')).trim() || 'desc').toLowerCase();
          if (!['asc', 'desc'].includes(directionText)) throw new Error('Direction must be asc or desc.');
          printTasks(manager.sortByPriority(directionText as SortDirection));
          break;
        }
        case '6': {
          const directionText = ((await rl.question('Direction (asc/desc, default asc): ')).trim() || 'asc').toLowerCase();
          if (!['asc', 'desc'].includes(directionText)) throw new Error('Direction must be asc or desc.');
          printTasks(manager.sortByDate(directionText as SortDirection));
          break;
        }
        case '7': {
          const groups = manager.groupByStatus();
          for (const [status, tasks] of Object.entries(groups)) {
            console.log(`\n${status.toUpperCase()}`);
            printTasks(tasks);
          }
          break;
        }
        case '8':
          console.table(manager.stats());
          break;
        case '9': {
          const id = await askRequired('Task ID: ');
          const statusText = (await askRequired('New status (pending/in-progress/completed): ')).toLowerCase();
          if (!['pending', 'in-progress', 'completed'].includes(statusText)) throw new Error('Invalid task status.');
          console.log('Updated:', manager.updateStatus(id, statusText as TaskStatus));
          break;
        }
        case '0':
          await saveTasks(dataPath, manager.list());
          console.log('Tasks saved. Goodbye!');
          running = false;
          break;
        default:
          console.log('Please choose a number from 0 to 9.');
      }
    } catch (error) {
      const actionError = error instanceof Error ? error : new Error(String(error));
      // Custom errors retain their original cause for diagnostics.
      if (actionError instanceof TaskTrackerError) {
        console.error(`Task error: ${actionError.message}`);
        if (actionError.cause instanceof Error) console.error(`Underlying cause: ${actionError.cause.message}`);
      } else {
        console.error(`Input/action error: ${actionError.message}`);
      }
    }
  }
  rl.close();
}

main().catch((error: unknown) => {
  console.error('Unexpected fatal error:', error);
  rl.close();
  process.exitCode = 1;
});
