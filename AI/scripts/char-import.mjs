// ប្រើ: node scripts/char-import.mjs [--apply]
// ស្កេន input/characters/<kind>/*.png|jpg → ចុះក្នុង characters.mjs (refs = ផ្លូវរូប)
// គ្មាន --apply = dry-run។ មិនស្ទួន (ពិនិត្យតាម refs)។
import fs from "node:fs";
import path from "node:path";
import { createCharacter, listCharacters } from "../src/ai/characters.mjs";
import { updateItem } from "../src/ai/library.mjs";

const KINDS = {
  man: { gender: "male", age: "adult" }, woman: { gender: "female", age: "adult" },
  boy: { gender: "male", age: "child" }, girl: { gender: "female", age: "child" },
  elder_man: { gender: "male", age: "elder" }, elder_woman: { gender: "female", age: "elder" },
};
const apply = process.argv.includes("--apply");
const root = path.resolve("input/characters");
const arr = (x) => (Array.isArray(x) ? x : Array.isArray(x?.items) ? x.items : []);
const known = new Set(arr(listCharacters()).flatMap((c) => c.data?.refs ?? []));
let n = 0;
for (const [kind, meta] of Object.entries(KINDS)) {
  const dir = path.join(root, kind);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter((x) => /\.(png|jpe?g)$/i.test(x)).sort()) {
    const rel = path.join("input/characters", kind, f);
    if (known.has(rel)) continue;
    const name = path.basename(f, path.extname(f));
    console.log((apply ? "ADD " : "WOULD ADD ") + name, "→", kind);
    n++;
    if (!apply) continue;
    const r = createCharacter({ name, identity: { gender: meta.gender }, current: { age: meta.age }, tags: [kind], source: "user" });
    const id = r?.id ?? r?.item?.id;
    if (id) updateItem(id, (it) => { it.data.refs.push(rel); return []; });
  }
}
console.log(n ? `${n} តួ` : "គ្មានរូបថ្មី");
