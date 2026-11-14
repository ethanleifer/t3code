import { useAreaCoordination } from "./useAreaCoordination";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { ScopedThreadRef } from "@t3tools/contracts";
import { useThreadShells } from "../../state/entities";
import { Button } from "../ui/button";
import { AreaArtifact } from "./AreaArtifact";
import { AreaWorkstreams } from "./AreaWorkstreams";
import { AreaThreadPicker } from "./AreaThreadPicker";
import { AreaEditor } from "./AreaEditor";
import { createAreaArtifact } from "./areaArtifactTemplate";
import { attachAreaThread, type PreviewArea } from "./areasPreview";
import { useAreasPreview, useOpenAreaConversation } from "./useAreasPreview";
import { randomUUID } from "../../lib/utils";

export function AreaPanel({ areaId, threadRef }: { areaId: string; threadRef: ScopedThreadRef }) {
  const [store, setStore] = useAreasPreview();
  const [view, setView] = useState<"overview" | "workstreams">("overview");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [attaching, setAttaching] = useState(false);
  const [adding, setAdding] = useState(false);
  const threads = useThreadShells();
  const navigate = useNavigate();
  const openConversation = useOpenAreaConversation();
  const local = store.areas.find((item) => item.id === areaId);
  const coordination = useAreaCoordination(local, threadRef);
  const shared = coordination.shared;
  const children = local?.leadThread
    ? threads.filter(
        (thread) =>
          (thread.environmentId === local.leadThread?.environmentId &&
            thread.lineage.parentThreadId === local.leadThread.threadId &&
            thread.lineage.relationshipToParent === "subagent") ||
          (thread.delegatedFrom?.environmentId === local.leadThread?.environmentId &&
            thread.delegatedFrom?.threadId === local.leadThread?.threadId),
      )
    : [];
  const area =
    local && shared
      ? {
          ...local,
          name: shared.name,
          goal: shared.goal,
          brief: shared.brief,
          artifactHtml: shared.artifactHtml,
        }
      : local;
  const linkedIds = new Set(
    area?.workstreams.flatMap((stream) =>
      stream.source.kind === "thread"
        ? [`${stream.source.environmentId}:${stream.source.threadId}`]
        : [],
    ),
  );
  const liveArea = area
    ? {
        ...area,
        workstreams: [
          ...area.workstreams.filter((stream) => !shared || stream.source.kind === "thread"),
          ...children
            .filter((thread) => !linkedIds.has(`${thread.environmentId}:${thread.id}`))
            .map((thread) => ({
              id: `thread:${thread.environmentId}:${thread.id}`,
              title: thread.title,
              summary: "",
              nextAction: "",
              updates: [],
              source: {
                kind: "thread" as const,
                environmentId: thread.environmentId,
                threadId: thread.id,
              },
            })),
        ],
      }
    : undefined;
  const updateArea = async (update: (current: PreviewArea) => PreviewArea) => {
    if (!area) return false;
    const next = update(area);
    if (shared && !(await coordination.save(next))) return false;
    setStore((current) => ({
      ...current,
      areas: current.areas.map((item) => (item.id === areaId ? next : item)),
    }));
    return true;
  };
  if (!area)
    return (
      <div className="space-y-3 p-4">
        <p className="text-sm text-muted-foreground">
          This Area is no longer available in this browser.
        </p>
        <Button size="sm" variant="outline" onClick={() => void navigate({ to: "/areas" })}>
          Manage Areas
        </Button>
      </div>
    );
  const lead = area.leadThread;
  const showingLead =
    lead?.environmentId === threadRef.environmentId && lead.threadId === threadRef.threadId;
  return (
    <div className="flex h-full min-h-0 flex-col" aria-label="Area context">
      <div className="shrink-0 border-b border-border p-3">
        <p className="mb-2 text-2xs text-muted-foreground">
          {shared
            ? "Shared with the lead and its workstreams"
            : "Local preview · Context is not shared yet"}
        </p>
        {coordination.error ? (
          <p className="mb-2 text-xs text-destructive">{coordination.error}</p>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-1">
          <Button
            size="sm"
            variant="ghost-muted"
            onClick={() => {
              setView(view === "overview" ? "workstreams" : "overview");
              setSelectedId(null);
            }}
          >
            {view === "overview"
              ? `Workstreams · ${liveArea?.workstreams.length ?? 0}`
              : "Overview"}
          </Button>
          {shared ? (
            <Button
              size="sm"
              variant="ghost-muted"
              disabled={coordination.saving || !coordination.canWrite}
              onClick={() =>
                void coordination.disconnect().then((removed) => {
                  if (removed)
                    setStore((current) => ({
                      ...current,
                      areas: current.areas.map((item) =>
                        item.id === areaId ? { ...area, shared: false } : item,
                      ),
                    }));
                })
              }
            >
              Stop sharing
            </Button>
          ) : lead ? (
            <Button
              size="sm"
              variant="outline"
              disabled={coordination.saving || coordination.isPending || !coordination.canWrite}
              onClick={() =>
                void coordination.save(area).then((saved) => {
                  if (saved)
                    setStore((current) => ({
                      ...current,
                      areas: current.areas.map((item) =>
                        item.id === areaId ? { ...item, shared: true } : item,
                      ),
                    }));
                })
              }
            >
              Enable coordination
            </Button>
          ) : null}
          <Button size="sm" variant="ghost-muted" onClick={() => void navigate({ to: "/areas" })}>
            Manage Area
          </Button>
        </div>
        {!showingLead && lead ? (
          <div className="mt-2">
            <Button size="sm" variant="outline" onClick={() => openConversation(area, lead)}>
              Open lead conversation
            </Button>
          </div>
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        {shared && view === "overview" ? (
          <details className="shrink-0 border-b border-border px-4 py-2">
            <summary className="cursor-pointer text-xs text-muted-foreground">Shared brief</summary>
            <form
              className="space-y-2 py-2"
              onSubmit={(event) => {
                event.preventDefault();
                const brief = new FormData(event.currentTarget).get("brief");
                if (typeof brief === "string") updateArea((current) => ({ ...current, brief }));
              }}
            >
              <textarea
                key={shared.revision}
                name="brief"
                aria-label="Shared Area brief"
                defaultValue={area.brief}
                className="min-h-24 w-full rounded border border-input bg-background p-2 text-xs"
              />
              <Button
                size="sm"
                type="submit"
                disabled={coordination.saving || !coordination.canWrite}
              >
                Save brief
              </Button>
            </form>
          </details>
        ) : null}
        {view === "overview" ? (
          <AreaArtifact
            key={area.id}
            title={area.name}
            threadRef={threadRef}
            html={area.artifactHtml ?? createAreaArtifact(area)}
            onSave={(artifactHtml) => updateArea((current) => ({ ...current, artifactHtml }))}
          />
        ) : (
          <AreaWorkstreams
            area={liveArea ?? area}
            threads={[...threads, ...children]}
            selectedId={selectedId}
            onOpen={(id) => {
              const stream = liveArea?.workstreams.find((item) => item.id === id);
              if (stream?.source.kind === "thread") openConversation(area, stream.source);
              else setSelectedId(id);
            }}
            onBackToList={() => setSelectedId(null)}
            onBackToLead={() => {
              setView("overview");
              setSelectedId(null);
              if (lead && !showingLead) openConversation(area, lead);
            }}
            onAttach={() => setAttaching(true)}
            onAdd={() => setAdding(true)}
            onUpdate={updateArea}
            onDelete={() => {
              if (window.confirm(`Delete the Area “${area.name}”? Its conversations will be kept.`))
                void (async () => {
                  if (shared && !(await coordination.disconnect())) return;
                  setStore((current) => ({
                    ...current,
                    areas: current.areas.filter((item) => item.id !== areaId),
                  }));
                })();
            }}
          />
        )}
      </div>
      {view === "overview" && area.messages.length > 0 ? (
        <details className="shrink-0 border-t border-border px-4 py-2">
          <summary className="cursor-pointer text-2xs text-muted-foreground">
            Saved prototype notes
          </summary>
          <div className="max-h-40 space-y-3 overflow-y-auto pt-3">
            {area.messages.map((message) => (
              <p
                key={message.id}
                className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground"
              >
                {message.text}
              </p>
            ))}
          </div>
        </details>
      ) : null}
      {attaching ? (
        <AreaThreadPicker
          kind="workstream"
          onClose={() => setAttaching(false)}
          onSelect={(ref, title) => {
            updateArea((current) => attachAreaThread(current, ref, title));
            setAttaching(false);
          }}
        />
      ) : null}
      {adding ? (
        <AreaEditor
          kind="workstream"
          onClose={() => setAdding(false)}
          onSave={(title, summary) => {
            const id = randomUUID();
            updateArea((current) => ({
              ...current,
              workstreams: [
                ...current.workstreams,
                {
                  id,
                  title,
                  summary,
                  nextAction: "Define the next step for this sample.",
                  updates: [],
                  source: { kind: "sample", state: "working" },
                },
              ],
            }));
            setAdding(false);
            setSelectedId(id);
          }}
        />
      ) : null}
    </div>
  );
}
