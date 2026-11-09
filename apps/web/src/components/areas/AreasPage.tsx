import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRightIcon, BoxesIcon, PlusIcon, XIcon } from "lucide-react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useThreadShells } from "../../state/entities";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { AreaLead } from "./AreaLead";
import { SidebarInset, SidebarTrigger } from "../ui/sidebar";
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
import styles from "./areas.module.css";
import { randomUUID } from "../../lib/utils";

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
          className={styles["area-stream"]}
          data-selected={selectedId === stream.id}
          onClick={() => setSelectedId(stream.id)}
        >
          <span className={styles["area-stream-top"]}>
            <span className={styles["area-dot"]} data-state={state} />
            {stream.source.kind === "thread" && !findThread(stream)
              ? "Not loaded"
              : WORKSTREAM_LABELS[state]}
            <span className="ml-auto">
              {stream.source.kind === "sample" ? "Sample" : "Linked thread"}
            </span>
          </span>
          <strong>{stream.title}</strong>
          <span className={styles["area-stream-summary"]}>
            {stream.summary || "Add context in the workstream details."}
          </span>
          <span className={styles["area-stream-next"]}>
            {stream.nextAction}
            <ArrowUpRightIcon size={14} />
          </span>
        </button>
      );
    });
  const detail = selected ? (
    <section className={styles["area-detail"]} aria-label="Workstream details">
      <div className={styles["area-section-heading"]}>
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
        <p className={styles["area-muted"]}>
          This thread is not loaded. Open the original to reconnect with its context.
        </p>
      ) : null}
      <p className={`${styles["area-eyebrow"]} mt-5`}>Next step</p>
      <p>{selected.nextAction}</p>
      <ul className={styles["area-updates"]}>
        {selected.updates.map((update) => (
          <li key={update}>{update}</li>
        ))}
      </ul>
      <div className={styles["area-detail-actions"]}>
        {selected.source.kind === "sample" ? (
          <label className={styles["area-state-picker"]}>
            Sample status
            <select
              aria-label="Workstream status"
              value={selected.source.state}
              onChange={(event) => {
                const state = WORKSTREAM_STATES.find((item) => item === event.target.value);
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
              {WORKSTREAM_STATES.map((state) => (
                <option value={state} key={state}>
                  {WORKSTREAM_LABELS[state]}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <Link
            className={styles["area-thread-link"]}
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
      <div className={styles["areas-page"]}>
        <header className={styles["areas-header"]}>
          <SidebarTrigger />
          <BoxesIcon size={18} />
          <span>Areas</span>
          <Badge variant="outline" size="sm">
            Preview
          </Badge>
          <div className="ml-auto">
            <Button size="sm" variant="outline" onClick={() => setEditor("area")}>
              <PlusIcon />
              New Area
            </Button>
          </div>
        </header>
        <div className={styles["areas-body"]}>
          <nav className={styles["area-switcher"]} aria-label="Your Areas">
            {store.areas.map((item) => (
              <button
                type="button"
                key={item.id}
                aria-pressed={item.id === area?.id}
                onClick={() => {
                  setStore((current) => ({ ...current, selectedAreaId: item.id }));
                  setSelectedId(null);
                }}
              >
                {item.name}
              </button>
            ))}
          </nav>
          {area ? (
            <>
              <div className={styles["area-heading"]}>
                <div>
                  <p className={styles["area-eyebrow"]}>An ongoing body of work</p>
                  <h1>{area.name}</h1>
                  <p className={styles["area-goal"]}>
                    {area.goal || "Give this work a direction on the canvas."}
                  </p>
                </div>
                <div className={styles["area-heading-count"]}>
                  <strong>{needsYou.length}</strong>
                  <span>need you</span>
                </div>
              </div>
              <div className={styles["area-toolbar"]}>
                <div className={styles["area-views"]} role="group" aria-label="Area view">
                  {VIEWS.map((item) => (
                    <button
                      type="button"
                      aria-pressed={view === item}
                      key={item}
                      onClick={() => setView(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <span className={styles["area-preview-note"]}>
                  Saved in this browser · No agents started
                </span>
              </div>
              <div className={styles["area-layout"]} data-view={view}>
                <section
                  className={styles["area-workspace"]}
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
                      <div className={styles["area-section-heading"]}>
                        <h2>
                          {view === "Board" ? "Workstream board" : "Workstreams"}
                          <span className={styles["area-muted"]}>{area.workstreams.length}</span>
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
                        <div className={styles["area-board"]}>
                          {WORKSTREAM_STATES.map((state) => (
                            <section className={styles["area-board-column"]} key={state}>
                              <h3>
                                <span className={styles["area-dot"]} data-state={state} />
                                {WORKSTREAM_LABELS[state]}
                                <span className={styles["area-muted"]}>
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
                        <div className={styles["area-stream-grid"]}>{cards(area.workstreams)}</div>
                      )}
                      {area.workstreams.length === 0 ? (
                        <div className={styles["area-empty"]}>
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
                  className={styles["area-context"]}
                  aria-label={view === "Conversation" ? "Workstream context" : "Preview lead"}
                >
                  {selected ? (
                    detail
                  ) : view === "Conversation" ? (
                    <>
                      <div className={styles["area-section-heading"]}>
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
              <footer className={styles["area-footer"]}>
                Areas span repositories. Threads keep their own history. You keep the decisions.
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
            <div className={styles["area-empty"]}>
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
            <div className={styles["area-attach-list"]}>
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
                <p className={styles["area-muted"]}>No matching loaded threads.</p>
              ) : null}
            </div>
          </div>
        </DialogPopup>
      </Dialog>
    </SidebarInset>
  );
}
