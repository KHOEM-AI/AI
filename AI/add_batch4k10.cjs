const fs = require("fs");

const file = "src/ai/khmer.mjs";
let content = fs.readFileSync(file, "utf8");

const old = `export function khmerReply(text, learned = {}, honorific = "បង") {
  const q = String(text ?? "").trim();
  if (!q || q.startsWith("/")) return null;

  const norm = q.toLowerCase();
  if (SEED.has(norm)) return say(SEED.get(norm));
  for (const [k, v] of Object.entries(learned)) {
    if (k === norm) return say(v);
  }
  // Substring containment fallback — Khmer often has no spaces between
  // clauses, so keyword containment catches more phrasing variants.
  const matches = [...SEED.entries()]
    .filter(([k]) => norm.includes(k))
    .sort(([a], [b]) => b.length - a.length);

  if (matches.length > 0) {
    return say(matches[0][1]);
  }

  return null;
}`;

const replacement = `// Batch 4K-10 — Lightweight conversation context.
// Context is optional so existing callers remain fully compatible.
const CONTEXT_WORDS = [
  "វា",
  "រឿងនេះ",
  "រឿងនោះ",
  "ចំណុចនេះ",
  "ចំណុចនោះ",
  "បញ្ហានេះ",
  "បញ្ហានោះ",
  "ជំហាននេះ",
  "ជំហាននោះ",
  "លទ្ធផលនេះ",
  "លទ្ធផលនោះ",
];

function ensureConversationContext(context) {
  if (!context || typeof context !== "object") return null;

  if (!Array.isArray(context.history)) context.history = [];
  if (typeof context.lastUserText !== "string") context.lastUserText = "";
  if (typeof context.lastReply !== "string") context.lastReply = "";
  if (typeof context.topic !== "string") context.topic = "";

  return context;
}

function detectConversationTopic(text) {
  const topics = [
    ["កូដ|កម្មវិធី|កុំព្យូទ័រ|អ៊ីនធឺណិត", "tech"],
    ["ការងារ|ការងាររបស់ខ្ញុំ", "work"],
    ["រៀន|មេរៀន|សាលា|ប្រលង", "study"],
    ["លុយ|ប្រាក់|ចំណាយ|ទិញ", "money"],
    ["គ្រួសារ|ឪពុកម្តាយ|បងប្អូន", "family"],
    ["ម្ហូប|អាហារ|បាយ|ភេសជ្ជៈ", "food"],
    ["ធ្វើដំណើរ|ឡាន|ផ្លូវ|ដំណើរ", "travel"],
    ["សុខភាព|ឈឺ|ថ្នាំ|គេង", "health"],
  ];

  for (const [patterns, topic] of topics) {
    if (patterns.split("|").some((p) => text.includes(p))) {
      return topic;
    }
  }

  return "";
}

function updateConversationContext(context, userText, reply) {
  if (!context) return;

  const topic = detectConversationTopic(userText);
  if (topic) context.topic = topic;

  context.lastUserText = userText;
  context.lastReply = typeof reply === "string" ? reply : "";

  context.history.push({
    user: userText,
    reply: typeof reply === "string" ? reply : "",
    topic: context.topic,
  });

  // Keep only the latest 10 turns.
  if (context.history.length > 10) {
    context.history.splice(0, context.history.length - 10);
  }
}

function isContextReference(text) {
  return CONTEXT_WORDS.some((word) => text.includes(word));
}

function getContextReply(context) {
  if (!context || !context.lastUserText) return null;

  if (context.topic) {
    const topicNames = {
      tech: "បច្ចេកវិទ្យា",
      work: "ការងារ",
      study: "ការសិក្សា",
      money: "លុយ និងការចំណាយ",
      family: "គ្រួសារ",
      food: "អាហារ",
      travel: "ការធ្វើដំណើរ",
      health: "សុខភាព",
    };

    const topicName = topicNames[context.topic];
    if (topicName) {
      return \`យល់ហើយ។ យើងកំពុងនិយាយអំពី\${topicName}។ អាចបន្តពីចំណុចមុនបាន។\`;
    }
  }

  return "យល់ហើយ។ យើងអាចបន្តពីរឿងដែលបាននិយាយមុនបាន។";
}

export function khmerReply(
  text,
  learned = {},
  honorific = "បង",
  context = null
) {
  const q = String(text ?? "").trim();
  const conversation = ensureConversationContext(context);

  if (!q || q.startsWith("/")) return null;

  const norm = q.toLowerCase();

  // Explicit context reset.
  if (
    norm === "ចាប់ផ្តើមថ្មី" ||
    norm === "ចាប់ផ្តើមម្តងទៀត" ||
    norm === "បំភ្លេចរឿងមុន"
  ) {
    if (conversation) {
      conversation.history.length = 0;
      conversation.lastUserText = "";
      conversation.lastReply = "";
      conversation.topic = "";
    }
    return "បាន។ យើងចាប់ផ្តើមពីថ្មី។";
  }

  let reply = null;

  if (SEED.has(norm)) {
    reply = say(SEED.get(norm));
  } else {
    for (const [k, v] of Object.entries(learned)) {
      if (k === norm) {
        reply = say(v);
        break;
      }
    }
  }

  // Substring containment fallback — Khmer often has no spaces between
  // clauses, so keyword containment catches more phrasing variants.
  if (reply === null) {
    const matches = [...SEED.entries()]
      .filter(([k]) => norm.includes(k))
      .sort(([a], [b]) => b.length - a.length);

    if (matches.length > 0) {
      reply = say(matches[0][1]);
    }
  }

  // Context-aware fallback only when the message refers to previous context.
  if (reply === null && conversation && isContextReference(norm)) {
    reply = getContextReply(conversation);
  }

  if (reply !== null) {
    updateConversationContext(conversation, q, reply);
    return reply;
  }

  return null;
}`;

if (!content.includes(old)) {
  console.error("❌ Could not find the expected khmerReply function");
  process.exit(1);
}

content = content.replace(old, replacement);
fs.writeFileSync(file, content);

console.log("✅ Added Batch 4K-10");
console.log("📌 Optional conversation context + topic continuity + context reset");
