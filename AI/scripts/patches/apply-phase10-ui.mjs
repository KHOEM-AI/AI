import fs from "node:fs";

console.log("=== PHASE 10: Code Intelligence UI ===");

const dataPath = "src/data/aiStatus.ts";
let content = fs.readFileSync(dataPath, "utf8");

if (content.includes('"codeDataCenter"')) {
  console.log("SKIP: aiStatus.ts already has codeDataCenter card");
} else {
  const trimmed = content.replace(/\s+$/, "");
  if (!trimmed.endsWith("];")) {
    console.error("ABORT: file does not end with '];' as expected — no changes written");
    process.exit(1);
  }
  const cardBlock = [
    "",
    '  { id: "codeDataCenter", nameKm: "មជ្ឈមណ្ឌលទិន្នន័យកូដ", nameEn: "CODE DATA CENTER",',
    '    descKm: "ប្រព័ន្ធវិភាគកូដកំពុងតាមដានឯកសារ, function/class, ទំនាក់ទំនងរវាងឯកសារ, និងសុខភាពកូដក្នុងគម្រោង។",',
    '    descEn: "The Code Data Center indexes files, symbols, dependencies, and code health across the project.",',
    "    commands: [\"/api/code/index\", \"/api/code/scan\", \"/api/code/symbols\", \"/api/code/dependencies\", \"/api/code/health\", \"/api/code/findings\"] },",
  ].join("\n");
  content = trimmed.slice(0, -2) + cardBlock + "\n];\n";
  fs.writeFileSync(dataPath, content);
  console.log("OK: src/data/aiStatus.ts — added codeDataCenter card to AI_STATUS_CARDS");
}

console.log("\nNext: npx tsc --noEmit && npm run build && npx vitest run");
