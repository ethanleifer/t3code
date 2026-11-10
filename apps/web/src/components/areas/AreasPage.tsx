import { useRef, useState } from "react";
import { BoxesIcon, PanelRightIcon, PlusIcon } from "lucide-react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useThreadShells } from "../../state/entities";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { AreaArtifact } from "./AreaArtifact";
import { createAreaArtifact } from "./areaArtifactTemplate";
import { AreaLead } from "./AreaLead";
import { AreaWorkstreams } from "./AreaWorkstreams";
import { WorkspacePageHeader } from "../WorkspacePageHeader";
import {
  WorkspaceBreadcrumb,
  WorkspaceBreadcrumbItem,
  WorkspaceBreadcrumbSeparator,
} from "../WorkspaceBreadcrumb";
import { isElectron } from "../../env";
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "../ui/select";
import { SidebarInset } from "../ui/sidebar";
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { AreaEditor } from "./AreaEditor";
import {
  AREAS_PREVIEW_STORAGE_KEY,
  AreasPreviewState,
  INITIAL_AREAS,
  attachAreaThread,
  workstreamState,
  type PreviewArea,
} from "./areasPreview";
import { randomUUID } from "../../lib/utils";

export function AreasPage() {
  const [store, setStore] = useLocalStorage(
    AREAS_PREVIEW_STORAGE_KEY,
    INITIAL_AREAS,
    AreasPreviewState,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editor, setEditor] = useState<"area" | "workstream" | null>(null);
  const [attaching, setAttaching] = useState(false);
  const [search, setSearch] = useState("");
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const wide = useMediaQuery("lg");
  const threads = useThreadShells();
  const area = store.areas.find((item) => item.id === store.selectedAreaId) ?? store.areas[0];
  const updateArea = (update: (current: PreviewArea) => PreviewArea) => {
    if (!area) return;
    setStore((current) => ({
      ...current,
      areas: current.areas.map((item) => (item.id === area.id ? update(item) : item)),
    }));
  };
  const needsYou =
    area?.workstreams.filter((stream) => {
      const source = stream.source;
      const thread =
        source.kind === "thread"
          ? threads.find(
              (item) => item.environmentId === source.environmentId && item.id === source.threadId,
            )
          : undefined;
      return workstreamState(stream, thread) === "needs-you";
    }) ?? [];
  const openWorkstream = (id: string) => {
    setSelectedId(id);
    setPanelOpen(true);
  };
  const backToLead = () => {
    setSelectedId(null);
    setPanelOpen(false);
    composerRef.current?.focus();
  };
  const saveEditor = (name: string, text: string) => {
    const id = randomUUID();
    if (editor === "area") {
      setStore((current) => ({
        selectedAreaId: id,
        areas: [
          ...current.areas,
          { id, name, goal: text, brief: text, messages: [], workstreams: [] },
        ],
      }));
      setSelectedId(null);
    } else {
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
      openWorkstream(id);
    }
    setEditor(null);
  };
  const workstreams = area ? (
    <AreaWorkstreams
      area={area}
      threads={threads}
      selectedId={selectedId}
      onOpen={openWorkstream}
      onBackToList={() => setSelectedId(null)}
      onBackToLead={backToLead}
      onAttach={() => {
        setPanelOpen(false);
        setSearch("");
        setAttaching(true);
      }}
      onAdd={() => {
        setPanelOpen(false);
        setEditor("workstream");
      }}
      onUpdate={updateArea}
      onDelete={() => {
        if (
          window.confirm(
            `Delete the local preview Area “${area.name}”? Your original threads will be kept.`,
          )
        ) {
          setStore((current) => ({
            ...current,
            areas: current.areas.filter((item) => item.id !== area.id),
          }));
          setPanelOpen(false);
          setSelectedId(null);
        }
      }}
    />
  ) : null;
  return (
    <SidebarInset className="h-dvh min-h-0 overflow-hidden">
      <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
        <WorkspacePageHeader electron={isElectron} className="border-b border-border bg-background">
          <div className="[-webkit-app-region:no-drag] flex min-w-0 flex-1 items-center gap-2">
            <WorkspaceBreadcrumb ariaLabel="Areas breadcrumb">
              <WorkspaceBreadcrumbItem className="hidden sm:flex">
                <BoxesIcon className="size-4" />
                <span className="ml-2">Areas</span>
              </WorkspaceBreadcrumbItem>
              {area ? (
                <>
                  <WorkspaceBreadcrumbSeparator className="hidden sm:flex" />
                  <WorkspaceBreadcrumbItem current>
                    <Select
                      value={area.id}
                      onValueChange={(id) => {
                        if (id !== null) {
                          setStore((current) => ({ ...current, selectedAreaId: id }));
                          setSelectedId(null);
                          setPanelOpen(false);
                        }
                      }}
                    >
                      <SelectTrigger
                        variant="ghost"
                        size="compact"
                        className="max-w-44 sm:max-w-none"
                        aria-label="Choose Area"
                      >
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
            <div className="lg:hidden">
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Open workstreams"
                onClick={() => setPanelOpen(true)}
              >
                <PanelRightIcon />
              </Button>
            </div>
            <div className="hidden sm:block">
              <Badge variant="secondary" size="sm">
                Local preview
              </Badge>
            </div>
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
        {area ? (
          <div className="flex min-h-0 flex-1">
            <div className="min-h-0 min-w-0 flex-1">
              <AreaLead
                key={area.id}
                area={area}
                needsYou={needsYou}
                onUpdate={updateArea}
                onOpen={openWorkstream}
                composerRef={composerRef}
                wide={wide}
                threads={threads}
                onOpenOverview={() => {
                  setSelectedId(null);
                  setPanelOpen(false);
                }}
                onAttach={() => {
                  setSearch("");
                  setAttaching(true);
                }}
                onManage={() => {
                  setSelectedId(null);
                  setPanelOpen(true);
                }}
              />
            </div>
            {wide ? (
              <aside
                className="flex w-[45%] min-w-80 shrink-0 flex-col border-l border-border"
                aria-label="Area context pane"
              >
                {panelOpen || selectedId ? (
                  workstreams
                ) : (
                  <AreaArtifact
                    key={area.id}
                    variant="pane"
                    html={area.artifactHtml ?? createAreaArtifact(area)}
                    onSave={(artifactHtml) =>
                      updateArea((current) => ({ ...current, artifactHtml }))
                    }
                  />
                )}
              </aside>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <h1 className="text-lg font-medium">Start an Area</h1>
            <p className="max-w-sm text-sm text-muted-foreground">
              Keep a lead conversation, shared artifact, and workstream threads together.
            </p>
            <Button onClick={() => setEditor("area")}>Create an Area</Button>
          </div>
        )}
      </div>
      {!wide ? (
        <Dialog open={panelOpen && !!area} onOpenChange={setPanelOpen}>
          <DialogPopup showCloseButton={false} finalFocus={() => composerRef.current}>
            <div className="sr-only">
              <DialogTitle>Workstreams</DialogTitle>
              <DialogDescription>Open a workstream or return to the Area lead.</DialogDescription>
            </div>
            <div className="flex h-[70dvh] min-h-0 flex-col">{workstreams}</div>
          </DialogPopup>
        </Dialog>
      ) : null}
      {editor ? (
        <AreaEditor
          key={`${editor}-${area?.id}`}
          kind={editor}
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
