const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file ko config folder ke andar hi create karenge
const dbPath = path.resolve(__dirname, 'queue.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Main Jobs Table
  db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      payload TEXT,
      status TEXT DEFAULT 'PENDING',
      priority INTEGER DEFAULT 0,
      retries_left INTEGER DEFAULT 3,
      run_at TEXT,
      timeout INTEGER DEFAULT 5000,
      created_at TEXT,
      updated_at TEXT
    )
  `);
  
  // Execution Logs Table (Bonus Credit Ke Liye)
  db.run(`
    CREATE TABLE IF NOT EXISTS job_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id TEXT,
      message TEXT,
      timestamp TEXT
    )
  `);
});

console.log("💾 SQLite Database initialized successfully inside src/config/");

module.exports = db;