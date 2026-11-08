import { cn } from "~/lib/utils";
import type { ScopedThreadRef } from "@t3tools/contracts";
import { Tooltip, TooltipTrigger, TooltipPopup } from "../ui/tooltip";
import { useServerConfigs, useThreadShell } from "../../state/entities";

export function ThreadTagLabels({
  threadRef,
  variant = "badge",
}: {
  threadRef: ScopedThreadRef;
  variant?: "badge" | "inline";
}) {
  const thread = useThreadShell(threadRef);
  const definitions =
    useServerConfigs().get(threadRef.environmentId)?.settings.threadTagDefinitions ?? [];
  if (!thread?.source.tags?.length) return null;
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-1 overflow-hidden",
        variant === "badge" && "max-w-64",
      )}
    >
      {thread.source.tags.map((tag) => {
        const color = definitions.find((definition) => definition.name === tag)?.color;
        return (
          <Tooltip key={tag}>
            <TooltipTrigger
              render={
                <span
                  className={cn(
                    "inline-flex items-center gap-1 truncate text-xs",
                    variant === "badge"
                      ? "max-w-32 shrink-0 rounded border border-border px-1.5 py-0.5"
                      : "min-w-0 text-secondary-label",
                  )}
                  style={
                    color && variant === "badge"
                      ? { backgroundColor: `${color}18`, borderColor: `${color}66` }
                      : undefined
                  }
                />
              }
            >
              {color ? (
                <span
                  aria-hidden
                  className={cn(
                    "shrink-0 rounded-full",
                    variant === "badge" ? "size-2" : "size-1 opacity-70",
                  )}
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
