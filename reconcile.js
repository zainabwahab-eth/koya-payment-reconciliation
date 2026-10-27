// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");

const lines = fs.readFileSync("payments.jsonl", "utf8").split("\n").filter((l) => l.length > 0);

const latestByTxn = new Map();

for (const line of lines) {
  let event;
  try {
    event = JSON.parse(line);
  } catch (e) {
    continue;
  }

  if (!event || !event.txn_id) {
    continue;
  }

  const existing = latestByTxn.get(event.txn_id);
  if (!existing || event.ts > existing.ts) {
    latestByTxn.set(event.txn_id, event);
  }
}

let total = 0;
let count = 0;

for (const event of latestByTxn.values()) {
  if (event.status !== "success") {
    continue;
  }

  const amount = Number(String(event.amount).replace(/,/g, ""));
  total += amount;
  count += 1;
}


const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
