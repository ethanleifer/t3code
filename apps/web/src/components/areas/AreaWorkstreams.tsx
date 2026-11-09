import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon, ArrowUpRightIcon, MessageSquareIcon, PlusIcon } from "lucide-react";
import type { SidebarThreadSummary } from "../../types";
import { Button } from "../ui/button";
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "../ui/select";
import {
  WORKSTREAM_STATES,
  WORKSTREAM_LABELS,
  workstreamState,
  type PreviewArea,
  type AreaWorkstream,
} from "./areasPreview";

export function AreaWorkstreams({
  area,
  threads,
  selectedId,
  onOpen,
  onBackToList,
  onBackToLead,
  onAttach,
  onAdd,
  onDelete,
  onUpdate,
}: {
  area: PreviewArea;
  threads: readonly SidebarThreadSummary[];
  selectedId: string | null;
  onOpen: (id: string) => void;
  onBackToList: () => void;
  onBackToLead: () => void;
  onAttach: () => void;
  onAdd: () => void;
  onDelete: () => void;
  onUpdate: (update: (area: PreviewArea) => PreviewArea) => void;
}) {
  const selected = area.workstreams.find((stream) => stream.id === selectedId);
  const findThread = (stream: AreaWorkstream) => {
    const source = stream.source;
    return source.kind === "thread"
      ? threads.find(
          (thread) =>
            thread.environmentId === source.environmentId && thread.id === source.threadId,
        )
      : undefined;
  };
  const detail = selected ? (
    <section
      className="min-w-0 [&_p]:text-xs [&_p]:leading-relaxed"
      aria-label="Workstream details"
    >
      <div className="mb-3 flex items-center justify-between gap-3 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2 [&_h2]:text-xs [&_h2]:font-medium">
        <h2>{selected.title}</h2>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Back to workstreams"
          onClick={onBackToList}
        >
          <ArrowLeftIcon />
        </Button>
      </div>
      <p>{selected.summary}</p>
      {selected.source.kind === "thread" && !findThread(selected) ? (
        <p className="text-xs text-muted-foreground">
          This thread is not loaded. Open the original to reconnect with its context.
        </p>
      ) : null}
      <p className="mt-5 mb-2 text-xs font-medium text-muted-foreground">Next step</p>
      <p>{selected.nextAction}</p>
      <ul className="flex list-inside list-disc flex-col gap-2 py-4 text-xs text-muted-foreground">
        {selected.updates.map((update) => (
          <li key={update}>{update}</li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {selected.source.kind === "sample" ? (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Sample status
            <Select
              value={selected.source.state}
              onValueChange={(value) => {
                const state = WORKSTREAM_STATES.find((item) => item === value);
                if (state)
                  onUpdate((current) => ({
                    ...current,
                    workstreams: current.workstreams.map((stream) =>
                      stream.id === selected.id && stream.source.kind === "sample"
                        ? { ...stream, source: { kind: "sample", state } }
                        : stream,
                    ),
                  }));
              }}
            >
              <SelectTrigger size="compact" aria-label="Workstream status">
                <SelectValue>{WORKSTREAM_LABELS[selected.source.state]}</SelectValue>
              </SelectTrigger>
              <SelectPopup>
                {WORKSTREAM_STATES.map((state) => (
                  <SelectItem value={state} key={state}>
                    {WORKSTREAM_LABELS[state]}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </label>
        ) : (
          <Link
            className="flex items-center gap-1.5 text-xs text-primary underline underline-offset-4"
            to="/$environmentId/$threadId"
            params={{
              environmentId: selected.source.environmentId,
              threadId: selected.source.threadId,
            }}
          >
            Open original thread <ArrowUpRightIcon size={14} />
          </Link>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            onUpdate((current) => ({
              ...current,
              workstreams: current.workstreams.filter((stream) => stream.id !== selected.id),
            }));
            onBackToList();
          }}
        >
          Remove from Area
        </Button>
      </div>
    </section>
  ) : null;
  return (
    <section aria-label="Area workstreams" className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 text-xs font-medium">
          <MessageSquareIcon className="size-3.5 text-icon-muted" />
          {selected ? "Workstream" : `Workstreams · ${area.workstreams.length}`}
        </h2>
        <Button size="sm" variant="ghost-muted" onClick={onBackToLead}>
          Back to lead
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {detail ?? (
          <div className="space-y-2">
            {area.workstreams.length === 0 ? (
              <p className="py-4 text-xs leading-relaxed text-muted-foreground">
                Attach a thread to bring its work into this conversation.
              </p>
            ) : null}
            {area.workstreams.map((stream) => {
              const thread = findThread(stream);
              const state = workstreamState(stream, thread);
              return (
                <button
                  key={stream.id}
                  type="button"
                  aria-label={`Open workstream: ${stream.title}`}
                  onClick={() => onOpen(stream.id)}
                  className="flex w-full cursor-pointer flex-col gap-1.5 rounded-lg border border-border/60 px-3 py-2.5 text-left outline-none hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <span className="flex items-center gap-1.5 text-2xs text-muted-foreground">
                    <span
                      className="size-1.5 rounded-full bg-muted-foreground data-[state=needs-you]:bg-warning data-[state=working]:bg-info data-[state=done]:bg-success"
                      data-state={state}
                    />
                    {stream.source.kind === "thread" && !thread
                      ? "Not loaded"
                      : WORKSTREAM_LABELS[state]}
                    <span className="ml-auto">
                      {stream.source.kind === "sample" ? "Sample" : "Linked"}
                    </span>
                  </span>
                  <span className="text-xs font-medium">{stream.title}</span>
                  <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {stream.nextAction}
                  </span>
                </button>
              );
            })}
            <div className="flex flex-wrap gap-1 pt-2">
              <Button size="sm" variant="outline" onClick={onAttach}>
                Attach thread
              </Button>
              <Button size="sm" variant="ghost-muted" onClick={onAdd}>
                <PlusIcon />
                Add sample
              </Button>
            </div>
          </div>
        )}
      </div>
      <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-border px-4 py-2">
        <span className="text-2xs text-muted-foreground">Saved in this browser</span>
        <Button size="sm" variant="ghost-muted" onClick={onDelete}>
          Delete Area
        </Button>
      </footer>
    </section>
  );
}
