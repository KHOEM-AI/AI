import { khmerReply } from "../src/ai/khmer.mjs";
const q = process.argv.slice(2).join(" ");
const r = khmerReply(q);
console.log("ចម្លើយ:", r == null ? "⛔ (មិនដឹង)" : r);
