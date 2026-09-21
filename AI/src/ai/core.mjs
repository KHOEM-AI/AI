import { khoemReply } from "./khoem.mjs";
import { AIMemory } from "./memory.mjs";

const AI_NAME = "𝒦𝒽𝑜𝓮𝓂 𝒮𝑜𝓀𝓈𝒾𝓋𝓊𝓉𝒽𝒶 AI";

export class AICore {
  constructor({
    provider = "khoem",
    model = "khoem-local",
    memory = new AIMemory(),
  } = {}) {
    this.provider = provider;
    this.model = model;
    this.memory = memory;
  }

  info() {
    return {
      name: AI_NAME,
      version: "1.0.0",
      provider: this.provider,
      model: this.model,
      capabilities: [
        "chat",
        "conversation",
        "memory-ready",
        "tools-ready",
        "provider-routing",
      ],
    };
  }

  async chat(messages, { sessionId = "default", honorific } = {}) {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error("messages must contain at least one message");
    }

    for (const message of messages) {
      this.memory.add(sessionId, message);
    }

    const conversation = this.memory.get(sessionId);

    if (this.provider === "khoem") {
      const reply = await khoemReply(conversation);
      this.memory.add(sessionId, { role: "assistant", content: reply });
      return {
        reply,
        provider: this.provider,
        model: "khoem-local",
        sessionId,
        memoryMessages: this.memory.get(sessionId).length,
      };
    }

    throw new Error(`Unsupported provider: ${this.provider}`);
  }
}
