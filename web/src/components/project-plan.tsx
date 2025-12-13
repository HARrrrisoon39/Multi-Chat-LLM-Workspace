import { useState } from "react";
import { ProjectPlan } from "../data/queries/chat";
import { cn } from "../lib/utils";

export function ProjectPlanPreview({ plan }: { plan: ProjectPlan }) {
  return (
    <div className="w-full rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold">Project Workstreams</h3>
      <div className="flex flex-col gap-2">
        {plan.workstreams.map((ws, idx) => (
          <WorkstreamItem
            key={ws.id}
            workstream={ws}
            index={idx}
          />
        ))}
      </div>
    </div>
  );
}

function WorkstreamItem({
  workstream,
  index,
}: {
  workstream: ProjectPlan["workstreams"][number];
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const label = String.fromCharCode(65 + index); // A, B, C...

  return (
    <div className="rounded-lg border bg-background">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-accent",
          open && "border-b"
        )}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-sm">
          {label}
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-base font-semibold">{workstream.title}</div>
          <div className="text-sm text-muted-foreground">
            {workstream.description}
          </div>
        </div>
        <div className="ml-auto text-xs text-muted-foreground">
          {open ? "▾" : "▸"}
        </div>
      </button>
      {open && (
        <div className="flex flex-col gap-3 px-4 py-3">
          <div className="text-sm font-semibold">Deliverables</div>
          <div className="flex flex-col gap-3">
            {workstream.deliverables.map((d) => (
              <div key={d.id} className="flex flex-col gap-1">
                <div className="text-sm font-semibold">{d.title}</div>
                <div className="text-sm text-muted-foreground">
                  {d.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
