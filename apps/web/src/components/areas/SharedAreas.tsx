import type { Area, EnvironmentId } from "@t3tools/contracts";
import { useEnvironments } from "../../state/environments";
import { useThreadShells } from "../../state/entities";
import { useEnvironmentQuery } from "../../state/query";
import { areasList } from "../../state/areas";
import { Button } from "../ui/button";
import { useAreasPreview, useOpenAreaConversation } from "./useAreasPreview";
import type { PreviewArea } from "./areasPreview";

function EnvironmentAreas({
  environmentId,
  label,
}: {
  environmentId: EnvironmentId;
  label: string;
}) {
  const query = useEnvironmentQuery(areasList({ environmentId, input: {} }));
  const [, setStore] = useAreasPreview();
  const threads = useThreadShells();
  const openConversation = useOpenAreaConversation();
  const open = (area: Area) => {
    const local: PreviewArea = {
      id: area.id,
      name: area.name,
      goal: area.goal,
      brief: area.brief,
      artifactHtml: area.artifactHtml,
      shared: true,
      leadThread: { environmentId, threadId: area.leadThreadId },
      messages: [],
      workstreams: area.threadIds.map((threadId) => ({
        id: `thread:${environmentId}:${threadId}`,
        title:
          threads.find((thread) => thread.environmentId === environmentId && thread.id === threadId)
            ?.title ?? "Conversation",
        summary: "",
        nextAction: "",
        updates: [],
        source: { kind: "thread", environmentId, threadId },
      })),
    };
    setStore((current) => {
      const previous = current.areas.find((item) => item.id === local.id);
      const restored = {
        ...local,
        messages: previous?.messages ?? [],
        workstreams: [
          ...(previous?.workstreams.filter((stream) => stream.source.kind === "sample") ?? []),
          ...local.workstreams,
        ],
      };
      return {
        ...current,
        selectedAreaId: local.id,
        areas: [...current.areas.filter((item) => item.id !== local.id), restored],
      };
    });
    openConversation(local, { environmentId, threadId: area.leadThreadId });
  };
  if (!query.data?.length)
    return query.error ? (
      <p className="text-xs text-muted-foreground">
        {label}: {query.error}
      </p>
    ) : null;
  return (
    <div className="divide-y divide-border rounded-lg border border-border">
      {query.data.map((area) => (
        <section key={area.id} className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0 space-y-1">
            <h3 className="text-sm font-medium">{area.name}</h3>
            <p className="text-xs text-muted-foreground">{area.goal}</p>
            <p className="text-2xs text-muted-foreground">{label} · Shared</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => open(area)}>
            Open Area
          </Button>
        </section>
      ))}
    </div>
  );
}

export function SharedAreas() {
  const { environments } = useEnvironments();
  return environments
    .filter((environment) => environment.connection.phase === "connected")
    .map((environment) => (
      <EnvironmentAreas
        key={environment.environmentId}
        environmentId={environment.environmentId}
        label={environment.label}
      />
    ));
}
