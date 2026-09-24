// src/ai/chinese.mjs — basic Mandarin Chinese conversation rules (starter set).
// Scope: greetings, identity, manners, help/commands. Not a full replica of
// english.mjs's depth — extend ENTRIES over time the same way english.mjs grew.

const ENTRIES = [
  ["你好|您好|嗨|哈喽", "你好！🙂 有什么问题我可以帮你吗？"],
  ["早上好|早安", "早上好！今天想做什么？"],
  ["下午好", "下午好！有什么可以帮你的？"],
  ["晚上好", "晚上好！有什么可以帮你的？"],
  ["晚安", "晚安！好好休息。"],
  ["你好吗|你怎么样", "我运行正常，谢谢。你呢？"],
  ["你叫什么名字|你的名字|你是谁", "我叫 KHOEM-AI 🙂"],
  ["谁创造了你|谁做的你|谁开发的你", "我是在这个项目里，在这部手机上被创建的。"],
  ["你是机器人吗|你是人吗", "我是一个电脑程序，不是人类。"],
  ["你是ai吗|你是人工智能吗", "是的，但是一个很小的人工智能。"],
  ["你会做什么|你能做什么|你有什么功能", "我可以扫描和搜索你的代码，列出函数，读取文件，学习新答案。输入 /help 查看所有命令。"],
  ["谢谢|谢谢你|多谢", "不客气！"],
  ["对不起|抱歉", "没关系。"],
  ["再见|拜拜", "再见！下次见。"],
  ["是的|好的|可以", "好的，接下来想做什么？"],
  ["不|不要|不用了", "好的，需要什么再告诉我。"],
  ["你真棒|做得好|干得好", "谢谢！我还在学习，你在教我。"],
  ["我爱你", "谢谢你的好意，我只是一个小程序，但很高兴能帮到你。"],
  ["现在几点|几点了", () => "现在的时间是 " + new Date().toLocaleTimeString("zh-CN") + "。"],
  ["今天几号|今天是几号|今天日期", () => "今天是 " + new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" }) + "。"],
  ["帮助|命令|指令", "输入 /help 查看我理解的所有命令。"],
];

const SEED = new Map();
for (const [keys, answer] of ENTRIES) {
  for (const k of keys.split("|")) SEED.set(k, answer);
}

const say = (a) => (typeof a === "function" ? a() : a);

const HELP_ZH =
  "我理解的命令：\n" +
  "- /scan  扫描项目代码\n" +
  "- /read src/App.tsx  读取文件前40行\n" +
  "- /funcs src/Gate.tsx  列出函数\n" +
  "- /check  检查常见问题\n" +
  "- /help  显示此列表\n" +
  "- /learn 问题 = 答案  教我新知识\n" +
  "- /learned  显示已学内容\n" +
  "- /forget 问题  让我忘记\n" +
  "- /find 词语  搜索代码";

const UNSURE_ZH = "抱歉，我还不太明白 🙂 可以换个简单的说法吗？你也可以教我：/learn 问题 = 答案";

export function chineseReply(text, learned = {}) {
  const q = String(text || "").trim();
  if (!q) return UNSURE_ZH;

  if (q === "/help" || q === "帮助") return HELP_ZH;

  // Exact match first (built-in rules, then anything taught via /learn).
  if (SEED.has(q)) return say(SEED.get(q));
  for (const [k, v] of Object.entries(learned)) {
    if (k === q) return say(v);
  }

  // Substring containment fallback — Chinese has no spaces between words,
  // so simple keyword containment works better than English's word-split approach.
  for (const [k, v] of SEED) {
    if (q.includes(k.split("|")[0]) || k.split("|").some((alt) => q.includes(alt))) {
      return say(v);
    }
  }

  return UNSURE_ZH;
}
