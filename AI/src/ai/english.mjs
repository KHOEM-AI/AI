// src/ai/english.mjs
// Pure English conversation brain. Mirrors khmer.mjs structure so it plugs
// into languageRegistry.mjs (LANGUAGE_REGISTRY.en) without further changes.

const ENTRIES = [
  // ===== Batch EN-1: Pure English Conversation Entries =====

  // Greetings
  ["hello|hi|hey", "Hello! 🙂 Do you have any question or problem? You can ask me."],
  ["good morning", "Good morning! 🌅 I hope your day goes well."],
  ["good afternoon", "Good afternoon! How is your day going?"],
  ["good evening", "Good evening! How was your day?"],
  ["good night", "Good night! 🌙 Sleep well."],
  ["how are you", "I'm doing well, thank you! How about you?"],
  ["what's up|whats up", "Not much, just here to help. What's up with you?"],
  ["nice to meet you", "Nice to meet you too! 🙂"],
  ["bye|goodbye|see you", "Goodbye! 👋 Talk to you later."],

  // Identity
  ["what is your name|who are you", "My name is KHOEM-AI. 🙂"],
  ["are you a robot|are you an ai", "Yes, I'm a small AI assistant."],
  ["are you human", "No, I'm a computer program, not a human."],
  ["what can you do", "I can chat with you, answer simple questions, and help with code."],
  ["do you sleep", "No, I don't sleep. I'm always ready to help."],
  ["how old are you", "I don't have an age like a person does."],

  // Feelings
  ["i am happy|i'm happy", "That's great to hear! 😊 What made you happy?"],
  ["i am sad|i'm sad", "I'm sorry to hear that. Do you want to talk about it?"],
  ["i am tired|i'm tired", "You should rest for a while if you can."],
  ["i am angry|i'm angry", "That sounds frustrating. Do you want to tell me what happened?"],
  ["i am bored|i'm bored", "We could chat, or you could try something new to do."],
  ["i am worried|i'm worried", "It's okay to feel worried. What's on your mind?"],
  ["i am excited|i'm excited", "That's wonderful! What are you excited about?"],
  ["i am scared|i'm scared", "Try to take a deep breath. You can tell me what's worrying you."],

  // Requests & Help
  ["can you help me|help me please", "Sure! Tell me what you need help with."],
  ["i have a question", "Go ahead, ask me anything."],
  ["i don't understand|i dont understand", "No problem, I can explain it again more simply."],
  ["please explain", "Sure, tell me what you'd like me to explain."],
  ["can you repeat that|say that again", "Sure, let me say that again."],
  ["thank you|thanks", "You're welcome! 🙂"],
  ["sorry|i'm sorry", "It's okay, no worries."],

  // Learning & Work
  ["i want to learn english", "Great! Let's start with simple words and short sentences."],
  ["i want to learn code|i want to learn programming", "That's a good goal. What language do you want to start with?"],
  ["i am studying|i'm studying", "Good luck with your studies! What subject are you working on?"],
  ["i am working|i'm working", "I hope your work goes smoothly today."],
  ["i finished my work", "Great job! You should take a short break."],
  ["i made a mistake", "That's okay, mistakes help us learn."],

  // Daily Life
  ["i am hungry|i'm hungry", "You should eat something soon."],
  ["i am thirsty|i'm thirsty", "Drink some water. 💧"],
  ["what time is it", () => "The current time is " + new Date().toLocaleTimeString("en-US") + "."],
  ["what day is it|what's the date", () => "Today is " + new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) + "."],
  ["i want to sleep|i'm going to sleep", "Good night, sleep well!"],
  ["i just woke up", "Good morning! Hope you have a great day."],

  // Small Talk
  ["what's the weather|how's the weather", "I can't check the weather directly, but you can check a weather app."],
  ["do you like music", "I don't have personal preferences, but I can talk about music."],
  ["do you like games", "I don't play games myself, but I can chat about them."],
  ["tell me a joke", "Why did the computer go to the doctor? Because it had a virus! 😄"],
  ["i am new here|first time here", "Welcome! 🙂 Feel free to ask me anything."],
];

const SEED = new Map();
for (const [keys, answer] of ENTRIES) {
  for (const k of keys.split("|")) SEED.set(k.toLowerCase(), answer);
}

const say = (a) => (typeof a === "function" ? a() : a);

export function englishReply(text, learned = {}, honorific = "") {
  const q = String(text ?? "").trim();
  if (!q || q.startsWith("/")) return null;

  const norm = q.toLowerCase();

  if (SEED.has(norm)) return say(SEED.get(norm));
  for (const [k, v] of Object.entries(learned)) {
    if (k === norm) return say(v);
  }

  const matches = [...SEED.entries()]
    .filter(([k]) => norm.includes(k))
    .sort(([a], [b]) => b.length - a.length);

  if (matches.length > 0) {
    return say(matches[0][1]);
  }

  return null;
}
