import fs from "node:fs";

// ១) បន្ថែមទិន្នន័យ ម្ហូប និងប្រវត្តិសាស្ត្រ ចូលទៅកាន់ knowledge.mjs
let kDb = fs.readFileSync("src/ai/knowledge.mjs", "utf8");
if (!kDb.includes("HISTORY_FOOD_DB")) {
  const moreDb = `
export const HISTORY_FOOD_DB = [
  { keywords: ["អាម៉ុក", "amok", "ម្ហូប", "food", "recipe"], info: "🍲 អាម៉ុកត្រី (Fish Amok): ជាម្ហូបតំណាងជាតិកម្ពុជា។ ផ្សំពី ត្រីរ៉ស់ ឬត្រីឆ្តោ, គ្រឿងបុក (ស្លឹកគ្រៃ រមៀត ខ្ទឹម...), ខ្ទិះដូង, និងស្លឹកញ។ វាមានរសជាតិឈ្ងុយឆ្ងាញ់ និងចំហុយក្នុងកន្ទោងស្លឹកចេក។" },
  { keywords: ["សម្លម្ជូរ", "ម្ជូរគ្រឿង", "machu"], info: "🍲 សម្លម្ជូរគ្រឿង (Samlor Machu Kroeung): ម្ហូបពេញនិយម ផ្សំពីសាច់គោ ឬត្រី, គ្រឿងបុក, ត្រកួន, ម្ជូរ (អំពិល ឬក្រសាំង), និងប្រហុក។ រសជាតិជូរប្រៃសាបតិចៗ។" },
  { keywords: ["នំបញ្ចុក", "nom banh chok", "noodle"], info: "🍜 នំបញ្ចុក (Nom Banh Chok): អាហារពេលព្រឹកដ៏ពេញនិយម មានសរសៃនំធ្វើពីម្សៅអង្ករ ស្រូបទឹកសម្លប្រហើរ (ត្រី) ញ៉ាំផ្ទាប់ជាមួយបន្លែស្រស់ៗ (ត្រួយចេក សណ្តែកបណ្តុះ...)។" },
  { keywords: ["ជ័យវរ្ម័ន", "jayavarman"], info: "👑 ព្រះបាទជ័យវរ្ម័នទី៧ (King Jayavarman VII): ជាព្រះមហាក្សត្រដ៏ខ្លាំងពូកែបំផុតនាសម័យអង្គរ (សតវត្សទី១២)។ ព្រះអង្គបានកសាងប្រាសាទបាយ័ន តាព្រហ្ម មន្ទីរពេទ្យ(អរោគ្យសាលា)១០២ និងសាលាសំណាក់១២១។" },
  { keywords: ["អង្គរ", "angkor empire", "សម័យអង្គរ"], info: "🏛️ សម័យអង្គរ (Angkor Empire): ចាប់ផ្តើមនៅឆ្នាំ៨០២ ដោយព្រះបាទជ័យវរ្ម័នទី២ និងលាតសន្ធឹងយ៉ាងធំធេងនៅអាស៊ីអាគ្នេយ៍។ ជាសម័យកាលដ៏រុងរឿងបំផុតនៃប្រវត្តិសាស្ត្រខ្មែរ ដែលមានការកសាងប្រាសាទរាប់ពាន់។" }
];

export function searchHistoryFood(query) {
  const q = query.toLowerCase();
  const match = HISTORY_FOOD_DB.find(item => item.keywords.some(k => q.includes(k.toLowerCase())));
  return match ? match.info : null;
}
`;
  kDb = kDb + "\n" + moreDb;
  fs.writeFileSync("src/ai/knowledge.mjs", kDb);
  console.log("បញ្ចូលទិន្នន័យ ប្រវត្តិសាស្ត្រ និងម្ហូប រួចរាល់!");
}

// ២) បន្ថែមមុខងារ គិតលេខ និងភ្ជាប់ទិន្នន័យថ្មី ចូលក្នុងខួរក្បាល (khoem.mjs)
let khoem = fs.readFileSync("src/ai/khoem.mjs", "utf8");

if (!khoem.includes("searchHistoryFood")) {
  khoem = khoem.replace(
    'import { searchTechDB } from "./knowledge.mjs";',
    'import { searchTechDB, searchHistoryFood } from "./knowledge.mjs";'
  );

  const mathLogic = `
  // មុខងារគិតលេខ (Calculator Module)
  const mathRegex = /([0-9]+(?:\\.[0-9]+)?)\\s*(\\+|-|\\*|\\/|បូក|ដក|គុណ|ចែក)\\s*([0-9]+(?:\\.[0-9]+)?)/;
  const m = q.match(mathRegex);
  if (m) {
    let num1 = parseFloat(m[1]);
    let op = m[2];
    let num2 = parseFloat(m[3]);
    let res = 0;
    let opStr = "";
    
    if (op === "+" || op === "បូក") { res = num1 + num2; opStr = "+"; }
    else if (op === "-" || op === "ដក") { res = num1 - num2; opStr = "-"; }
    else if (op === "*" || op === "គុណ") { res = num1 * num2; opStr = "x"; }
    else if (op === "/" || op === "ចែក") { res = num2 !== 0 ? num1 / num2 : "មិនអាចចែកនឹងសូន្យបានទេ"; opStr = "÷"; }
    
    return \`🧮 លទ្ធផល៖ \${num1} \${opStr} \${num2} = \${res}\`;
  }

  // មុខងារទាញទិន្នន័យប្រវត្តិសាស្ត្រ និងម្ហូប
  const histFoodResult = searchHistoryFood(q);
  if (histFoodResult) return histFoodResult;
`;

  khoem = khoem.replace(
    "const techResult = searchTechDB(q);\n  if (techResult) return techResult;",
    "const techResult = searchTechDB(q);\n  if (techResult) return techResult;\n" + mathLogic
  );

  fs.writeFileSync("src/ai/khoem.mjs", khoem);
  console.log("បំពាក់មុខងារគិតលេខ និងភ្ជាប់ទិន្នន័យថ្មីរួចរាល់!");
}
