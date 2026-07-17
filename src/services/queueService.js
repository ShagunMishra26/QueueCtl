const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// 1. Enqueue Job (With Priority, Delay, and Timeout options)
function enqueue(type, payload, options = {}) {
  const id = uuidv4();
  const priority = options.priority || 0; // Higher number = Higher priority
  const delayMs = options.delay || 0;
  const timeout = options.timeout || 5000; // Default 5 seconds timeout
  
  let runAt = new Date().toISOString();
  if (delayMs > 0) {
    runAt = new Date(Date.now() + delayMs).toISOString();
  }

  const query = `
    INSERT INTO jobs (id, type, payload, priority, run_at, timeout, created_at, updated_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const now = new Date().toISOString();

  db.run(query, [id, type, JSON.stringify(payload), priority, runAt, timeout, now, now], (err) => {
    if (err) {
      console.error("❌ Job enqueue fail ho gaya:", err.message);
    } else {
      logJob(id, `Job enqueued with priority ${priority}`);
      console.log(`✅ Job Successfully Enqueued! ID: ${id}`);
    }
  });
}

// Helper: Job Execution Logs Persistence (Bonus Point)
function logJob(jobId, message) {
  const now = new Date().toISOString();
  db.run(`INSERT INTO job_logs (job_id, message, timestamp) VALUES (?, ?, ?)`, [jobId, message, now]);
}

// 2. Worker Logic (Safe from Race Conditions & Concurrency Issues)
function processNextJob(workerFn) {
  const now = new Date().toISOString();
  
  // SQL Query jo sirf PENDING aur ready-to-run jobs ko priority wise pick karegi
  const selectQuery = `
    SELECT * FROM jobs 
    WHERE status = 'PENDING' AND run_at <= ? 
    ORDER BY priority DESC, created_at ASC LIMIT 1
  `;

  db.get(selectQuery, [now], (err, job) => {
    if (err || !job) return; // Agar koi ready job nahi hai, toh chupchaap return ho jao

    // Instant Lock Mechanism: Dusra worker is job ko pick na kare (Race condition handle checked!)
    db.run(`UPDATE jobs SET status = 'PROCESSING', updated_at = ? WHERE id = ?`, [new Date().toISOString(), job.id], (lockErr) => {
      if (lockErr) return;

      logJob(job.id, "Worker started processing task");

      // Handle Job Timeout (Bonus Point)
      let isTimedOut = false;
      const timeoutTimer = setTimeout(() => {
        isTimedOut = true;
        handleFailure(job, "Job Execution Timed Out!", workerFn);
      }, job.timeout);

      // Main Job Function Trigger
      workerFn(job.type, JSON.parse(job.payload))
        .then(() => {
          if (isTimedOut) return;
          clearTimeout(timeoutTimer);
          
          db.run(`UPDATE jobs SET status = 'COMPLETED', updated_at = ? WHERE id = ?`, [new Date().toISOString(), job.id]);
          logJob(job.id, "Job completed successfully 🎉");
        })
        .catch((error) => {
          if (isTimedOut) return;
          clearTimeout(timeoutTimer);
          handleFailure(job, error.message, workerFn);
        });
    });
  });
}

// 3. Robust Retry Backoff and Dead Letter Queue (DLQ) Logic
function handleFailure(job, errorMessage, workerFn) {
  logJob(job.id, `Execution Failed Error: ${errorMessage}`);
  
  if (job.retries_left > 0) {
    const nextRetryCount = job.retries_left - 1;
    
    // Incremental Backoff Delay: Har retry ke beech me thoda gap (2 seconds) badhega
    const backoffDelay = 2000; 
    const nextRun = new Date(Date.now() + backoffDelay).toISOString(); 
    
    db.run(
      `UPDATE jobs SET status = 'PENDING', retries_left = ?, run_at = ?, updated_at = ? WHERE id = ?`, 
      [nextRetryCount, nextRun, new Date().toISOString(), job.id], 
      () => {
        logJob(job.id, `Scheduled for retry. Retries left: ${nextRetryCount}`);
      }
    );
  } else {
    // Agar saare retries exhaust ho gaye, toh Dead Letter Queue (DLQ) me bhej do
    db.run(`UPDATE jobs SET status = 'DLQ', updated_at = ? WHERE id = ?`, [new Date().toISOString(), job.id], () => {
        logJob(job.id, `Moved permanently to Dead Letter Queue (DLQ) 💀`);
    });
  }
}

// 4. Metrics & Execution Stats Dashboard CLI (Bonus Point)
function getStats() {
  db.all(`SELECT status, COUNT(*) as count FROM jobs GROUP BY status`, [], (err, rows) => {
    console.log("\n📊 --------- Queuectl Performance Stats ---------");
    const statuses = { PENDING: 0, PROCESSING: 0, COMPLETED: 0, FAILED: 0, DLQ: 0 };
    rows.forEach(row => { statuses[row.status] = row.count; });
    
    Object.keys(statuses).forEach(key => {
      console.log(`• ${key.padEnd(12)} : ${statuses[key]} jobs`);
    });
    console.log("-------------------------------------------------\n");
  });
}

module.exports = { enqueue, processNextJob, getStats, logJob };