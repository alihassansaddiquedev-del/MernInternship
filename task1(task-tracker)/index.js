import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  createTaskManager,
  loadTasks,
  saveTasks,
  TaskTrackerError
} from './task-manager.js';

const here = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(here, 'tasks.json');
const rl = createInterface({ input, output });

function printTasks(tasks) {
  if (tasks.length === 0) {
    console.log('\nNo tasks found.');
    return;
  }
  console.table(tasks.map(({ id, title, priority, dueDate, status }) => ({
    ID: id, Title: title, Priority: priority, Due: dueDate ?? 'Not set', Status: status
  })));
}

async function askRequired(prompt) {
  const answer = (await rl.question(prompt)).trim();
  if (!answer) throw new Error('Input cannot be empty.');
  return answer;
}

async function main() {
  let manager;
  try {
    manager = createTaskManager(await loadTasks(dataPath));
  } catch (error) {
    console.error(`Startup error: ${error.message}`);
    if (error.cause) console.error(`Reason: ${error.cause.message}`);
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
          const priority = ((await rl.question('Priority (low/medium/high, default medium): ')).trim() || 'medium').toLowerCase();
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
          const direction = ((await rl.question('Direction (asc/desc, default desc): ')).trim() || 'desc').toLowerCase();
          if (!['asc', 'desc'].includes(direction)) throw new Error('Direction must be asc or desc.');
          printTasks(manager.sortByPriority(direction));
          break;
        }
        case '6': {
          const direction = ((await rl.question('Direction (asc/desc, default asc): ')).trim() || 'asc').toLowerCase();
          if (!['asc', 'desc'].includes(direction)) throw new Error('Direction must be asc or desc.');
          printTasks(manager.sortByDate(direction));
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
          const status = (await askRequired('New status (pending/in-progress/completed): ')).toLowerCase();
          console.log('Updated:', manager.updateStatus(id, status));
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
      // Custom errors retain their original cause for diagnostics.
      if (error instanceof TaskTrackerError) {
        console.error(`Task error: ${error.message}`);
        if (error.cause) console.error(`Underlying cause: ${error.cause.message}`);
      } else {
        console.error(`Input/action error: ${error.message}`);
      }
    }
  }
  rl.close();
}

main().catch((error) => {
  console.error('Unexpected fatal error:', error);
  rl.close();
  process.exitCode = 1;
});
