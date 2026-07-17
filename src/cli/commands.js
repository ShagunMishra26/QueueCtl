const { program } = require('commander');
const { enqueue, getStats } = require('../services/queueService');

program
  .version('1.0.0')
  .description('QueueCTL - Smart Job Queue CLI Engine');

// 1. ADD JOB COMMAND
program
  .command('add <type> <payload>')
  .description('Enqueue a new background job')
  .option('-p, --priority <number>', 'Job priority (higher number runs first)', parseInt, 0)
  .option('-d, --delay <ms>', 'Delay job execution in milliseconds', parseInt, 0)
  .option('-t, --timeout <ms>', 'Execution timeout threshold in milliseconds', parseInt, 5000)
  .action((type, payload, options) => {
    try {
      // String payload ko JSON object me convert kar rahe hain
      const parsedPayload = JSON.parse(payload);
      enqueue(type, parsedPayload, options);
    } catch (e) {
      console.error("❌ Error: Payload ek valid JSON hona chahiye! Example: '{\"email\":\"test@me.com\"}'");
    }
  });

// 2. STATS/METRICS COMMAND
program
  .command('stats')
  .description('Display queue real-time execution statistics')
  .action(() => {
    getStats();
  });

program.parse(process.argv);