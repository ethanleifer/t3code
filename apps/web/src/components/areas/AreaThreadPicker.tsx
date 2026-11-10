import { useState } from "react";
import type { ScopedThreadRef } from "@t3tools/contracts";
import { useProjects, useThreadShells } from "../../state/entities";
import { Input } from "../ui/input";
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";

export function AreaThreadPicker({
  kind,
  onSelect,
  onClose,
}: {
  kind: "lead" | "workstream";
  onSelect: (ref: ScopedThreadRef, title: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const threads = useThreadShells();
  const projects = useProjects();
  const matches = threads.filter((thread) =>
    thread.title.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>
            {kind === "lead" ? "Choose the lead conversation" : "Attach a workstream"}
          </DialogTitle>
          <DialogDescription>
            {kind === "lead"
              ? "Use an existing T3 conversation. Choosing one opens its normal chat without starting an agent."
              : "Link an existing thread. Its conversation stays unchanged."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 px-6 pb-6">
          <Input
            autoFocus
            aria-label="Search conversations"
            placeholder="Search conversations…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="max-h-80 overflow-y-auto">
            {matches.map((thread) => (
              <button
                type="button"
                key={`${thread.environmentId}:${thread.id}`}
                onClick={() =>
                  onSelect(
                    { environmentId: thread.environmentId, threadId: thread.id },
                    thread.title,
                  )
                }
                className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-2.5 text-left outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm">{thread.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {projects.find(
                      (project) =>
                        project.environmentId === thread.environmentId &&
                        project.id === thread.projectId,
                    )?.title ?? "Project unavailable"}
                  </span>
                </span>
                <span className="shrink-0 text-2xs text-muted-foreground">
                  {kind === "lead" ? "Use as lead" : "Attach"}
                </span>
              </button>
            ))}
            {matches.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                No matching loaded conversations.
              </p>
            ) : null}
          </div>
        </div>
      </DialogPopup>
    </Dialog>
  );
}
