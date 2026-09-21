import { useEffect, useState } from "react";
import type { ChatErrorBody, ChatResponseBody, Message } from "../types";
import { loadMessages, saveMessages } from "../storage";

function makeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function useChat(honorific: string | null) {
  const [messages, setMessages] = useState<Message[]>(() => loadMessages());
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const userMessage: Message = { id: makeId(), role: "user", text: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setIsSending(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.text })),
          honorific: honorific ?? undefined,
        }),
      });

      if (!res.ok) {
        const body: Partial<ChatErrorBody> = await res.json().catch(() => ({}));
        throw new Error(body.error || `សំណើមិនជោគជ័យ (${res.status})`);
      }

      const data: ChatResponseBody = await res.json();
      setMessages((prev) => [...prev, { id: makeId(), role: "assistant", text: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "មានបញ្ហាមិនស្គាល់មូលហេតុកើតឡើង");
    } finally {
      setIsSending(false);
    }
  }

  function clearConversation() {
    setMessages([]);
    setError(null);
  }

  return { messages, isSending, error, sendMessage, clearConversation };
}
