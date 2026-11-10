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
  const area = store.areas.find((item) => item.id === areaId);
  const updateArea = (update: (current: PreviewArea) => PreviewArea) =>
    setStore((current) => ({
      ...current,
      areas: current.areas.map((item) => (item.id === areaId ? update(item) : item)),
    }));
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
          Local Area context · Not shared with the agent
        </p>
        <div className="flex flex-wrap items-center justify-between gap-1">
          <Button
            size="sm"
            variant="ghost-muted"
            onClick={() => {
              setView(view === "overview" ? "workstreams" : "overview");
              setSelectedId(null);
            }}
          >
            {view === "overview" ? `Workstreams · ${area.workstreams.length}` : "Overview"}
          </Button>
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
        {view === "overview" ? (
          <AreaArtifact
            key={area.id}
            variant="pane"
            html={area.artifactHtml ?? createAreaArtifact(area)}
            onSave={(artifactHtml) => updateArea((current) => ({ ...current, artifactHtml }))}
          />
        ) : (
          <AreaWorkstreams
            area={area}
            threads={threads}
            selectedId={selectedId}
            onOpen={setSelectedId}
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
              if (
                window.confirm(
                  `Delete the local Area “${area.name}”? Its conversations will be kept.`,
                )
              )
                setStore((current) => ({
                  ...current,
                  areas: current.areas.filter((item) => item.id !== areaId),
                }));
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
