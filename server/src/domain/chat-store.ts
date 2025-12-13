import { randomUUID } from "node:crypto";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  plan?: ProjectPlan;
}

export interface ChatReference {
  id: string;
  name: string;
  createdAt: string;
}

interface ChatRecord {
  chat: ChatReference;
  messages: ChatMessage[];
}

export interface ProjectPlanDeliverable {
  id: string;
  title: string;
  description: string;
}

export interface ProjectPlanWorkstream {
  id: string;
  title: string;
  description: string;
  deliverables: ProjectPlanDeliverable[];
}

export interface ProjectPlan {
  workstreams: ProjectPlanWorkstream[];
}

type UserChatStore = Map<string, ChatRecord>;

const chatStore: Map<string, UserChatStore> = new Map();

function getUserStore(userId: string): UserChatStore {
  if (!chatStore.has(userId)) {
    chatStore.set(userId, new Map());
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return chatStore.get(userId)!;
}

export function listChats(userId: string): ChatReference[] {
  return Array.from(getUserStore(userId).values()).map((entry) => entry.chat);
}

export function createChat(userId: string, name?: string): ChatReference {
  const userStore = getUserStore(userId);
  const chatId = randomUUID();
  const chatName =
    name || `Chat ${userStore.size === 0 ? 1 : userStore.size + 1}`;
  const chat: ChatReference = {
    id: chatId,
    name: chatName,
    createdAt: new Date().toISOString(),
  };
  userStore.set(chatId, { chat, messages: [] });
  return chat;
}

export function getChatMessages(
  userId: string,
  chatId: string
): ChatMessage[] | null {
  const chat = getUserStore(userId).get(chatId);
  if (!chat) return null;
  return chat.messages;
}

export function appendMessage(
  userId: string,
  chatId: string,
  role: ChatRole,
  content: string,
  plan?: ProjectPlan
): ChatMessage | null {
  const userStore = getUserStore(userId);
  const chat = userStore.get(chatId);
  if (!chat) return null;

  const message: ChatMessage = {
    id: randomUUID(),
    role,
    content,
    createdAt: new Date().toISOString(),
    ...(plan ? { plan } : {}),
  };
  chat.messages.push(message);
  return message;
}
