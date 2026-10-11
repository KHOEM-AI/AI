// src/ai/characters.mjs
// Dynamic Character & Story Continuity (ក្រុម people ក្នុងបណ្ណាល័យរួម).
// ផ្ទុក: identity ដើម (មិនប្តូរ) + current + outfits + changes (timeline) ។
// mergeCharacter() ប្រៀបធៀបទិន្នន័យចាស់/ថ្មី ហើយកែតែចំណុចដែលខុសគ្នា; មិនជាន់លើដោយស្ងាត់ៗ។
import { createItem, getItem, listItems, updateItem } from "./library.mjs";

const IDENTITY_KEYS = ["face", "skinTone", "marks", "gender", "birthYear"];
const CURRENT_KEYS = ["age", "body", "hair", "health", "outfit", "role", "wealth"];

const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o?.[k] != null && o[k] !== "").map((k) => [k, o[k]]));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function createCharacter({ name, identity = {}, current = {}, role, tags = [], source = "user" }) {
  const data = {
    identity: pick(identity, IDENTITY_KEYS),
    current: pick({ ...current, role }, CURRENT_KEYS),
    outfits: [],
    refs: [],
  };
  return createItem({ group: "people", name, tags: ["character", ...tags], source, data });
}

export const getCharacter = (id) => {
  const it = getItem(id);
  return it && it.group === "people" && it.tags.includes("character") ? it : null;
};

export const listCharacters = () => listItems({ group: "people", tag: "character" });

// update = { current?, identity?, outfit?, event?, storyDate? }
// - identity: បំពេញបានតែ field ដែលនៅទទេ; បើខុសពីដើម => conflict (មិនជាន់លើ)
//   លើកលែង force:true
// - current: ប្តូរតែ field ដែលខុស ហើយកត់ before/after
// - outfit: បន្ថែមឈុតថ្មី (មិនស្ទួនតាម label)
export function mergeCharacter(id, update = {}, { force = false } = {}) {
  const conflicts = [];
  const res = updateItem(id, (item) => {
    if (!item.tags.includes("character")) return [];
    const d = item.data;
    const log = [];
    const ev = update.event ? String(update.event).slice(0, 300) : undefined;
    const when = update.storyDate ? String(update.storyDate).slice(0, 60) : undefined;

    for (const [k, v] of Object.entries(pick(update.identity, IDENTITY_KEYS))) {
      const old = d.identity[k];
      if (old === undefined) {
        d.identity[k] = v;
        log.push({ kind: "identity.add", field: k, after: v, event: ev, storyDate: when });
      } else if (!same(old, v)) {
        if (force) {
          d.identity[k] = v;
          log.push({ kind: "identity.force", field: k, before: old, after: v, event: ev, storyDate: when });
        } else conflicts.push({ field: `identity.${k}`, existing: old, proposed: v });
      }
    }

    for (const [k, v] of Object.entries(pick(update.current, CURRENT_KEYS))) {
      const old = d.current[k];
      if (!same(old, v)) {
        d.current[k] = v;
        log.push({ kind: "current.change", field: k, before: old, after: v, event: ev, storyDate: when });
      }
    }

    if (update.outfit?.label) {
      const label = String(update.outfit.label).trim();
      const ex = d.outfits.find((o) => o.label === label);
      if (!ex) {
        d.outfits.push({ label, desc: update.outfit.desc ?? "", storyDate: when });
        log.push({ kind: "outfit.add", field: label, after: update.outfit.desc ?? "", event: ev, storyDate: when });
      } else if (update.outfit.desc && ex.desc !== update.outfit.desc) {
        log.push({ kind: "outfit.change", field: label, before: ex.desc, after: update.outfit.desc, event: ev, storyDate: when });
        ex.desc = update.outfit.desc;
      }
    }
    return log;
  });
  if (!res.ok) return res;
  return { ...res, conflicts };
}

// ប្រវត្តិការវិវត្ត តាមលំដាប់ពេល
export function getTimeline(id) {
  const c = getCharacter(id);
  return c ? c.history : null;
}

// ឃ្លាណែនាំសម្រាប់ម៉ូដែលរូបភាព/វីដេអូ: identity ថេរ + ស្ថានភាពបច្ចុប្បន្ន
export function buildPrompt(id, { outfit } = {}) {
  const c = getCharacter(id);
  if (!c) return null;
  const { identity, current, outfits } = c.data;
  const o = outfit ? outfits.find((x) => x.label === outfit) : null;
  const parts = [
    `${c.name}`,
    ...Object.entries(identity).map(([k, v]) => `${k}: ${v}`),
    ...Object.entries(current).filter(([k]) => k !== "outfit" || !o).map(([k, v]) => `${k}: ${v}`),
    ...(o ? [`outfit: ${o.desc || o.label}`] : []),
  ];
  return parts.join("; ");
}
