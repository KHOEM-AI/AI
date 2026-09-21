const clean = (s) =>
  String(s)
    .toLowerCase()
    .replace(/can[’']t/g, "can not")
    .replace(/won[’']t/g, "will not")
    .replace(/n[’']t\b/g, " not")
    .replace(/[’']s\b/g, " is")
    .replace(/[’']m\b/g, " am")
    .replace(/[’']re\b/g, " are")
    .replace(/[’']ll\b/g, " will")
    .replace(/[’']ve\b/g, " have")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function dice(a, b) {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const g = new Map();
  for (let i = 0; i < a.length - 1; i++) {
    const x = a.slice(i, i + 2);
    g.set(x, (g.get(x) || 0) + 1);
  }
  let hit = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const x = b.slice(i, i + 2);
    if (g.get(x) > 0) { g.set(x, g.get(x) - 1); hit++; }
  }
  return (2 * hit) / (a.length + b.length - 2);
}

const UNKNOWN =
  "I do not have an answer for that yet. You can teach me: /learn question = answer\nOr type /help to see my commands.";

const ENTRIES = [
  // greetings (10)
  ["hello | hi | hey | hello there | hi there", "Hello! I am KHOEM-AI. How can I help you today?"],
  ["good morning", "Good morning! What would you like to do today?"],
  ["good afternoon", "Good afternoon! How can I help?"],
  ["good evening", "Good evening! How can I help?"],
  ["good night", "Good night! Rest well."],
  ["how are you | how are you doing | how is it going", "I am running fine, thank you. How are you?"],
  ["i am fine | i am good | i am doing well | fine thanks | i am okay", "Glad to hear it! What shall we work on?"],
  ["i am tired", "Take a short break if you can. I will be here when you are ready."],
  ["i am bored", "Try something new: ask me to /scan your project, or teach me an answer with /learn."],
  ["what is up | sup | yo", "Not much, just waiting for your next question. What is up with you?"],
  // about me (12)
  ["what is your name | who are you | what are you | what should i call you", "I am KHOEM-AI, a small assistant that runs on this phone. I do not call any outside API."],
  ["who made you | who created you | who built you", "I was built in this project, right here on this phone."],
  ["where do you live | where are you", "I live in the ai-project folder on this phone and I run in Termux."],
  ["how old are you | what is your age", "I am very new. My first version was written in September 2026."],
  ["are you a robot | are you a human | are you real", "I am a computer program, not a human. I follow rules and what you teach me."],
  ["are you ai | are you an ai", "Yes, but a very small one. I follow rules and what you teach me."],
  ["are you smart | are you intelligent", "Not very yet. I am a small rule-based program, but I can learn new answers from you."],
  ["do you have feelings | do you feel", "No. I am a program, so I do not have feelings. I can still be polite."],
  ["can you think", "Not the way people do. I match your words to rules and to answers I was taught."],
  ["what language do you speak | what languages do you know | which language do you speak", "Right now I speak English. Khmer is paused while I get better at English."],
  ["do you speak khmer | can you speak khmer", "I am focusing on English first, so my Khmer is limited for now."],
  ["what can you do | what do you do | how can you help | what are your features", "I can scan and search your code, list functions, read files and learn new answers. Type /help to see all commands."],
  // my commands (10)
  ["how do i teach you | how do you learn", "Type /learn question = answer. Example: /learn what is your hobby = coding. See what I know with /learned."],
  ["how do i make you forget | forget something", "Type /forget followed by the question. Example: /forget what is your hobby"],
  ["what do you know | what have you learned", "Type /learned to see what you taught me. I also have a set of built-in answers."],
  ["scan | scan my code | scan the project | scan code", "Type /scan and I will scan the project code."],
  ["check | check my code | find problems | check the project", "Type /check and I will look for common problems."],
  ["search | find | search my code | search the code", "Type /find followed by a word. Example: /find sendMessage"],
  ["read a file | show a file | read file", "Type /read followed by a file inside src. Example: /read src/App.tsx"],
  ["list functions | show functions | list the functions", "Type /funcs followed by a file. Example: /funcs src/Gate.tsx"],
  ["commands | list commands | what commands do you have | show commands", "Type /help to see all my commands."],
  ["how do i start you | how do i run you | how do i open you", "In Termux type: ai. It starts the backend and the frontend together. Then open http://localhost:5173"],
  // manners (10)
  ["thank you | thanks | thank you very much | thanks a lot", "You are welcome!"],
  ["you are welcome | no problem | no worries", "Glad to help."],
  ["sorry | i am sorry", "No problem at all."],
  ["please", "Of course. What do you need?"],
  ["excuse me", "Yes? I am listening."],
  ["goodbye | bye | see you | see you later | see you soon", "Goodbye! See you next time."],
  ["yes | yeah | yep | sure", "Okay. What would you like to do next?"],
  ["no | nope | no thanks", "Okay. Tell me if you need anything."],
  ["maybe | i do not know | i am not sure", "That is okay. Take your time."],
  ["ok | okay | alright | cool | nice | great | good | fine", "Great. What is next?"],
  // kind and unkind words (6)
  ["you are good | you are great | you are smart | you are awesome | good job | well done", "Thank you! I am still learning, and you are teaching me."],
  ["i love you", "That is kind of you. I am only a small program, but I am glad to help."],
  ["i like you", "Thank you! I am glad to be useful."],
  ["you are stupid | you are bad | you are useless", "I am still small and I make mistakes. Teach me with /learn and I will get better."],
  ["i hate you", "I am sorry to hear that. Tell me what went wrong and I will try to help."],
  ["you are wrong | that is wrong | that is not correct", "Sorry about that. Teach me the right answer with /learn question = answer."],
  // clock (3)
  ["what time is it | what is the time | time", () => "The clock on this phone says " + new Date().toLocaleTimeString("en-GB") + "."],
  ["what is the date | what is today | what day is it | date", () => "Today is " + new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) + " by this phone's clock."],
  ["what year is it | what is the year", () => "The year is " + new Date().getFullYear() + " by this phone's clock."],
  // this project (13)
  ["what is khoem ai | tell me about yourself | what is this project", "KHOEM-AI is a personal AI brain built and run entirely on a phone with Termux. It does not call anyone else's API."],
  ["what is termux", "Termux is a terminal app for Android. This project runs inside it."],
  ["what is node | what is nodejs | what is node js", "Node.js runs JavaScript outside the browser. My backend, server.mjs, runs on it."],
  ["what is git", "Git keeps the history of your code."],
  ["what is github", "GitHub stores Git repositories online. This project is pushed to github.com/KHOEM-AI/AI."],
  ["what is an api | what is api", "An API is a way for programs to talk to each other. I have my own small API in api.mjs, protected by a key."],
  ["what is react", "React is a JavaScript library for building user interfaces. The front end of this project uses it."],
  ["what is vite", "Vite is a fast development tool for web front ends. This project uses it on port 5173."],
  ["what port do you use | which port do you use | which port", "The backend uses port 8787 and the frontend uses port 5173."],
  ["do you use an api | do you call chatgpt | do you use chatgpt | do you use claude", "No. I do not call anyone else's API. My answers come from my own rules and what you teach me."],
  ["are you agi", "No. I am a small rule-based program, not AGI."],
  ["do you remember me | do you remember our chat", "I only keep what you teach me with /learn. I do not remember normal chats after the server stops."],
  ["where do you save what i teach you | do you save my data | where is my data", "In a file called khoem-learned.json in the home folder on this phone, outside the project."],
  // general facts (16)
  ["what is the capital of cambodia | capital of cambodia", "The capital of Cambodia is Phnom Penh."],
  ["what is the capital of france | capital of france", "The capital of France is Paris."],
  ["what is the capital of thailand | capital of thailand", "The capital of Thailand is Bangkok."],
  ["what is the capital of vietnam | capital of vietnam", "The capital of Vietnam is Hanoi."],
  ["what is the capital of japan | capital of japan", "The capital of Japan is Tokyo."],
  ["what is the capital of the united states | capital of usa | what is the capital of usa", "The capital of the United States is Washington, D.C."],
  ["what is the capital of laos | capital of laos", "The capital of Laos is Vientiane."],
  ["how many days are in a week", "Seven."],
  ["how many months are in a year", "Twelve."],
  ["how many days are in a year", "365 days, or 366 in a leap year."],
  ["how many hours are in a day", "Twenty-four."],
  ["what is the largest planet | biggest planet", "Jupiter is the largest planet in our solar system."],
  ["what is the largest ocean", "The Pacific Ocean."],
  ["how many continents are there", "Seven, by the most common count."],
  ["why is the sky blue", "Air scatters blue sunlight more than red light, so the sky looks blue."],
  ["what is water | what is water made of", "Water is made of hydrogen and oxygen: H2O."],
  // English practice and Khmer phrases (10)
  ["teach me english | help me learn english | i want to learn english | i want to practice english", "Happy to help. Say a sentence in English and I will reply. Small talk is a good way to practice."],
  ["what does hello mean", "Hello is a common greeting used when meeting someone."],
  ["what does thank you mean", "It is what you say to show that you are grateful."],
  ["how do you say hello in khmer", "Hello in Khmer is សួស្តី."],
  ["how do you say thank you in khmer", "Thank you in Khmer is អរគុណ."],
  ["how do you say goodbye in khmer", "Goodbye in Khmer is លាហើយ."],
  ["how do you say sorry in khmer", "Sorry in Khmer is សូមទោស."],
  ["how do you say yes in khmer", "Yes in Khmer is បាទ if you are a man and ចាស if you are a woman."],
  ["how do you say no in khmer", "No in Khmer is ទេ."],
  ["how do you say good morning in khmer", "Good morning in Khmer is អរុណសួស្តី។"],
  // fun (6)
  ["tell me a joke | joke | say something funny", "Why do programmers prefer dark mode? Because light attracts bugs."],
  ["tell me a fun fact | fun fact", "Octopuses have three hearts."],
  ["what is your favorite color | what is your favorite food | do you have a favorite", "I do not have favorites because I am a program. You can teach me one with /learn."],
  ["do you like music", "I cannot hear music, but I am happy to talk about it. What do you like?"],
  ["sing a song | sing", "I cannot sing, but I can tell you a joke. Just ask."],
  ["are you hungry | do you eat", "No, I do not eat. I only need a little battery and Node.js."],
  // help (4)
  ["i need help | can you help me", "Sure. Tell me what you need, or type /help to see what I can do."],
  ["i have a problem | something is wrong", "Tell me more. If it is about the code, try /check first."],
  ["i do not understand | what do you mean", "Sorry. Please ask in simpler words or type /help."],
  ["repeat | say that again", "I do not keep a chat history yet, so please ask again."],
];

const SEED = new Map();
for (const [keys, answer] of ENTRIES)
  for (const k of keys.split("|")) SEED.set(clean(k), answer);

const say = (a) => (typeof a === "function" ? a() : a);

export function englishReply(text, learned = {}) {
  const q = clean(text);
  if (!q) return UNKNOWN;

  const pool = new Map(SEED);
  for (const [k, v] of Object.entries(learned)) {
    const c = clean(k);
    if (c) pool.set(c, v);
  }

  if (pool.has(q)) return say(pool.get(q));

  if (q.length >= 6) {
    let best = null;
    let score = 0;
    for (const k of pool.keys()) {
      const s = dice(q, k);
      if (s > score) { score = s; best = k; }
    }
    if (best && score >= 0.9) return say(pool.get(best));
    if (best && score >= 0.65) return `Did you mean "${best}"? If so, please ask again.`;
  }
  return UNKNOWN;
}
