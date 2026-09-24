import { searchTechDB, searchHistoryFood, searchMoreHistory, searchCompleteHistory, searchKhmerCakes, searchKhmerWine, searchCultureTradition } from "./knowledge.mjs";
import { handleLearn, load } from "./learn.mjs";
import { englishReply } from "./english.mjs";
import { funcs, check, HELP_ALL } from "./tools.mjs";
import { find } from "./find.mjs";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const CODE = /\.(tsx?|mjs|js|css)$/;
const isBackup = (n) =>
  n.includes(".before-") || n.endsWith(".backup") || n.includes("black3d-small");

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === "dist" || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function scan() {
  const all = walk(ROOT);
  const backups = all.filter((f) => isBackup(path.basename(f)));
  const code = all.filter((f) => CODE.test(f) && !isBackup(path.basename(f)));
  const rows = code.map((f) => {
    const lines = fs.readFileSync(f, "utf8").split("\n");
    const seen = new Set();
    const dup = [];
    for (const l of lines) {
      if (l.startsWith("import ")) {
        if (seen.has(l)) dup.push(l);
        seen.add(l);
      }
    }
    return { f: path.relative(ROOT, f), n: lines.length, dup };
  });
  rows.sort((a, b) => b.n - a.n);
  const total = rows.reduce((s, r) => s + r.n, 0);
  let out = `ឯកសារកូដ: ${rows.length} | បន្ទាត់សរុប: ${total} | ឯកសារ backup: ${backups.length}\n\nធំជាងគេ:\n`;
  out += rows.slice(0, 5).map((r) => `- ${r.f} (${r.n})`).join("\n");
  const bad = rows.filter((r) => r.dup.length);
  out += "\n\n";
  out += bad.length
    ? "import ស្ទួន:\n" + bad.map((r) => `- ${r.f}: ${r.dup[0]}`).join("\n")
    : "គ្មាន import ស្ទួន ✅";
  return out;
}

function readFile(rel) {
  const p = path.resolve(ROOT, rel);
  if (!p.startsWith(SRC + path.sep)) return "អានបានតែឯកសារក្នុងថត src/ ប៉ុណ្ណោះ";
  if (!fs.existsSync(p) || !fs.statSync(p).isFile()) return "រកមិនឃើញឯកសារ: " + rel;
  const lines = fs.readFileSync(p, "utf8").split("\n");
  return `${rel} (${lines.length} បន្ទាត់)\n\n` + lines.slice(0, 40).join("\n");
}

const HELP =
  "ប្អូនជាខួរផ្ទាល់ខ្លួនរបស់បង (គ្មាន API) ហើយនៅតូច។ ប្អូនយល់ពាក្យបញ្ជាទាំងនេះ:\n" +
  "- /scan  ស្កេនកូដក្នុងគម្រោង\n" +
  "- /read src/App.tsx  អានឯកសារ ៤០ បន្ទាត់ដំបូង";

const HELP_EN =
  "Commands KHOEM-AI understands:\n" +
  "- /scan  scan the project code\n" +
  "- /read src/App.tsx  read the first 40 lines\n" +
  "- /funcs src/Gate.tsx  list functions\n" +
  "- /check  look for common problems\n" +
  "- /help  show this list\n" +
  "- /learn question = answer  teach the brain\n" +
  "- /learned  show what it has learned\n" +
  "- /forget question  make it forget\n" +
  "- /find word  search the code";

const lang = (s) =>
  /[\u1780-\u17FF]/.test(s) ? "km" : "en";

const RE = {
  km: {
    hello: /^(សួស្តី|សួស្ដី|ជំរាបសួរ|ជម្រាបសួរ)/,
    name: /ឈ្មោះ|(អ្នក|ប្អូន)ជា(អ្វី|នរណា|អ្នកណា)/,
  },
  en: {
    hello: /^(hello|hi|hey)\b/,
    name: /\b(your name|who are you|what are you)\b/,
  },
};

const SAY = {
  km: {
    hello: (h) => `ជម្រាបសួរ${h}! 🙏 ខ្ញុំគឺ KHOEM-AI។\nតើថ្ងៃនេះ${h}មានអ្វីឱ្យខ្ញុំជួយដែរឬទេ?\n(វាយ /help ដើម្បីមើលពាក្យបញ្ជា)`,
    name: "ខ្ញុំឈ្មោះ KHOEM-AI ជាជំនួយការឆ្លាតវៃផ្ទាល់ខ្លួនរបស់អ្នក។ 🙂",
    unknown: (h) =>
      `សូមអភ័យទោស${h} ខ្ញុំមិនទាន់យល់ពីសំណួរនេះនៅឡើយទេ។ 😔\nប៉ុន្តែ${h}អាចបង្រៀនខ្ញុំបាន៖ /learn សំណួរ = ចម្លើយ\n(ឬវាយ /help ដើម្បីមើលពាក្យបញ្ជាផ្សេងៗ)`,
  },
  en: {
    hello: "Hello! 🙂\nI am KHOEM-AI.\nType /help to see my commands.",
    name: "I am KHOEM-AI, a small assistant that runs on this phone. I do not call any outside API.",
    unknown:
      "I do not have an answer for that yet. You can teach me: /learn question = answer\nOr type /help to see my commands.",
  },
};

