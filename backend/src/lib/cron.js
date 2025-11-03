import { CronJob } from "cron";

const job = new CronJob("*/14 * * * *", async () => {
  try {
    const res = await fetch(process.env.API_URL);
    if (!res.ok) {
      console.error("GET request failed", res.status);
      return;
    }
    console.log("GET request sent successfully");
  } catch (err) {
    console.error("Error while sending request", err.message);
  }
});

export default job;

// CRON JOB EXPLANATION:
// Cron jobs are scheduled tasks that run periodically at fixed intervals
// we want to send 1 GET request for every 14 minutes

// How to define a "Schedule"?
// You define a schedule using a cron expression, which consists of 5 fields representing:

//! MINUTE, HOUR, DAY OF THE MONTH, MONTH, DAY OF THE WEEK

//? EXAMPLES && EXPLANATION:
//* 14 * * * * - Every 14 minutes
//* 0 0 * * 0 - At midnight on every Sunday
//* 30 3 15 * * - At 3:30 AM, on the 15th of every month
//* 0 0 1 1 * - At midnight, on January 1st
//* 0 * * * * - Every hour
