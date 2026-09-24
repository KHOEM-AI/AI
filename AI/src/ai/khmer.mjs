import { RE, SAY } from "./languageRegistry.mjs";

export function khmerReply(text, learned = {}, honorific = "បង") {
  const q = String(text ?? "").trim().toLowerCase();

  if (!q || q.startsWith("/")) return null;

  if (RE.km.hello.test(q)) {
    return SAY.km.hello(honorific);
  }

  if (RE.km.name.test(q)) {
    return SAY.km.name;
  }

  return null;
}
