import { khoemReply } from "./khoem.mjs";
import { AIMemory } from "./memory.mjs";

const AI_NAME = "𝒦𝒽𝑜𝓮𝓂 𝒮𝑜𝓀𝓈𝒾𝓋𝓊𝓉𝒽𝒶 AI";

export class AICore {
  constructor({
    provider = "anthropic",
    model = "claude-sonnet-4-5",
    apiKey = process.env.ANTHROPIC_API_KEY,
    memory = new AIMemory(),
  } = {}) {
    this.provider = provider;
    this.model = model;
    this.apiKey = apiKey;
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

  async chat(messages, { sessionId = "default" } = {}) {
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

    if (this.provider !== "anthropic") {
      throw new Error(`Unsupported provider: ${this.provider}`);
    }

    if (!this.apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        messages: conversation.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    const detail = await response.text();

    let data = null;
    try {
      data = JSON.parse(detail);
    } catch {}

    if (!response.ok) {
      const error = new Error(
        data?.error?.message || `Anthropic API error (${response.status})`
      );
      error.status = response.status;
      error.provider = this.provider;
      throw error;
    }

    const reply =
      data?.content?.find((block) => block.type === "text")?.text ?? "";

    this.memory.add(sessionId, {
      role: "assistant",
      content: reply,
    });

    return {
      reply,
      provider: this.provider,
      model: this.model,
      sessionId,
      memoryMessages: this.memory.get(sessionId).length,
    };
  }
}
