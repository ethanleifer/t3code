import { useEffect, useState } from "react";
import { useAtomValue } from "@effect/atom-react";
import { AreaId, type Area, type ScopedThreadRef } from "@t3tools/contracts";
import { useEnvironmentQuery } from "../../state/query";
import { useAtomCommand } from "../../state/use-atom-command";
import { useThreadShell } from "../../state/entities";
import { areaSave, areaRemove, areasList } from "../../state/areas";
import { createAreaArtifact } from "./areaArtifactTemplate";
import type { PreviewArea } from "./areasPreview";

export function useAreaCoordination(local: PreviewArea | undefined, threadRef: ScopedThreadRef) {
  const environmentId = local?.leadThread?.environmentId ?? threadRef.environmentId;
  const query = useEnvironmentQuery(areasList({ environmentId, input: {} }));
  const shared = query.data?.find((area) => area.id === local?.id) ?? null;
  const save = useAtomCommand(areaSave);
  const remove = useAtomCommand(areaRemove);
  const canWrite = useAtomValue(areaSave.permissionAtom(environmentId));
  const [saving, setSaving] = useState(false);
  const lead = useThreadShell(local?.leadThread ?? null);
  const runId = lead?.runtime?.activeRunId;
  const status = lead?.runtime?.status;
  const refresh = query.refresh;
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- rereads agent-written Area content when the lead transitions between runs and on browser focus
  useEffect(() => {
    if (runId !== undefined || status !== undefined) refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [runId, status, refresh]);
  const saveArea = async (area: PreviewArea, expected: Area | null) => {
    if (!area.leadThread || saving || !canWrite) return false;
    setSaving(true);
    const result = await save({
      environmentId,
      input: {
        area: {
          id: AreaId.make(area.id),
          name: area.name,
          goal: area.goal,
          brief: area.brief,
          artifactHtml: area.artifactHtml ?? createAreaArtifact(area),
          leadThreadId: area.leadThread.threadId,
          threadIds: area.workstreams.flatMap((stream) =>
            stream.source.kind === "thread" && stream.source.environmentId === environmentId
              ? [stream.source.threadId]
              : [],
          ),
        },
        expectedRevision: expected?.revision ?? null,
      },
    });
    setSaving(false);
    refresh();
    return result._tag === "Success";
  };
  const disconnect = async () => {
    if (!shared || saving) return false;
    setSaving(true);
    const result = await remove({
      environmentId,
      input: { id: shared.id, expectedRevision: shared.revision },
    });
    setSaving(false);
    refresh();
    return result._tag === "Success";
  };
  return {
    shared,
    saving,
    canWrite,
    isPending: query.isPending,
    error: query.error,
    refresh,
    save: (area: PreviewArea) => saveArea(area, shared),
    disconnect,
  };
}
