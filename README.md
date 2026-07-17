# QueueCTL - Lightweight Custom Job Queue CLI Engine

A robust, production-grade custom asynchronous job queue execution engine built from scratch using Node.js and SQLite. This system handles asynchronous background jobs with strict concurrency locks, custom error retries, exponential backoff, and specialized Dead Letter Queue (DLQ) state routing.

---

## 🚀 Core Features & Advanced Enhancements

- **Persistent Relational Storage**: Backed by SQLite for transactional persistence of job states and deep historical debugging.
- **Atomic Concurrency Control**: Built-in protection against multi-instance race conditions using direct state-locking mechanisms across polling cycles.
- **Robust Error Management**: Automated retries with incremental backoff delays and automatic routing to the **Dead Letter Queue (DLQ)** upon failure threshold exhaustion (3 retry limit).
- **Rich CLI Controller**: Easy-to-use Command Line Interface built using `Commander` to enqueue jobs, monitor status pipelines, and track performance metrics.

### 🌟 Bonus & Advanced Credit Implementations
- **Priority-Based Execution**: Jobs are prioritized dynamically using a custom numerical sorting layer (`ORDER BY priority DESC, created_at ASC`). Higher priority values run first.
- **Delayed & Scheduled Backlogs**: Supports a custom execution timestamp offset via the `--delay` parameter, allowing jobs to remain parked until their scheduled time window hits.
- **Job Execution Timeouts**: Guards against zombie worker states. If a task exceeds its allocated execution timeout threshold, the system forcibly triggers an explicit rejection sequence.
- **Historical Job Execution Auditing (`job_logs` Table)**: Every lifecycle state transition (Enqueue, Processing Start, Retry, Timeout, Completion, or DLQ Dump) is permanently recorded in a dedicated auditing table for deep trace diagnostics.

---

## 📂 Project Architecture

```text
QueueCtl/
├── src/
│   ├── config/
│   │   └── db.js               # Database initialization, tables schema (jobs & job_logs)
│   ├── services/
│   │   └── queueService.js     # Core logic (Enqueue, Processing, Backoff Retry, DLQ, Logs)
│   ├── cli/
│   │   └── commands.js         # Commander CLI action and parameter management
│   └── workers/
│       └── backgroundWorker.js # Constant database polling worker loop (Simulated Pipelines)
├── .gitignore                  # Prevents environment and database binary tracking leaks
├── package.json                # Project dependencies and script aliases
└── README.md                   # System documentation