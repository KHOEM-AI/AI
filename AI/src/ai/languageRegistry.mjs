// src/ai/languageRegistry.mjs
// Language detection + canned replies (hello/name/unknown), extracted from
// khoem.mjs so language data lives in one place. Behavior is unchanged —
// this is a pure extraction (Phase 1 of docs/LANGUAGE_ARCHITECTURE.md).

export const detectLanguage = (s) => {
  if (/[\u1780-\u17FF]/.test(s)) return "km";
  if (/[\u4e00-\u9fff]/.test(s)) return "zh";
  return "en";
};

export const LANGUAGE_REGISTRY = Object.freeze({
  km: Object.freeze({
    module: "./khmer.mjs",
    replyExport: "khmerReply",
    status: "active",
  }),
  en: Object.freeze({
    module: "./english.mjs",
    replyExport: "englishReply",
    status: "active",
  }),
  zh: Object.freeze({
    module: "./chinese.mjs",
    replyExport: "chineseReply",
    status: "active",
  }),
});

export const RE = {
  km: {
    hello: /^(សួស្តី|សួស្ដី|ជំរាបសួរ|ជម្រាបសួរ)/,
    name: /ឈ្មោះ|(អ្នក|ប្អូន)ជា(អ្វី|នរណា|អ្នកណា)/,
  },
  en: {
    hello: /^(hello|hi|hey)\b/,
    name: /\b(your name|who are you|what are you)\b/,
  },
  zh: {
    hello: /^(你好|您好|嗨|哈喽)/,
    name: /(你叫什么名字|你的名字|你是谁)/,
  },
};

export const SAY = {
  km: {
    hello: (h) => `ជម្រាបសួរ${h}! 🙏 ខ្ញុំគឺ KHOEM-AI។\nតើថ្ងៃនេះ${h}មានអ្វីឱ្យខ្ញុំជួយដែរឬទេ?\n(វាយ /help ដើម្បីមើលពាក្យបញ្ជា)`,
    name: "ខ្ញុំឈ្មោះ KHOEM-AI ជាជំនួយការឆ្លាតវៃផ្ទាល់ខ្លួនរបស់អ្នក។ 🙂",
    unknown: (h) =>
      `សូមអភ័យទោស${h} ខ្ញុំមិនទាន់យល់ពីសំណួរនេះនៅឡើយទេ។ 😔\nប៉ុន្តែ${h}អាចបង្រៀនខ្ញុំបាន៖ /learn សំណួរ = ចម្លើយ\n(ឬវាយ /help ដើម្បីមើលពាក្យបញ្ជាផ្សេងៗ)`,
  },
  en: {
    hello: "Hello! 🙂\nI am KHOEM-AI.\nType /help to see my commands.",
    name: "I am KHOEM-AI, a small assistant that runs on this phone. I do not call any outside API.",
    unknown:
      "I do not have an answer for that yet. You can teach me: /learn question = answer\nOr type /help to see my commands.",
  },
  // Chinese canned responses kept here for registry-level language data.
  zh: {
    hello: "你好！🙂 我是 KHOEM-AI。\n输入 /help 查看命令。",
    name: "我是 KHOEM-AI，一个在这部手机上运行的小助手。我不调用任何外部 API。",
    unknown: "我还没有这个问题的答案。你可以教我：/learn 问题 = 答案\n或输入 /help 查看命令。",
  },
};
