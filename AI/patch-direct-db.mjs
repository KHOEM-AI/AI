import fs from "fs";
let k = fs.readFileSync("src/ai/khoem.mjs", "utf8");

if (!k.includes('searchTechDB')) {
  k = 'import { searchTechDB } from "./knowledge.mjs";\n' + k;
  
  const injection = `
  const techResult = searchTechDB(q);
  if (techResult) return techResult;
`;
  k = k.replace(
    "const q = conversation[conversation.length - 1].content.toLowerCase();",
    "const q = conversation[conversation.length - 1].content.toLowerCase();\n" + injection
  );
}

fs.writeFileSync("src/ai/khoem.mjs", k);
console.log("ភ្ជាប់ Database បច្ចេកវិទ្យាដោយជោគជ័យ!");
