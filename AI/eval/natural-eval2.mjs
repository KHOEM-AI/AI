import { khmerReply } from "../src/ai/khmer.mjs";
const cases = [
  ["សួស្តីខ្ញុំឈឺធ្មេញ", ["ធ្មេញ", "អំបិល"]],
  ["តើមានថ្នាំឈឺធ្មេញអ្វីដែលបំបាត់ឈឺធ្មេញលឿន", ["ធ្មេញ", "អំបិល"]],
  ["សួស្តី", ["មានអ្វី"]],
  ["សួស្តីបង", ["មានអ្វី"]],
  ["សួស្តីប្អូន ខ្ញុំឈឺពោះ", ["ពេទ្យ", "ផឹកទឹក"]],
  ["តើអ្នកស្គាល់ទន្លេទេ", ["ទន្លេ"]],
];
let ok = 0;
const bad = [];
for (const [q, any] of cases) {
  const a = String(khmerReply(q));
  if (any.some((w) => a.includes(w))) ok++;
  else bad.push(`⚠️ ${q} => ${a.slice(0, 45)}`);
}
console.log(`ត្រូវ ${ok} / ${cases.length}`);
bad.forEach((b) => console.log(b));
