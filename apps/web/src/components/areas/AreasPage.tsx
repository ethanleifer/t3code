import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRightIcon, BoxesIcon, PlusIcon, XIcon } from "lucide-react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useThreadShells } from "../../state/entities";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { AreaLead } from "./AreaLead";
import { WorkspacePageHeader } from "../WorkspacePageHeader";
import {
  WorkspaceBreadcrumb,
  WorkspaceBreadcrumbItem,
  WorkspaceBreadcrumbSeparator,
} from "../WorkspaceBreadcrumb";
import { isElectron } from "../../env";
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "../ui/select";
import { ToggleGroup, Toggle } from "../ui/toggle-group";
import { SidebarInset } from "../ui/sidebar";
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { AreaArtifact } from "./AreaArtifact";
import { createAreaArtifact } from "./areaArtifactTemplate";
import { AreaEditor } from "./AreaEditor";
import {
  AREAS_PREVIEW_STORAGE_KEY,
  AreasPreviewState,
  INITIAL_AREAS,
  WORKSTREAM_STATES,
  WORKSTREAM_LABELS,
  attachAreaThread,
  workstreamState,
  type PreviewArea,
  type AreaWorkstream,
} from "./areasPreview";
import { cn, randomUUID } from "../../lib/utils";

const VIEWS = ["Overview", "Conversation", "Board"] as const;
type View = (typeof VIEWS)[number];

