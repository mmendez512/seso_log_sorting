"use strict";

const LogSource = require("../lib/log-source");
const Printer = require("../lib/printer");
const { MinPriorityQueue } = require('@datastructures-js/priority-queue')

/**
 * Prints all the entries, across all of the sources, in chronological order.
 * 
 * @param {Array<LogSource>} logSources 
 * @param {Printer} printer 
 * 
 */
module.exports = (logSources, printer) => {

const q = new MinPriorityQueue((obj) => obj.logEntry.date)

// Initialize the priority queue with the first log entry from each log source
logSources.forEach(logSource => {
    const next = logSource.pop()
    if (next) {
        q.push({
            logEntry: next,
            logSource: logSource
        })
    }
})

while (!q.isEmpty()) {
    const { logEntry, logSource } = q.pop()
    printer.print(logEntry)

    // continue to process until all logSources are exhausted
    if (logSource) {
        const next = logSource.pop()
        if (next) {
            q.push({
                logEntry: next,
                logSource: logSource
            })
        }
    }
}

  printer.done()
  console.log("Sync sort complete.");
};