export async function khoemReply(conversation, honorific = "បង", onStage = null) {
  const last = String(conversation.at(-1)?.content ?? "").trim();
  const q = last.toLowerCase();
  const l = lang(last);

  if (l === "en" && !q.startsWith("/") && q !== "help") { onStage?.("RETRIEVING", "english module"); return englishReply(last, load()); }

  if (!q.startsWith("/") && RE[l].hello.test(q)) return l === "km" ? SAY.km.hello(honorific) : SAY.en.hello;
  if (!q.startsWith("/") && RE[l].name.test(q)) return SAY[l].name;

  const learned = handleLearn(last);
  if (learned !== null) { onStage?.("LEARNING", "learn command handled"); return learned; }

  // សំណួរជាក់លាក់ស្តីពីបុណ្យភ្ជុំបិណ្ឌ
  if (!q.startsWith("/") && (q.includes("ទៅវត្តធ្វើអី") || q.includes("ធ្វើអីខ្លះក្នុងពិធីបុណ្យភ្ជុំបិណ្ឌ") || q.includes("ទៅវត្តធ្វើអ្វី") || q.includes("ធ្វើអ្វីនៅវត្ត") || q.includes("ធ្វើអីនៅវត្ត") || q.includes("ភ្ជុំបិណ្ឌធ្វើអី"))) {
    return "🕯️ ក្នុងពិធីបុណ្យភ្ជុំបិណ្ឌ ប្រជាពលរដ្ឋយើងទៅវត្តធ្វើសកម្មភាពសំខាន់ៗដូចជា៖\n- រយៈពេលដាក់បិណ្ឌ (ថ្ងៃទី១ ដល់ថ្ងៃទី១៤)៖ នាំគ្នាត្រៀមចង្ហាន់ ស្រូវអង្ករ និងនំចំណីប្រពៃណី (នំអន្សម នំគក់) យកទៅប្រគេនព្រះសង្ឃតាមវេន ដើម្បីឧទ្ទិសដល់ញាតិការដែលបានចែកឋានទៅ។\n- ប្រពៃណីបាយបិណ្ឌ៖ យកដុំបាយតូចៗទៅបោះនៅពេលព្រលឹមស្រាងៗ (ម៉ោង ៤ ទៀបភ្លឺ) ដើម្បីឧទ្ទិសដល់ពួកប្រេតអនាថា។\n- ថ្ងៃភ្ជុំបិណ្ឌធំ (ថ្ងៃទី១៥)៖ ជួបជុំសាច់ញាតិធ្វើបុណ្យទានធំដុំ ប្រគេនចង្ហាន់ និងធ្វើពិធីបង្សុកូលឧទ្ទិសកុសល។";
  }
  if (!q.startsWith("/") && (q.includes("ទៅដើម្បីអី") || q.includes("គោលបំណងទៅវត្ត") || q.includes("ទៅដើម្បីអ្វី") || q.includes("ទៅវត្តដើម្បីអី") || q.includes("ទៅវត្តដើម្បីអ្វី") || q.includes("ហេតុអ្វីបានជាទៅវត្ត") || q.includes("ហេតុអីទៅវត្ត"))) {
    return "🕯️ គោលបំណងនៃការទៅវត្តក្នុងអំឡុងពេលបុណ្យភ្ជុំបិណ្ឌរួមមាន៖\n- ឧទ្ទិសកុសលដល់ញាតិការទាំង ៧សន្តាន និងបុព្វបុរសដែលបានចែកឋានទៅ។\n- ដោះលែងព្រលឹងប្រេតដែលខុសបាប និងអនាថាឱ្យទទួលបានចំណីអាហារ និងរួចផុតពីទុក្ខវេទនា។\n- បំពេញកុសល និងពង្រឹងសាមគ្គីភាពគ្រួសារក្នុងថ្ងៃបុណ្យធំប្រចាំឆ្នាំ។";
  }

  if (q === "/scan" || q.includes("ស្កេន") || q.startsWith("/read ") || q === "/check" || q.startsWith("/funcs ") || q.startsWith("/find ")) onStage?.("TOOL_CALL", "tool command");
  if (q === "/scan" || q.includes("ស្កេន")) return scan();
  if (q.startsWith("/read ")) return readFile(last.slice(6).trim());
  if (q === "/help" || q === "help") return l === "en" ? HELP_EN : HELP_ALL;
  if (q === "/check") return check();
  if (q.startsWith("/funcs ")) return funcs(last.slice(7).trim());
  if (q.startsWith("/find ")) return find(last.slice(6).trim());

  if (RE[l].hello.test(q)) return SAY[l].hello;
  if (RE[l].name.test(q)) return SAY[l].name;

  // --- Bridge to english.mjs for Knowledge Base (Laws, Provinces, Landmarks) ---
  try {
    onStage?.("RETRIEVING", "knowledge base lookup");
    const enMod = await import("./english.mjs");
    if (enMod.englishReply) {
      // បញ្ជូនសំណួរទៅឆែកក្នុង Knowledge Base ទោះជាភាសាអ្វីក៏ដោយ
      const kb = await enMod.englishReply(conversation);
      if (kb && !kb.includes("I am sorry") && !kb.includes("Sorry,") && !kb.includes("I don't") && !kb.includes("unknown")) {
        return kb;
      }
    }
  } catch (e) {
    // ignore
  }
  // -----------------------------------------------------------------------------
  return l === "km" ? SAY.km.unknown(honorific) : SAY.en.unknown;
}
