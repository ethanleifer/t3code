import { useState, type RefObject } from "react";
import { ArrowUpRightIcon, FileCodeIcon, MessageSquareIcon } from "lucide-react";
import { randomUUID } from "../../lib/utils";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { ComposerBanner } from "../chat/ComposerBanner";
import { AreaArtifact } from "./AreaArtifact";
import { createAreaArtifact } from "./areaArtifactTemplate";
import type { SidebarThreadSummary } from "../../types";
import {
  workstreamState,
  WORKSTREAM_LABELS,
  type PreviewArea,
  type AreaWorkstream,
} from "./areasPreview";

export function AreaLead({
  area,
  needsYou,
  onUpdate,
  onOpen,
  composerRef,
  wide,
  threads,
  onOpenOverview,
  onAttach,
  onManage,
}: {
  area: PreviewArea;
  needsYou: readonly AreaWorkstream[];
  onUpdate: (update: (current: PreviewArea) => PreviewArea) => void;
  onOpen: (id: string) => void;
  composerRef: RefObject<HTMLTextAreaElement | null>;
  wide: boolean;
  threads: readonly SidebarThreadSummary[];
  onOpenOverview: () => void;
  onAttach: () => void;
  onManage: () => void;
}) {
  const [note, setNote] = useState("");
  const addSummary = () => {
    const text = needsYou.length
      ? `Needs your attention: ${needsYou.map((stream) => `${stream.title}: ${stream.nextAction}`).join("\n\n")}`
      : "Nothing is marked as needing you. Use the overview to give the next workstream a clear outcome.";
    onUpdate((current) => ({
      ...current,
      messages: [...current.messages, { id: randomUUID(), role: "lead", text }],
    }));
  };
  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col" aria-label="Area lead conversation">
      <div className="shrink-0 border-b border-border/60 px-4 py-2 sm:px-6">
        <div className="mx-auto w-full max-w-(--chat-content-max-width)">
          {wide ? (
            <button
              type="button"
              aria-label="Show overview artifact"
              onClick={onOpenOverview}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-left text-xs outline-none hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <FileCodeIcon className="size-4 text-icon-muted" />
              <span className="flex-1">Overview</span>
              <span className="text-2xs text-muted-foreground">Open alongside</span>
              <ArrowUpRightIcon className="size-3.5 text-icon-muted" />
            </button>
          ) : (
            <AreaArtifact
              html={area.artifactHtml ?? createAreaArtifact(area)}
              onSave={(artifactHtml) => onUpdate((current) => ({ ...current, artifactHtml }))}
            />
          )}
        </div>
      </div>
      <div
        className="scrollbar-gutter-both min-h-0 flex-1 overflow-y-auto px-4 sm:px-6"
        aria-label="Lead messages"
      >
        <div className="mx-auto flex w-full max-w-(--chat-content-max-width) flex-col gap-6 py-6">
          <header className="space-y-2">
            <h1 className="flex items-center gap-2 text-base font-medium">
              <MessageSquareIcon className="size-4 text-icon-muted" />
              Area lead
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {area.goal || "Keep the context and decisions for this Area together."}
            </p>
          </header>
          <div className="flex flex-col gap-6" aria-live="polite">
            {area.messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Leave a direction to start this Area’s conversation.
              </p>
            ) : null}
            {area.messages.map((message) => (
              <article
                key={message.id}
                data-role={message.role}
                className="flex flex-col gap-1.5 data-[role=you]:ml-auto data-[role=you]:max-w-[85%] data-[role=you]:rounded-2xl data-[role=you]:bg-message data-[role=you]:px-4 data-[role=you]:py-3"
              >
                <span className="text-2xs text-muted-foreground">
                  {message.role === "you" ? "You" : "Area lead · simulated response"}
                </span>
                <p className="whitespace-pre-wrap text-sm leading-relaxed wrap-anywhere">
                  {message.text}
                </p>
              </article>
            ))}
          </div>
          <section aria-label="Workstream cards" className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs font-medium text-muted-foreground">
                Workstreams · {area.workstreams.length}
              </h2>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost-muted" onClick={onAttach}>
                  Attach thread
                </Button>
                <Button size="sm" variant="ghost-muted" onClick={onManage}>
                  Manage
                </Button>
              </div>
            </div>
            {area.workstreams.map((stream) => {
              const source = stream.source;
              const thread =
                source.kind === "thread"
                  ? threads.find(
                      (item) =>
                        item.environmentId === source.environmentId && item.id === source.threadId,
                    )
                  : undefined;
              const state = workstreamState(stream, thread);
              return (
                <button
                  type="button"
                  key={stream.id}
                  aria-label={`Inspect workstream: ${stream.title}`}
                  onClick={() => onOpen(stream.id)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left outline-none hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <span className="min-w-0 flex-1">
                    <span className="mb-1 flex items-center gap-1.5 text-2xs text-muted-foreground">
                      <span
                        className="size-1.5 rounded-full bg-muted-foreground data-[state=needs-you]:bg-warning data-[state=working]:bg-info data-[state=done]:bg-success"
                        data-state={state}
                      />
                      {source.kind === "thread" && !thread
                        ? "Not loaded"
                        : WORKSTREAM_LABELS[state]}{" "}
                      · {source.kind === "sample" ? "Sample" : "Linked thread"}
                    </span>
                    <span className="block text-sm font-medium">{stream.title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                      {stream.nextAction}
                    </span>
                  </span>
                  <ArrowUpRightIcon className="size-4 shrink-0 text-icon-muted" />
                </button>
              );
            })}
          </section>
        </div>
      </div>
      <div className="shrink-0 px-4 pt-2 pb-4 sm:px-6">
        <form
          className="mx-auto w-full max-w-(--chat-content-max-width)"
          onSubmit={(event) => {
            event.preventDefault();
            const text = note.trim();
            if (!text) return;
            onUpdate((current) => ({
              ...current,
              messages: [...current.messages, { id: randomUUID(), role: "you", text }],
            }));
            setNote("");
          }}
        >
          <ComposerBanner.Root detached density="spacious">
            <Textarea
              ref={composerRef}
              unstyled
              aria-label="Direction for the Area"
              placeholder="Leave a direction or decision…"
              rows={2}
              maxLength={6000}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <Button size="sm" variant="ghost-muted" type="button" onClick={addSummary}>
                What needs me?
              </Button>
              <Button size="sm" type="submit" disabled={!note.trim()}>
                Save note
              </Button>
            </div>
          </ComposerBanner.Root>
          <p className="mt-2 text-center text-2xs text-muted-foreground">
            Simulated lead · Notes save in this browser · No agents started
          </p>
        </form>
      </div>
    </section>
  );
}
