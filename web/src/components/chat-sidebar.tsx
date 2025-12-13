import {Button} from "./ui/button";
import {MessagesSquareIcon, PlusIcon} from "lucide-react";

interface ChatReference {
  name: string;
  id: string;
}

interface Props {
  onCreateChat?: () => void;
  chats: ChatReference[];
  onSelectChat?: (chatId: string) => void;
  selectedChatId: string | null;
}

export function ChatSidebar(props: Props) {
  const { chats, selectedChatId } = props;
  return <div className={"flex flex-col border-r-accent border-r-2 h-full w-64 fixed left-0 top-16 bottom-0 p-4 gap-3"}>
    <Button onClick={props.onCreateChat} size={"sm"}>
      <PlusIcon className={"w-5 h-5"}/>
      New Chat
    </Button>
    <hr />
    <div className={"flex flex-col gap-1 overflow-y-auto"}>
      { chats.map((chat => (
          <div key={chat.id}>
            <Button
              variant={selectedChatId === chat.id ? "secondary" : "ghost"}
              size={"sm"}
              className={"w-full text-left justify-start"}
              onClick={() => props.onSelectChat?.(chat.id)}
            >
              <MessagesSquareIcon className={"w-5 h-5 me-2"}/>
              { chat.name }
            </Button>
          </div>
      )))}
    </div>
  </div>
}