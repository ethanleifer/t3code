import { useState } from "react";
import { BoxesIcon, PlusIcon, ArrowUpRightIcon } from "lucide-react";
import type { PreviewArea } from "./areasPreview";
import { useThreadShells } from "../../state/entities";
import { useRightPanelStore } from "../../rightPanelStore";
import { randomUUID } from "../../lib/utils";
import { isElectron } from "../../env";
import { WorkspacePageHeader } from "../WorkspacePageHeader";
import { WorkspacePageContainer } from "../WorkspacePageContainer";
import { WorkspaceBreadcrumb, WorkspaceBreadcrumbItem } from "../WorkspaceBreadcrumb";
import { SidebarInset } from "../ui/sidebar";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { AreaEditor } from "./AreaEditor";
import { AreaThreadPicker } from "./AreaThreadPicker";
import { useAreasPreview, useOpenAreaConversation } from "./useAreasPreview";

export function AreasPage() {
  const [store, setStore] = useAreasPreview();
  const [creating, setCreating] = useState(false);
  const [choosing, setChoosing] = useState<PreviewArea | null>(null);
  const threads = useThreadShells();
  const openConversation = useOpenAreaConversation();
  return (
    <SidebarInset className="h-dvh min-h-0 overflow-hidden">
      <WorkspacePageHeader electron={isElectron} className="border-b border-border">
        <WorkspaceBreadcrumb ariaLabel="Areas">
          <WorkspaceBreadcrumbItem current>
            <BoxesIcon className="mr-2 size-4" />
            <h1>Areas</h1>
          </WorkspaceBreadcrumbItem>
        </WorkspaceBreadcrumb>
        <div className="ml-auto">
          <Button variant="ghost" size="sm" onClick={() => setCreating(true)}>
            <PlusIcon />
            New Area
          </Button>
        </div>
      </WorkspacePageHeader>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <WorkspacePageContainer>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-medium">An Area starts with a conversation</h2>
              <Badge variant="secondary" size="sm">
                Preview
              </Badge>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              Choose an existing T3 thread as the lead. Its chat stays exactly as it is, with the
              Area’s overview and workstreams in the normal right panel.
            </p>
          </div>
          <div className="divide-y divide-border rounded-lg border border-border">
            {store.areas.map((area) => {
              const ref = area.leadThread;
              const lead = ref
                ? threads.find(
                    (thread) =>
                      thread.environmentId === ref.environmentId && thread.id === ref.threadId,
                  )
                : undefined;
              return (
                <section
                  key={area.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-sm font-medium">{area.name}</h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">{area.goal}</p>
                    {ref ? (
                      <p className="text-2xs text-muted-foreground">
                        Lead: {lead?.title ?? "Conversation not loaded"}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-1">
                    {ref ? (
                      <>
                        <Button size="sm" variant="ghost-muted" onClick={() => setChoosing(area)}>
                          Change lead
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost-muted"
                          onClick={() => {
                            useRightPanelStore.getState().closeSurface(ref, `area:${area.id}`);
                            setStore((current) => ({
                              ...current,
                              areas: current.areas.map((item) => {
                                if (item.id !== area.id) return item;
                                const { leadThread: _lead, ...rest } = item;
                                return rest;
                              }),
                            }));
                          }}
                        >
                          Disconnect
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openConversation(area, ref)}
                        >
                          Open Area
                          <ArrowUpRightIcon />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setChoosing(area)}>
                        Choose conversation
                      </Button>
                    )}
                  </div>
                </section>
              );
            })}
            {store.areas.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                Create an Area to keep context alongside an existing thread.
              </p>
            ) : null}
          </div>
          <p className="text-2xs text-muted-foreground">
            Area context saves in this browser. Linking a conversation does not configure agent
            coordination.
          </p>
        </WorkspacePageContainer>
      </div>
      {creating ? (
        <AreaEditor
          kind="area"
          onClose={() => setCreating(false)}
          onSave={(name, text) => {
            const area: PreviewArea = {
              id: randomUUID(),
              name,
              goal: text,
              brief: text,
              workstreams: [],
              messages: [],
            };
            setStore((current) => ({ areas: [...current.areas, area], selectedAreaId: area.id }));
            setCreating(false);
            setChoosing(area);
          }}
        />
      ) : null}
      {choosing ? (
        <AreaThreadPicker
          kind="lead"
          onClose={() => setChoosing(null)}
          onSelect={(ref) => {
            setStore((current) => ({
              ...current,
              selectedAreaId: choosing.id,
              areas: current.areas.map((area) =>
                area.id === choosing.id ? { ...area, leadThread: ref } : area,
              ),
            }));
            setChoosing(null);
            openConversation(choosing, ref);
          }}
        />
      ) : null}
    </SidebarInset>
  );
}
