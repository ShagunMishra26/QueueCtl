const { processNextJob } = require('../services/queueService');

// Yeh humara Mock Task Executor function hai jo alag-alag jobs ko process karega
const dummyWorkerFunction = async (type, payload) => {
  console.log(`\n[🚀 Worker Log] Processing a job of type: "${type}"`);
  
  // Bonus: Output logging visualization
  console.log(`[📦 Payload Data]:`, JSON.stringify(payload));

  // Demonstration setup: Agar payload me {"fail": true} bhejenge toh simulation breakdown dikhayega
  if (payload.fail === true) {
    throw new Error("Simulated backend pipeline crash!");
  }

  // Demonstration setup: Agar payload me {"sleep": true} bhejenge toh system thoda wait karega 
  // (Isse hum timeout functionality check kar sakte hain)
  if (payload.sleep === true) {
    console.log("[⏳ Worker Wait] Sleeping for 6 seconds to trigger timeout check...");
    await new Promise(resolve => setTimeout(resolve, 6000));
  } else {
    // Normal work simulation: 1.5 second ka delay tasks finish karne ke liye
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  console.log(`[✅ Success] Job completed processing successfully.`);
};

console.log("=================================================");
console.log("👷 Background Job Worker Loop Started...");
console.log("🔍 Polling database for PENDING tasks every 1s...");
console.log("=================================================");

// Polling interval tracker tracker (Har 1 second me loop run hoga safe-concurrency select ke saath)
setInterval(() => {
  processNextJob(dummyWorkerFunction);
}, 1000);