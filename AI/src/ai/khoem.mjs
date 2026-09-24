import { searchTechDB, searchHistoryFood, searchMoreHistory, searchCompleteHistory, searchKhmerCakes, searchKhmerWine, searchCultureTradition } from "./knowledge.mjs";
import { handleLearn, load } from "./learn.mjs";
import { routeLanguage } from "./languageCenter.mjs";
import { funcs, check, HELP_ALL } from "./tools.mjs";
import { find } from "./find.mjs";
import { proposePatch, getProposal, applyPatch, listProposals } from "./patch.mjs";
import { approveRequest, rejectRequest } from "./approvals.mjs";
import { detectLanguage, RE, SAY } from "./languageRegistry.mjs";
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
  "- /read src/App.tsx  អានឯកសារ ៤០ បន្ទាត់ដំបូង\n" +
  "- /patch path\\n<content>  ស្នើសុំកែកូដ (ត្រូវការអនុម័ត)\n" +
  "- /approve id  អនុម័ត + សរសេរឯកសារពិត\n" +
  "- /reject id  បដិសេធ\n" +
  "- /proposals  មើលបញ្ជី proposal";

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
  "- /find word  search the code\n" +
  "- /patch path (then content on next lines)  propose a code change (needs approval)\n" +
  "- /approve id  approve and write the file for real\n" +
  "- /reject id  reject a proposal\n" +
  "- /proposals  list pending proposals";

const lang = detectLanguage;

export async function khoemReply(conversation, honorific = "បង", onStage = null) {
  const last = String(conversation.at(-1)?.content ?? "").trim();
  const q = last.toLowerCase();
  const l = lang(last);

  // ===== NEW: code patch commands (propose -> approve -> apply) =====
  if (q.startsWith("/patch ")) {
    onStage?.("TOOL_CALL", "patch propose");
    const lines = last.split("\n");
    const relPath = lines[0].slice(7).trim();
    const newContent = lines.slice(1).join("\n");
    if (!relPath) return "ទម្រង់: /patch path/to/file.mjs (បន្ទាប់មកមាតិកាថ្មីនៅបន្ទាត់បន្ទាប់)";
    if (!newContent.trim()) return "សូមដាក់មាតិកាឯកសារថ្មីនៅបន្ទាត់បន្ទាប់ពី /patch path";
    try {
      const result = proposePatch({ relPath, newContent, reason: "requested via chat", actor: "khoem-ai" });
      if (result.status === "REJECTED_BY_SANDBOX") {
        const failed = (result.sandboxChecks || [])
          .filter((c) => c && c.ok === false)
          .map((c) => `- ${c.name || "check"}: ${c.detail || c.reason || "failed"}`)
          .join("\n");
        return `❌ Sandbox ច្រានចោល (proposal ${result.id}):\n${failed || "(no detail)"}`;
      }
      return `✅ បានស្នើសុំកែឯកសារ ${relPath}\nProposal ID: ${result.id}\nSandbox: ${result.sandboxOk ? "OK  ✅" : "FAIL ❌"}\nត្រូវការការអនុម័ត — វាយ "/approve ${result.id}" ដើម្បីអនុវត្ត ឬ "/reject ${result.id}" ដើម្បីបដិសេធ`;
    } catch (e) {
      return "❌ បញ្ហា: " + (e.message || String(e));
    }
  }

  if (q === "/proposals") {
    const list = listProposals();
    if (!list.length) return "គ្មាន proposal ណាមួយទេ";
    return list.slice(0, 10).map((p) => `- ${p.id} | ${p.relPath} | ${p.status}`).join("\n");
  }

  if (q.startsWith("/approve ")) {
    onStage?.("TOOL_CALL", "patch approve");
    const proposalId = last.slice(9).trim();
    const proposal = getProposal(proposalId);
    if (!proposal) return "រកមិនឃើញ proposal: " + proposalId;
    if (!proposal.approvalId) return "Proposal នេះគ្មាន approval ភ្ជាប់ទេ (ប្រហែល sandbox ច្រានចោលរួច)";
    const decided = approveRequest(proposal.approvalId, "user", "approved via chat");
    if (decided.error) return "❌ មិនអាចអនុម័តបាន: " + decided.error;
    const applied = applyPatch(proposalId, proposal.approvalId, "user");
    if (!applied.ok) return "❌ Apply បរាជ័យ: " + applied.error;
    return `✅ បានអនុម័ត និងសរសេរចូល ${applied.relPath}\nRollback snapshot: ${applied.rollbackSnapshotId}\n${applied.note}`;
  }

  if (q.startsWith("/reject ")) {
    onStage?.("TOOL_CALL", "patch reject");
    const rest = last.slice(8).trim();
    const [proposalId, ...reasonParts] = rest.split(" ");
    const proposal = getProposal(proposalId);
    if (!proposal) return "រកមិនឃើញ proposal: " + proposalId;
    if (!proposal.approvalId) return "Proposal នេះគ្មាន approval ភ្ជាប់ទេ";
    const decided = rejectRequest(proposal.approvalId, "user", reasonParts.join(" ") || "rejected via chat");
    if (decided.error) return "❌ មិនអាចបដិសេធបាន: " + decided.error;
    return "✅ បានបដិសេធ proposal: " + proposalId;
  }
  // ===== END NEW =====

  // Route supported natural languages through the Language Center.
  if (!q.startsWith("/") && q !== "help") {
    const languageReply = await routeLanguage(last, load(), onStage);
    if (languageReply !== null) return languageReply;
  }

  if (!q.startsWith("/") && RE[l].hello.test(q)) return l === "km" ? SAY.km.hello(honorific) : l === "en" ? SAY.en.hello : null;
  if (!q.startsWith("/") && RE[l].name.test(q)) return SAY[l]?.name;

  const learned = handleLearn(last);
  if (learned !== null) { onStage?.("LEARNING", "learn command handled"); return learned; }

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

  if (RE[l]?.hello?.test(q)) return SAY[l]?.hello;
  if (RE[l]?.name?.test(q)) return SAY[l]?.name;

  try {
    onStage?.("RETRIEVING", "knowledge base lookup");
    const enMod = await import("./english.mjs");
    if (enMod.englishReply) {
      const kb = await enMod.englishReply(conversation);
      if (kb && !kb.includes("I am sorry") && !kb.includes("Sorry,") && !kb.includes("I don't") && !kb.includes("unknown")) {
        return kb;
      }
    }
  } catch (e) {
    // ignore
  }
  return l === "km" ? SAY.km.unknown(honorific) : SAY.en.unknown;
}
