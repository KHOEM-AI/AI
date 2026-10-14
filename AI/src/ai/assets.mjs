// src/ai/assets.mjs
// ធនធានទូទៅ (general assets catalog) លើបណ្ណាល័យរួម library.mjs — មិនមែនប្រព័ន្ធថ្មីស្ទួនទេ។
// វាលតាមឯកសារ: category(group+subgroup), nameKm/nameEn, region/country, appearance,
// imageRef, actions, tags។
// ចំណាំ: actions ជាសកម្មភាព "បង្ហាញក្នុងរឿង/វីដេអូ" ប៉ុណ្ណោះ (depictionOnly) ។
// វាមិនមែនការបញ្ជាឧបករណ៍ពិតទេ។
import { createItem, listItems, batch } from "./library.mjs";
import { SEED_ASSETS } from "./assetsSeed.mjs";
import { SEED_LIFE } from "./assetsSeedLife.mjs";

export const ALL_SEEDS = [...SEED_ASSETS, ...SEED_LIFE];

const norm = (s) => String(s ?? "").normalize("NFC").trim();
const low = (s) => norm(s).toLowerCase();
const list = (a) => [...new Set((Array.isArray(a) ? a : []).map(norm).filter(Boolean))];

const SRC = { user: 0, real: 1, ai: 2 };

export const isAsset = (it) => it.tags.includes("asset");

export function findDuplicate({ group, nameKm, nameEn }) {
  const km = low(nameKm), en = low(nameEn);
  return listItems({ group, tag: "asset" }).find(
    (i) => (km && low(i.data.nameKm) === km) || (en && low(i.data.nameEn) === en)
  );
}

export function createAsset(input = {}) {
  const nameKm = norm(input.nameKm), nameEn = norm(input.nameEn);
  if (!nameKm && !nameEn) return { ok: false, reason: "empty_name" };
  const dup = findDuplicate({ group: input.group, nameKm, nameEn });
  if (dup) return { ok: true, duplicate: true, item: dup };
  const r = createItem({
    group: input.group,
    name: nameKm || nameEn,
    source: input.source ?? "user",
    tags: ["asset", ...list(input.tags)],
    data: {
      subgroup: norm(input.subgroup) || undefined,
      nameKm, nameEn,
      region: norm(input.region) || "global",
      country: norm(input.country) || undefined,
      appearance: norm(input.appearance),
      imageRef: norm(input.imageRef) || undefined, // path/URL រូបយោង (បើមាន)
      actions: list(input.actions),
      alcohol: input.alcohol === true,
      depictionOnly: true,
    },
  });
  return r.ok ? { ...r, duplicate: false } : r;
}

export function searchAssets({ q, group, country, region, tag, alcohol } = {}) {
  const needle = low(q);
  return listItems({ group, tag: "asset" }).filter((i) => {
    const d = i.data;
    if (country && d.country !== country) return false;
    if (region && d.region !== region) return false;
    if (tag && !i.tags.includes(tag)) return false;
    if (alcohol !== undefined && d.alcohol !== alcohol) return false;
    if (!needle) return true;
    return [d.nameKm, d.nameEn, d.appearance, ...i.tags].some((t) => low(t).includes(needle));
  });
}

// ជ្រើសធនធានសមនឹងសាច់រឿង: ប្រទេស → តំបន់ → global (លំដាប់អាទិភាព)
// options.alcohol=false ដកភេសជ្ជៈមានជាតិអាល់កុលចេញ (ឧ. រឿងកុមារ)
export function pickForStory({ country, region, groups, limit = 20, alcohol } = {}) {
  // ធាតុដែលចង្អុលប្រទេសជាក់លាក់ ត្រូវតែត្រូវនឹងប្រទេសដែលស្នើ (សូស៊ីជប៉ុន មិនលាយក្នុងរឿងកម្ពុជា)
  // ធាតុគ្មានប្រទេស: ត្រូវតំបន់ → global
  const rank = (d) => d.country
    ? (country && d.country === country ? 0 : !country && region && d.region === region ? 1 : 3)
    : (region && d.region === region ? 1 : d.region === "global" ? 2 : 3);
  const gs = new Set(groups?.length ? groups : []);
  return listItems({ tag: "asset" })
    .filter((i) => (!gs.size || gs.has(i.group)) && (alcohol !== false || (!i.data.alcohol && !i.tags.includes("adult-only"))))
    .filter((i) => rank(i.data) < 3 || (!country && !region))
    // លំដាប់ស្មើគ្នា: ធាតុរបស់អ្នកប្រើ (user) មុន ផ្ទៀងផ្ទាត់ពិត (real) បន្ទាប់ ហើយ AI សរសេរ (ai) ក្រោយគេ
    .sort((a, b) => rank(a.data) - rank(b.data) || (SRC[a.source] ?? 3) - (SRC[b.source] ?? 3))
    .slice(0, Math.max(1, Math.min(Number(limit) || 20, 100)));
}

// បញ្ចូល seed ដោយមិនស្ទួន និងមិនជាន់លើធាតុដែលមានស្រាប់
export function seedAssets(seed = SEED_ASSETS) {
  let added = 0, skipped = 0, failed = 0;
  batch(() => {
    for (const s of seed) {
      // seed សរសេរដោយ AI មិនទាន់ផ្ទៀងផ្ទាត់ជាមួយប្រភពពិត → source "ai"
      const r = createAsset({ source: "ai", ...s });
      if (!r.ok) failed++;
      else if (r.duplicate) skipped++;
      else added++;
    }
  });
  return { added, skipped, failed, total: seed.length };
}

// seed ទាំងអស់ (មូលដ្ឋាន + ជីវិតប្រចាំថ្ងៃ) — seedAssets() លំនាំដើមមិនប្តូរ
export const seedAll = () => seedAssets(ALL_SEEDS);
