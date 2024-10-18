"use strict";

const { MinPriorityQueue } = require("@datastructures-js/priority-queue")

/**
 * Prints all the entries, across all of the sources, in chronological order.
 * 
 * @param {Array<LogSource>} logSources 
 * @param {Printer} printer
 *  
 */
module.exports = (logSources, printer) => {
  return new Promise(async (resolve, reject) => {
    try {
      const q = new MinPriorityQueue((obj) => obj.logEntry.date);
      const BATCH_SIZE = 100

      // Initialize the priority queue with the first log entry from each log source
      // Using Promise.all() to ensure concurency
      await Promise.all(logSources.map(async (logSource) => {
        const next = await logSource.popAsync();
        if (next) {
          q.push({
            logEntry: next,
            logSource: logSource
          })
        }
      }))

      let res = []

      // Process the log entries in batches
      while (!q.isEmpty()) {
        const batch = [];
        for (let i = 0; i < BATCH_SIZE && !q.isEmpty(); i++) {
          const { logEntry, logSource } = q.pop()
          batch.push({ logEntry, logSource })
        }

        // Attach the batch to the result list
        res = res.concat(batch)

        // Fetch the next log entries for each source in the batch
        await Promise.all(batch.map(async ({ logSource }) => {
          const next = await logSource.popAsync()
          if (next) {
            q.push({
              logEntry: next,
              logSource: logSource
            });
          }
        }));
      }

     // Sort the result array since we had to do batching to improve the time taken 
     res.sort((a, b) => new Date(a.logEntry.date) - new Date(b.logEntry.date));

     // Print the sorted logs
     res.forEach(rec => {
       printer.print(rec.logEntry);
     });

      printer.done()

      resolve(console.log("Async sort complete."))
    } catch (error) {
      reject(console.error("An error occurred while merging log sources:", error))
    }
  })
};