export function AreasPage() {
  const [store, setStore] = useLocalStorage(
    AREAS_PREVIEW_STORAGE_KEY,
    INITIAL_AREAS,
    AreasPreviewState,
  );
  const [view, setView] = useState<View>("Overview");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<"area" | "workstream" | null>(null);
  const [attaching, setAttaching] = useState(false);
  const [search, setSearch] = useState("");
  const threads = useThreadShells();
  const area = store.areas.find((item) => item.id === store.selectedAreaId) ?? store.areas[0];
  const updateArea = (update: (current: PreviewArea) => PreviewArea) => {
    if (!area) return;
    setStore((current) => ({
      ...current,
      areas: current.areas.map((item) => (item.id === area.id ? update(item) : item)),
    }));
  };
  const findThread = (stream: AreaWorkstream) => {
    const source = stream.source;
    return source.kind === "thread"
      ? threads.find(
          (thread) =>
            thread.environmentId === source.environmentId && thread.id === source.threadId,
        )
      : undefined;
  };
  const stateOf = (stream: AreaWorkstream) => workstreamState(stream, findThread(stream));
  const selected = area?.workstreams.find((stream) => stream.id === selectedId);
  const needsYou = area?.workstreams.filter((stream) => stateOf(stream) === "needs-you") ?? [];
  const saveEditor = (name: string, text: string) => {
    if (editor === "area") {
      const id = randomUUID();
      setStore((current) => ({
        selectedAreaId: id,
        areas: [
          ...current.areas,
          { id, name, goal: text, brief: text, messages: [], workstreams: [] },
        ],
      }));
      setSelectedId(null);
    } else {
      const id = randomUUID();
      updateArea((current) => ({
        ...current,
        workstreams: [
          ...current.workstreams,
          {
            id,
            title: name,
            summary: text,
            nextAction: "Define the next step for this workstream.",
            updates: ["Added to this Area preview."],
            source: { kind: "sample", state: "working" },
          },
        ],
      }));
      setSelectedId(id);
    }
    setEditor(null);
  };
  const cards = (streams: readonly AreaWorkstream[]) =>
    streams.map((stream) => {
      const state = stateOf(stream);
      return (
        <button
          type="button"
          key={stream.id}
          className="group flex w-full cursor-pointer flex-col gap-1.5 rounded-md border border-border/60 bg-background px-3 py-2.5 text-left outline-none hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring data-[selected=true]:border-ring/50 data-[selected=true]:bg-accent/50"
          data-selected={selectedId === stream.id}
          onClick={() => setSelectedId(stream.id)}
        >
          <span className="flex flex-wrap items-center gap-1.5 text-3xs text-muted-foreground">
            <span
              className="inline-block size-1.5 shrink-0 rounded-full bg-muted-foreground data-[state=needs-you]:bg-warning data-[state=working]:bg-info data-[state=done]:bg-success"
              data-state={state}
            />
            {stream.source.kind === "thread" && !findThread(stream)
              ? "Not loaded"
              : WORKSTREAM_LABELS[state]}
            <span className="ml-auto">
              {stream.source.kind === "sample" ? "Sample" : "Linked thread"}
            </span>
          </span>
          <strong className="text-xs font-medium leading-relaxed">{stream.title}</strong>
          <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {stream.summary || "Add context in the workstream details."}
          </span>
          <span className="mt-1 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground [&_svg]:mt-0.5 [&_svg]:shrink-0">
            {stream.nextAction}
            <ArrowUpRightIcon size={14} />
          </span>
        </button>
      );
    });
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
          aria-label="Close workstream details"
          onClick={() => setSelectedId(null)}
        >
          <XIcon />
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
                  updateArea((current) => ({
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
            updateArea((current) => ({
              ...current,
              workstreams: current.workstreams.filter((stream) => stream.id !== selected.id),
            }));
            setSelectedId(null);
          }}
        >
          Remove from Area
        </Button>
      </div>
    </section>
  ) : null;
  const lead = area ? (
    <AreaLead
      key={area.id}
      area={area}
      needsYou={needsYou}
      onUpdate={updateArea}
      onOpen={setSelectedId}
    />
  ) : null;
  return (
    <SidebarInset className="h-dvh min-h-0 overflow-hidden">
      <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
        <WorkspacePageHeader electron={isElectron} className="border-b border-border bg-background">
          <div className="[-webkit-app-region:no-drag] flex min-w-0 flex-1 items-center gap-2">
            <WorkspaceBreadcrumb ariaLabel="Areas breadcrumb">
              <WorkspaceBreadcrumbItem>
                <BoxesIcon className="size-4" />
                <span className="ml-2">Areas</span>
              </WorkspaceBreadcrumbItem>
              {area ? (
                <>
                  <WorkspaceBreadcrumbSeparator />
                  <WorkspaceBreadcrumbItem current>
                    <Select
                      value={area.id}
                      onValueChange={(id) => {
                        if (id !== null) {
                          setStore((current) => ({ ...current, selectedAreaId: id }));
                          setSelectedId(null);
                        }
                      }}
                    >
                      <SelectTrigger variant="ghost" size="compact" aria-label="Choose Area">
                        <SelectValue>{area.name}</SelectValue>
                      </SelectTrigger>
                      <SelectPopup>
                        {store.areas.map((item) => (
                          <SelectItem value={item.id} key={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectPopup>
                    </Select>
                  </WorkspaceBreadcrumbItem>
                </>
              ) : null}
            </WorkspaceBreadcrumb>
          </div>
          <div className="[-webkit-app-region:no-drag] flex shrink-0 items-center gap-2">
            <Badge variant="secondary" size="sm">
              Preview
            </Badge>
            <Button
              size="icon-sm"
              variant="ghost-muted"
              aria-label="New Area"
              onClick={() => setEditor("area")}
            >
              <PlusIcon />
            </Button>
          </div>
        </WorkspacePageHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-6">
          {area ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                <h1 className="sr-only">{area.name}</h1>
                <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
                  {area.goal || "Give this work a direction on the canvas."}
                </p>
                {needsYou.length > 0 ? (
                  <Badge variant="warning" size="sm">
                    {needsYou.length} need you
                  </Badge>
                ) : null}
              </div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                <ToggleGroup
                  aria-label="Area view"
                  value={[view]}
                  onValueChange={(values) => {
                    const next = VIEWS.find((item) => item === values[0]);
                    if (next) setView(next);
                  }}
                >
                  {VIEWS.map((item) => (
                    <Toggle key={item} value={item}>
                      {item}
                    </Toggle>
                  ))}
                </ToggleGroup>
                <span className="text-2xs text-muted-foreground">
                  Local preview · No agents started
                </span>
              </div>
              <div
                className={cn(
                  "grid items-start gap-5",
                  view === "Board"
                    ? "grid-cols-1"
                    : "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px]",
                )}
                data-view={view}
              >
                <section
                  className="min-w-0"
                  aria-label={view === "Conversation" ? "Lead conversation" : "Area overview"}
                >
                  {view === "Conversation" ? (
                    lead
                  ) : (
                    <>
                      {view === "Overview" ? (
                        <AreaArtifact
                          key={area.id}
                          html={area.artifactHtml ?? createAreaArtifact(area)}
                          onSave={(artifactHtml) =>
                            updateArea((current) => ({ ...current, artifactHtml }))
                          }
                        />
                      ) : null}
                      <div className="mb-3 flex items-center justify-between gap-3 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2 [&_h2]:text-xs [&_h2]:font-medium">
                        <h2>
                          {view === "Board" ? "Workstream board" : "Workstreams"}
                          <span className="text-xs text-muted-foreground">
                            {area.workstreams.length}
                          </span>
                        </h2>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSearch("");
                              setAttaching(true);
                            }}
                          >
                            Attach thread
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditor("workstream")}
                          >
                            <PlusIcon />
                            Add sample
                          </Button>
                        </div>
                      </div>
                      {view === "Board" ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          {WORKSTREAM_STATES.map((state) => (
                            <section
                              className="flex min-h-40 flex-col gap-2 rounded-lg bg-muted/30 p-2 [&_h3]:mb-1 [&_h3]:flex [&_h3]:items-center [&_h3]:gap-2 [&_h3]:px-1 [&_h3]:text-xs [&_h3]:font-medium"
                              key={state}
                            >
                              <h3>
                                <span
                                  className="inline-block size-1.5 shrink-0 rounded-full bg-muted-foreground data-[state=needs-you]:bg-warning data-[state=working]:bg-info data-[state=done]:bg-success"
                                  data-state={state}
                                />
                                {WORKSTREAM_LABELS[state]}
                                <span className="text-xs text-muted-foreground">
                                  {
                                    area.workstreams.filter((stream) => stateOf(stream) === state)
                                      .length
                                  }
                                </span>
                              </h3>
                              {cards(
                                area.workstreams.filter((stream) => stateOf(stream) === state),
                              )}
                            </section>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                          {cards(area.workstreams)}
                        </div>
                      )}
                      {area.workstreams.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 px-5 py-12 text-center text-muted-foreground [&_p]:max-w-sm [&_p]:text-sm [&_p]:leading-relaxed [&_h3]:text-sm [&_h3]:font-medium [&_h3]:text-foreground">
                          <BoxesIcon size={28} />
                          <h3>Start with one outcome</h3>
                          <p>
                            Attach a thread you’re already working in, or add a sample to explore
                            how an Area feels.
                          </p>
                        </div>
                      ) : null}
                    </>
                  )}
                </section>
                <aside
                  className="flex min-w-0 flex-col gap-3 border-t border-border pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-5"
                  aria-label={view === "Conversation" ? "Workstream context" : "Preview lead"}
                >
                  {selected ? (
                    detail
                  ) : view === "Conversation" ? (
                    <>
                      <div className="mb-3 flex items-center justify-between gap-3 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2 [&_h2]:text-xs [&_h2]:font-medium">
                        <h2>Workstreams</h2>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSearch("");
                            setAttaching(true);
                          }}
                        >
                          Attach
                        </Button>
                      </div>
                      {cards(area.workstreams)}
                      <Button size="sm" variant="outline" onClick={() => setEditor("workstream")}>
                        Add sample workstream
                      </Button>
                    </>
                  ) : (
                    lead
                  )}
                </aside>
              </div>
              <footer className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-3 text-2xs text-muted-foreground">
                Saved in this browser
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Delete the local preview Area “${area.name}”? Your original threads will be kept.`,
                      )
                    ) {
                      setStore((current) => ({
                        ...current,
                        areas: current.areas.filter((item) => item.id !== area.id),
                      }));
                      setSelectedId(null);
                    }
                  }}
                >
                  Delete Area
                </Button>
              </footer>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 px-5 py-12 text-center text-muted-foreground [&_p]:max-w-sm [&_p]:text-sm [&_p]:leading-relaxed [&_h3]:text-sm [&_h3]:font-medium [&_h3]:text-foreground">
              <BoxesIcon size={32} />
              <h1>A home for the bigger picture</h1>
              <p>Create an Area for an ongoing goal, then bring its workstreams together.</p>
              <Button onClick={() => setEditor("area")}>Create an Area</Button>
            </div>
          )}
        </div>
      </div>
      {editor ? (
        <AreaEditor
          key={`${editor}-${area?.id}`}
          kind={editor}
          initialText=""
          onSave={saveEditor}
          onClose={() => setEditor(null)}
        />
      ) : null}
      <Dialog open={attaching} onOpenChange={setAttaching}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Attach an existing thread</DialogTitle>
            <DialogDescription>
              Bring its status into this Area. The original conversation stays where it is.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 pb-6">
            <Input
              aria-label="Search threads"
              placeholder="Search threads…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="max-h-80 overflow-y-auto [&_button]:flex [&_button]:w-full [&_button]:cursor-pointer [&_button]:items-center [&_button]:justify-between [&_button]:gap-4 [&_button]:rounded-md [&_button]:px-2 [&_button]:py-2 [&_button]:text-left [&_button]:text-sm [&_button:hover]:bg-accent [&_button:focus-visible]:ring-2 [&_button:focus-visible]:ring-inset [&_button:focus-visible]:ring-ring [&_button:disabled]:cursor-default [&_button:disabled]:opacity-50 [&_small]:text-xs [&_small]:text-muted-foreground">
              {threads
                .filter((thread) => thread.title.toLowerCase().includes(search.toLowerCase()))
                .map((thread) => {
                  const attached = area?.workstreams.some(
                    (stream) =>
                      stream.source.kind === "thread" &&
                      stream.source.environmentId === thread.environmentId &&
                      stream.source.threadId === thread.id,
                  );
                  return (
                    <button
                      type="button"
                      disabled={attached}
                      key={`${thread.environmentId}:${thread.id}`}
                      onClick={() => {
                        updateArea((current) =>
                          attachAreaThread(
                            current,
                            { environmentId: thread.environmentId, threadId: thread.id },
                            thread.title,
                          ),
                        );
                        setAttaching(false);
                      }}
                    >
                      <span>{thread.title}</span>
                      <small>{attached ? "Attached" : "Attach"}</small>
                    </button>
                  );
                })}
              {threads.filter((thread) => thread.title.toLowerCase().includes(search.toLowerCase()))
                .length === 0 ? (
                <p className="text-xs text-muted-foreground">No matching loaded threads.</p>
              ) : null}
            </div>
          </div>
        </DialogPopup>
      </Dialog>
    </SidebarInset>
  );
}
