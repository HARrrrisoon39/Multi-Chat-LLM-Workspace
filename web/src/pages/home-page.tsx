import { ChatSidebar } from "../components/chat-sidebar";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChatInputBox } from "../components/chat-input-box";
import { AssistantLoadingIndicator, MessageBody, MessageContainer } from "../components/message";
import { ChatMessage } from "../data/queries/chat";
import {
  useChatMessagesQuery,
  useChatsQuery,
  useCreateChatMutation,
  useSendMessageMutation,
} from "../data/queries/chat";
import Spinner from "../components/ui/spinner";

export function HomePage() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(() => {
    return localStorage.getItem("selectedChatId");
  });

  const chatsQuery = useChatsQuery();
  const createChatMutation = useCreateChatMutation();
  const messagesQuery = useChatMessagesQuery(selectedChatId);
  const sendMessageMutation = useSendMessageMutation();

  useEffect(() => {
    if (selectedChatId) {
      localStorage.setItem("selectedChatId", selectedChatId);
    } else {
      localStorage.removeItem("selectedChatId");
    }
  }, [selectedChatId]);

  const chats = chatsQuery.data ?? [];
  const selectedChat = useMemo(
    () => chats.find((c) => c.id === selectedChatId) ?? null,
    [chats, selectedChatId]
  );

  useEffect(() => {
    if (!selectedChatId && chats.length > 0) {
      setSelectedChatId(chats[0].id);
    }
    if (selectedChatId && !chats.find((c) => c.id === selectedChatId)) {
      setSelectedChatId(chats[0]?.id ?? null);
    }
  }, [chats, selectedChatId]);

  const handleCreateChat = async () => {
    const chat = await createChatMutation.mutateAsync();
    setSelectedChatId(chat.id);
  };

  const handleSend = async (message: string) => {
    if (!selectedChatId) {
      const chat = await createChatMutation.mutateAsync();
      setSelectedChatId(chat.id);
      await sendMessageMutation.mutateAsync({ chatId: chat.id, content: message });
      return;
    }
    await sendMessageMutation.mutateAsync({ chatId: selectedChatId, content: message });
  };

  return (
    <div className={"flex flex-col items-center"}>
      <ChatSidebar
        chats={chats}
        selectedChatId={selectedChatId}
        onSelectChat={setSelectedChatId}
        onCreateChat={handleCreateChat}
      />
      <div className={"flex flex-col pt-8 max-w-4xl ms-64 w-full"}>
        <ChatWindow
          chatName={selectedChat?.name ?? "New Chat"}
          messages={messagesQuery.data ?? []}
          isLoadingMessages={messagesQuery.isPending}
          onSend={handleSend}
          sending={sendMessageMutation.isPending}
          hasChat={!!selectedChatId || chats.length > 0}
        />
      </div>
    </div>
  );
}

function ChatWindow({
  chatName,
  messages,
  isLoadingMessages,
  onSend,
  sending,
  hasChat,
}: {
  chatName: string;
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  onSend: (message: string) => void;
  sending: boolean;
  hasChat: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  return (
    <div className={"flex flex-col gap-4"}>
      <h2>{chatName}</h2>
      {isLoadingMessages && <Spinner />}
      {!hasChat && <div className={"text-muted-foreground"}>Create a chat to get started.</div>}
      {messages.map((message) => (
        <MessageContainer role={message.role} key={message.id}>
          <MessageBody message={message as any} />
        </MessageContainer>
      ))}
      {sending && <AssistantLoadingIndicator />}
      <ChatInputBox onSend={onSend} disabled={sending} isLoading={sending} />
      <div ref={bottomRef} />
    </div>
  );
}
