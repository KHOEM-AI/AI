export class AIMemory {
  constructor({ maxMessages = 50 } = {}) {
    this.maxMessages = maxMessages;
    this.sessions = new Map();
  }

  createSession(sessionId) {
    if (!this.sessions.has(sessionId)) {
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

    return messages.at(-1);
  }

  get(sessionId) {
    return this.sessions.get(sessionId) ?? [];
  }

  clear(sessionId) {
    this.sessions.delete(sessionId);
  }

  info() {
    return {
      name: "AI Memory",
      version: "1.0.0",
      sessions: this.sessions.size,
      maxMessages: this.maxMessages,
    };
  }
}
