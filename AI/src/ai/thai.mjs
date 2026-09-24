import { RE, SAY } from "./languageRegistry.mjs";

export function thaiReply(text, learned = {}, honorific = "") {
  const q = String(text ?? "").trim().toLowerCase();

  if (!q || q.startsWith("/")) return null;

  if (RE.th.hello.test(q)) {
    return SAY.th.hello;
  }

  if (RE.th.name.test(q)) {
    return SAY.th.name;
  }

  return null;
}
