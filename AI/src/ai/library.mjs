// src/ai/library.mjs
// បណ្ណាល័យធនធានរួមតែមួយ (១៦ ក្រុម). ទិន្នន័យ real / ai / user ដាក់ដោយឡែកតាម `source`.
// មិនសរសេរជាន់លើដោយស្ងាត់ៗ: រាល់ការប្តូរត្រូវកត់ក្នុង history.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const libFile = () =>
  process.env.LIBRARY_FILE || path.join(HERE, "..", "..", "data", "library.json");

export const GROUPS = Object.freeze([
  "people", "fashion", "tech", "vehicles", "buildings", "valuables", "food", "fruits",
  "vegetables", "farming", "drinks", "appliances", "plants", "kitchenware", "places", "animals",
]);
export const SOURCES = Object.freeze(["real", "ai", "user"]);
const MAX_ITEMS = 5000;

let tx = null; // ក្នុង batch(): ទុកទិន្នន័យក្នុងអង្គចងចាំ ហើយសរសេរឯកសារម្តងតែមួយនៅចុងបញ្ចប់

function readDisk() {
  try {
    const j = JSON.parse(fs.readFileSync(libFile(), "utf8"));
    return j && j.items && typeof j.items === "object" && !Array.isArray(j.items) ? j.items : {};
  } catch {
    return {};
  }
}

function writeDisk(items) {
  const f = libFile();
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f + ".tmp", JSON.stringify({ version: 1, items }, null, 2));
  fs.renameSync(f + ".tmp", f);
}

const load = () => (tx ? tx.items : readDisk());
const save = (items) => { if (tx) tx.items = items; else writeDisk(items); };

// ប្រតិបត្តិការច្រើនក្នុងម្តងសរសេរ (លឿនជាង ១០០ដង សម្រាប់ seed)។
// បើ fn បោះកំហុស គ្មានអ្វីត្រូវសរសេរចូលឯកសារទេ។
export function batch(fn) {
  if (tx) return fn(); // nested: ចូលរួមក្នុង batch ខាងក្រៅ
  tx = { items: readDisk() };
  try {
    const r = fn();
    writeDisk(tx.items);
    return r;
  } finally {
    tx = null;
  }
}

const err = (reason) => ({ ok: false, reason });

export function createItem({ group, name, tags = [], source = "user", data = {} }) {
  if (!GROUPS.includes(group)) return err("bad_group");
  if (!SOURCES.includes(source)) return err("bad_source");
  const nm = String(name ?? "").normalize("NFC").trim();
  if (!nm) return err("empty_name");
  const items = load();
  if (Object.keys(items).length >= MAX_ITEMS) return err("library_full");
  const id = `${group}_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  items[id] = {
    id, group, name: nm, source, createdAt: now, updatedAt: now,
    tags: [...new Set(tags.map((t) => String(t).trim()).filter(Boolean))],
    data, history: [],
  };
  save(items);
  return { ok: true, item: items[id] };
}

// ការពារ id ដូច "constructor" / "__proto__" (property ដែលទទួលពី Object.prototype)
const own = (o, k) => (Object.prototype.hasOwnProperty.call(o, k) ? o[k] : undefined);
export const getItem = (id) => own(load(), id) ?? null;

export function listItems({ group, tag, source } = {}) {
  return Object.values(load()).filter(
    (i) => (!group || i.group === group) && (!tag || i.tags.includes(tag)) && (!source || i.source === source)
  );
}

// កែទិន្នន័យតាម mutator. mutator(item) ត្រឡប់ array នៃ history entries (ពីអ្វីដែលបានប្តូរ).
export function updateItem(id, mutator) {
  const items = load();
  const item = own(items, id);
  if (!item) return err("not_found");
  const changes = mutator(item) || [];
  if (changes.length) {
    const at = new Date().toISOString();
    for (const c of changes) item.history.push({ at, ...c });
    if (item.history.length > 500) item.history.splice(0, item.history.length - 500);
    item.updatedAt = at;
    save(items);
  }
  return { ok: true, item, changed: changes.length };
}

export function removeItem(id) {
  const items = load();
  if (!own(items, id)) return err("not_found");
  delete items[id];
  save(items);
  return { ok: true };
}
