const fs = require("fs");
const path = "audit_chunk_10k.cjs";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
fs.copyFileSync(path, `${path}.bak-${stamp}`);

let text = fs.readFileSync(path, "utf8");

const oldBlock = /const mixed = \[\];[\s\S]*?^}/m;

const newBlock = `function isPureKhmerCheck(q) {
  const hasKhmer = /[\\u1780-\\u17FF]/.test(q);
  const hasOther = /[A-Za-z\\u0E00-\\u0E7F\\u4E00-\\u9FFF\\u3040-\\u30FF\\uAC00-\\uD7AF]/.test(q);
  return hasKhmer && !hasOther;
}

const mixed = [];
for (let i = 0; i < chunk.length; i++) {
  const q = chunk[i].q;
  if (!isPureKhmerCheck(q)) {
    mixed.push({ line: start + i + 1, q });
  }
}`;

if (!oldBlock.test(text)) {
  console.error("Pattern not found — no changes made.");
  process.exit(1);
}

text = text.replace(oldBlock, newBlock);
fs.writeFileSync(path, text, "utf8");
console.log("Patched successfully.");
