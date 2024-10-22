"use strict";

const { MinPriorityQueue } = require("@datastructures-js/priority-queue")
const EventEmitter = require("node:events")
class LogEmitter extends EventEmitter {}

/**
 * Prints all the entries, across all of the sources, in chronological order.
 * 
 * @param {Array<LogSource>} logSources 
 * @param {Printer} printer
 *  
 */
//class LogEmitter extends EventEmitter {}

module.exports = (logSources, printer) => {
  return new Promise(async (resolve, reject) => {
    try {
      const q = new MinPriorityQueue((obj) => obj.logEntry.date)
      const resultQueue = new MinPriorityQueue((obj) => obj.logEntry.date)
      const logEmitter = new LogEmitter()
      const BATCH_SIZE = 100

      // Initialize the priority queue with the first log entry from each log source
      await Promise.all(logSources.map(async (logSource) => {
        const next = await logSource.popAsync()
        if (next) {
          q.push({
            logEntry: next,
            logSource: logSource
          })
        }
      }));

      // Event listener for processing batches
      logEmitter.on("processBatch", async () => {
        const batch = []
        for (let i = 0; i < BATCH_SIZE && !q.isEmpty(); i++) { 
          batch.push(q.pop())
        }

        // Add the logs in the current batch to the result queue
        batch.forEach(({ logEntry }) => {
          resultQueue.push({ logEntry })
        });

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

        // If the queue is not empty, emit the event to process the next batch
        if (!q.isEmpty()) {
          logEmitter.emit("processBatch");
        } else {
          logEmitter.emit("done")
        }
      });

      logEmitter.on("done", () => {
            // Print the logs from the result queue in order
            while (!resultQueue.isEmpty()) {
              const { logEntry } = resultQueue.pop()
              printer.print(logEntry)
            }
  
            printer.done();
            resolve(console.log("Async sort complete."))
      })

      // Start processing the first batch
      logEmitter.emit("processBatch")

    } catch (error) {
      reject(console.error("An error occurred while merging log sources:", error))
    }
  });
};