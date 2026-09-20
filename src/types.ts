export type Role = "user" | "assistant";

export interface Message {
  id: string;
  role: Role;
  text: string;
}

export interface ChatRequestMessage {
  role: Role;
  content: string;
}

export interface ChatResponseBody {
  reply: string;
}

export interface ChatErrorBody {
  error: string;
}
