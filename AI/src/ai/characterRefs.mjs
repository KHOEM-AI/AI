// Character reference photos: only a path/URL string is stored, never image data.
import { getCharacter } from "./characters.mjs";
import { updateItem } from "./library.mjs";

export const MAX_REFS = 10;
const clean = (s) => String(s ?? "").trim();
const LOCAL = /^data\/refs\/[A-Za-z0-9._-]{1,100}\.(?:jpe?g|png|webp)$/i;
const REMOTE = /^https:\/\/[^\s]{4,280}$/i;

export function validRefPath(p) {
  const s = clean(p);
  if (!s || s.length > 300 || s.includes("..") || s.includes("\\")) return false;
  if (/[\u0000-\u001F\u007F]/.test(s)) return false;
  return LOCAL.test(s) || REMOTE.test(s);
}

export function listRefs(id) {
  const c = getCharacter(id);
  return c ? [...(c.data.refs ?? [])] : null;
}

export function addRef(id, { label, path } = {}) {
  const c = getCharacter(id);
  if (!c) return { ok: false, reason: "not_found" };
  const p = clean(path);
  if (!validRefPath(p)) return { ok: false, reason: "bad_path" };
  const refs = c.data.refs ?? [];
  if (refs.some((r) => r.path === p)) return { ok: true, duplicate: true, refs: [...refs] };
  if (refs.length >= MAX_REFS) return { ok: false, reason: "too_many" };
  const lb = clean(label).slice(0, 80) || "photo";
  const res = updateItem(id, (item) => {
    item.data.refs = Array.isArray(item.data.refs) ? item.data.refs : [];
    item.data.refs.push({ label: lb, path: p });
    return [{ kind: "ref.add", field: lb, after: p }];
  });
  if (!res.ok) return res;
  return { ok: true, duplicate: false, refs: listRefs(id) };
}

export function removeRef(id, n) {
  const c = getCharacter(id);
  if (!c) return { ok: false, reason: "not_found" };
  const i = Number(n);
  const refs = c.data.refs ?? [];
  if (!Number.isInteger(i) || i < 0 || i >= refs.length) return { ok: false, reason: "bad_index" };
  const removed = refs[i];
  const res = updateItem(id, (item) => {
    item.data.refs.splice(i, 1);
    return [{ kind: "ref.remove", field: removed.label, before: removed.path }];
  });
  if (!res.ok) return res;
  return { ok: true, refs: listRefs(id) };
}
