import { useNavigate } from "@tanstack/react-router";
import type { ScopedThreadRef } from "@t3tools/contracts";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useRightPanelStore } from "../../rightPanelStore";
import {
  AREAS_PREVIEW_STORAGE_KEY,
  AreasPreviewState,
  INITIAL_AREAS,
  type PreviewArea,
} from "./areasPreview";

export function useAreasPreview() {
  return useLocalStorage(AREAS_PREVIEW_STORAGE_KEY, INITIAL_AREAS, AreasPreviewState);
}

export function useOpenAreaConversation() {
  const navigate = useNavigate();
  return (area: Pick<PreviewArea, "id" | "name">, lead: ScopedThreadRef) => {
    useRightPanelStore.getState().openArea(lead, { areaId: area.id, title: area.name });
    void navigate({ to: "/$environmentId/$threadId", params: lead });
  };
}
