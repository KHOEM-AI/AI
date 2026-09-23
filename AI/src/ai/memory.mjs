import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "..", "data");
const STORE_FILE = path.join(DATA_DIR, "memory-sessions.json");
const MAX_SESSIONS = 1000;

function safeWriteAtomic(file, data) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = file + ".tmp";
    fs.writeFileSync(tmp, data, "utf8");
    fs.renameSync(tmp, file);
  } catch (e) {
    console.error("[memory] persist write failed:", e && e.message);
  }
}

export class AIMemory {
  constructor({ maxMessages = 50, maxSessions = MAX_SESSIONS, persist = false } = {}) {
    this.maxMessages = maxMessages;
    this.maxSessions = maxSessions;
    this.persist = persist;
    this.sessions = new Map();

    if (this.persist) this._load();
  }

  _load() {
    try {
      if (!fs.existsSync(STORE_FILE)) return;
      const raw = JSON.parse(fs.readFileSync(STORE_FILE, "utf8"));
      for (const [sid, msgs] of Object.entries(raw)) {
        this.sessions.set(sid, msgs);
      }
    } catch (e) {
      console.error("[memory] load failed:", e && e.message);
    }
  }

  _save() {
    if (!this.persist) return;
    const obj = Object.fromEntries(this.sessions);
    safeWriteAtomic(STORE_FILE, JSON.stringify(obj));
  }

  createSession(sessionId) {
    if (!this.sessions.has(sessionId)) {
      if (this.sessions.size >= this.maxSessions) {
        this.sessions.delete(this.sessions.keys().next().value);
      }
      this.sessions.set(sessionId, []);
    }
    return sessionId;
  }

  add(sessionId, message) {
    if (!sessionId) {
      throw new Error("sessionId is required");
    }
    if (!message || !message.role || message.content == null) {
      throw new Error("message must contain role and content");
    }

    this.createSession(sessionId);
    const messages = this.sessions.get(sessionId);
    messages.push({
      role: message.role,
      content: message.content,
      timestamp: new Date().toISOString(),
    });

    if (messages.length > this.maxMessages) {
      messages.splice(0, messages.length - this.maxMessages);
    }

    this._save();
    return messages.at(-1);
  }

  get(sessionId) {
    return this.sessions.get(sessionId) ?? [];
  }

  clear(sessionId) {
    this.sessions.delete(sessionId);
    this._save();
  }

  // NEW: simple text search across a session's history
  search(sessionId, query) {
    const q = String(query || "").toLowerCase();
    if (!q) return [];
    return this.get(sessionId).filter((m) =>
      String(m.content).toLowerCase().includes(q)
    );
  }

  // NEW: list all active session ids
  listSessionIds() {
    return [...this.sessions.keys()];
  }

  // NEW: remove sessions with no activity in maxAgeMs (default 7 days)
  pruneOldSessions(maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
    const now = Date.now();
    let removed = 0;
    for (const [sid, msgs] of this.sessions) {
      const last = msgs.at(-1);
      if (!last || now - Date.parse(last.timestamp) > maxAgeMs) {
        this.sessions.delete(sid);
        removed++;
      }
    }
    if (removed) this._save();
    return removed;
  }

  info() {
    return {
      name: "AI Memory",
      version: "1.1.0",
      sessions: this.sessions.size,
      maxMessages: this.maxMessages,
      persist: this.persist,
    };
  }
}
