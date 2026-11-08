import type { ScopedThreadRef } from "@t3tools/contracts";
import { Tooltip, TooltipTrigger, TooltipPopup } from "../ui/tooltip";
import { useServerConfigs, useThreadShell } from "../../state/entities";

export function ThreadTagLabels({ threadRef }: { threadRef: ScopedThreadRef }) {
  const thread = useThreadShell(threadRef);
  const definitions =
    useServerConfigs().get(threadRef.environmentId)?.settings.threadTagDefinitions ?? [];
  if (!thread?.source.tags?.length) return null;
  return (
    <div className="flex max-w-64 items-center gap-1 overflow-hidden">
      {thread.source.tags.map((tag) => {
        const color = definitions.find((definition) => definition.name === tag)?.color;
        return (
          <Tooltip key={tag}>
            <TooltipTrigger
              render={
                <span
                  className="inline-flex max-w-32 shrink-0 items-center gap-1 truncate rounded border border-border px-1.5 py-0.5 text-xs"
                  style={
                    color ? { backgroundColor: `${color}18`, borderColor: `${color}66` } : undefined
                  }
                />
              }
            >
              {color ? (
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
              ) : null}
              <span className="truncate">{tag}</span>
            </TooltipTrigger>
            <TooltipPopup>{tag}</TooltipPopup>
          </Tooltip>
        );
      })}
    </div>
  );
}
