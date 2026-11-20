import cron from 'node-cron';
import { checkAndAdvanceScheduleQueue } from '../services/schedulerService.js';

let cronTask = null;

export function startScheduleWorker() {
  console.log('Starting PinPoster background scheduler worker...');

  // Run initial check on startup
  checkAndAdvanceScheduleQueue().catch((err) => {
    console.error('Initial scheduler check failed:', err.message);
  });

  // Run every 60 seconds (* * * * *)
  cronTask = cron.schedule('* * * * *', async () => {
    try {
      const result = await checkAndAdvanceScheduleQueue();
      if (result.promotedCount > 0 || result.overdueCount > 0) {
        console.log(
          `Scheduler Tick: ${result.promotedCount} pins ready to publish, ${result.overdueCount} pins marked overdue.`
        );
      }
    } catch (err) {
      console.error('Scheduler worker error:', err.message);
    }
  });

  console.log('PinPoster schedule worker active (checking every minute).');
}

export function stopScheduleWorker() {
  if (cronTask) {
    cronTask.stop();
    console.log('PinPoster schedule worker stopped.');
  }
}
