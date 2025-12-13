import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";

export interface Chat {
  id: string;
  name: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  plan?: ProjectPlan;
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

export function useChatsQuery() {
  return useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const res = await apiClient.get<Chat[]>("/chat");
      return res.data;
    },
  });
}

export function useCreateChatMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<Chat>("/chat", {});
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
}

export function useChatMessagesQuery(chatId: string | null) {
  return useQuery({
    queryKey: ["chat", chatId, "messages"],
    enabled: !!chatId,
    queryFn: async () => {
      if (!chatId) return [];
      const res = await apiClient.get<ChatMessage[]>(`/chat/${chatId}/messages`);
      return res.data;
    },
  });
}

export function useSendMessageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      chatId,
      content,
    }: {
      chatId: string;
      content: string;
    }) => {
      const res = await apiClient.post<{
        userMessage: ChatMessage;
        assistantMessage: ChatMessage;
      }>(`/chat/${chatId}/messages`, { content });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["chat", variables.chatId, "messages"],
      });
    },
  });
}
