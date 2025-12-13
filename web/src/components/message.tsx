import React from "react";
import { cn } from "../lib/utils";
import Spinner from "./ui/spinner";
import { BotIcon, UserIcon } from "lucide-react";
import { ProjectPlan } from "../data/queries/chat";
import { ProjectPlanPreview } from "./project-plan";

export type Message = {
  role: "user" | "assistant";
  content: string;
  plan?: ProjectPlan;
};

export function MessageContainer({ role, children }: React.PropsWithChildren<{ role: Message["role"] }>) {
    return (
        <div className={cn("flex flex-col gap-2", role === "user" ? "items-end" : "items-start")}>
            <div
                className={
                    "flex flex-row items-center gap-1 rounded-full bg-accent py-1.5 pe-3 ps-1.5 text-xs font-semibold"
                }
            >
                {role === "assistant" && <BotIcon className={"me-1 inline-block h-4 w-4"} />}
                {role === "user" && <UserIcon className={"me-1 inline-block h-4 w-4"} />}
                {role === "user" ? "You" : "Assistant"}
            </div>
            <div className={cn(role === "user" ? "pe-2 ps-16" : "flex w-full flex-col items-start pe-16 ps-2")}>
                {children}
            </div>
        </div>
    );
}

export function AssistantLoadingIndicator() {
    return (
        <MessageContainer role={"assistant"}>
            <div
                className={
                    "flex flex-row items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-muted-foreground"
                }
            >
                <Spinner />
                Working on it...
            </div>
        </MessageContainer>
    );
}

export function MessageBody({ message }: { message: Message }) {
  if (!message.plan) {
    return <div className="whitespace-pre-wrap">{message.content}</div>;
  }

  const plan = message.plan;
  const segments = message.content.split("{{PLAN}}");

  return (
    <div className="flex w-full flex-col gap-3">
      {segments.map((segment, idx) => (
        <React.Fragment key={idx}>
          {segment.trim().length > 0 && (
            <div className="whitespace-pre-wrap">{segment}</div>
          )}
          {idx < segments.length - 1 && <ProjectPlanPreview plan={plan} />}
        </React.Fragment>
      ))}
      {segments.length === 1 && <ProjectPlanPreview plan={plan} />}
    </div>
  );
}
