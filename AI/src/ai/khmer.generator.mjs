// src/ai/khmer.generator.mjs
// Small n-gram (Markov chain) sentence generator for Khmer. No external API.
// It recombines word sequences seen in the training corpus, so it can produce
// fluent-looking text that is NOT guaranteed to be factually correct.

const BOS = "\u0002";
const EOS = "\u0003";
const SEP = "\u0001";
const PUNCT_CLASS = "[\u17d4\u17d5\u17d6\u17d8\u17d9\u17da.,!?;:()\"\u201c\u201d]";
const PUNCT_SPLIT = new RegExp("(" + PUNCT_CLASS + ")");
const PUNCT_ONLY = new RegExp("^" + PUNCT_CLASS + "$");

export function defaultTokenizer(text) {
  return String(text ?? "")
    .normalize("NFC")
    .split(/\s+/)
    .flatMap((chunk) => chunk.split(PUNCT_SPLIT))
    .filter(Boolean);
}

function join(tokens) {
  let out = "";
  for (const t of tokens) out += out && !PUNCT_ONLY.test(t) ? " " + t : t;
  return out;
}

export function createKhmerGenerator({ order = 2, maxTokens = 40, tokenizer = defaultTokenizer } = {}) {
  if (!Number.isInteger(order) || order < 1) {
    throw new Error("order must be a positive integer");
  }
  const table = new Map(); // context -> Map(token -> count)
  let trainedSentences = 0;

  const pad = (tokens) => [...Array(order).fill(BOS), ...tokens];

  function train(sentences) {
    for (const sentence of sentences ?? []) {
      const tokens = tokenizer(sentence);
      if (!tokens.length) continue;
      const seq = [...pad(tokens), EOS];
      for (let i = order; i < seq.length; i++) {
        const ctx = seq.slice(i - order, i).join(SEP);
        let next = table.get(ctx);
        if (!next) table.set(ctx, (next = new Map()));
        next.set(seq[i], (next.get(seq[i]) ?? 0) + 1);
      }
      trainedSentences++;
    }
    return { trainedSentences, contexts: table.size };
  }

  function pick(counts, random) {
    let total = 0;
    for (const n of counts.values()) total += n;
    let r = random() * total;
    for (const [token, n] of counts) {
      r -= n;
      if (r < 0) return token;
    }
    return [...counts.keys()].pop();
  }

  function generate({ seed = "", random = Math.random, maxTokens: limit = maxTokens } = {}) {
    if (!table.size) return "";
    const out = seed ? tokenizer(seed) : [];
    const window = pad(out).slice(-order);
    for (let n = 0; n < limit; n++) {
      const counts = table.get(window.join(SEP));
      if (!counts) break;
      const next = pick(counts, random);
      if (next === EOS) break;
      out.push(next);
      window.push(next);
      window.shift();
    }
    return join(out);
  }

  return { train, generate, get size() { return table.size; } };
}
