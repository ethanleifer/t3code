import type { ScopedThreadRef } from "@t3tools/contracts";
import { Maximize2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { HtmlRenderDocument } from "../files/BrowserDocumentFrame";
import { Button } from "../ui/button";
import { toastManager } from "../ui/toast";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";
import { HtmlRenderDialog } from "./HtmlRenderDialog";

export function HtmlRenderPreview(props: {
  readonly src: string;
  readonly title: string;
  readonly threadRef: ScopedThreadRef | undefined;
  readonly onContentHeight?: (height: number) => void;
  readonly onFullscreenChange?: ((fullscreen: boolean) => void) | undefined;
  readonly onExpand?: () => Promise<string | null>;
}) {
  const { src, title } = props;
  const [expandedSrc, setExpandedSrc] = useState<string | null>(null);
  const { onFullscreenChange } = props;
  // Tied to the viewer's lifetime: unmounting while expanded must still release
  // the timeline's follow pin, which a close handler alone never reaches.
  const expanded = expandedSrc !== null;
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- holds the parent's fullscreen pin while expanded and releases it on collapse or unmount
  useEffect(() => {
    if (!expanded) return;
    onFullscreenChange?.(true);
    return () => onFullscreenChange?.(false);
  }, [expanded, onFullscreenChange]);

  return (
    <div className="group/html-render relative size-full">
      <HtmlRenderDocument
        src={src}
        title={title}
        threadRef={props.threadRef}
        className="block size-full"
        {...(props.onContentHeight ? { onContentHeight: props.onContentHeight } : {})}
        onFullscreenChange={onFullscreenChange}
      />
      <div className="absolute end-2 top-2 flex gap-1 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover/html-render:opacity-100 pointer-coarse:opacity-100">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label="Open full screen"
                size="icon-xs"
                variant="glass"
                onClick={async () => {
                  const url = props.onExpand ? await props.onExpand().catch(() => null) : src;
                  if (url !== null) setExpandedSrc(url);
                  else
                    toastManager.add({
                      type: "error",
                      title: "Page unavailable",
                      description: "Reconnect to the environment and try again.",
                    });
                }}
              />
            }
          >
            <Maximize2Icon className="size-3.5" />
          </TooltipTrigger>
          <TooltipPopup side="left">Open full screen</TooltipPopup>
        </Tooltip>
      </div>
      {expandedSrc !== null ? (
        <HtmlRenderDialog
          src={expandedSrc}
          title={title}
          threadRef={props.threadRef}
          onClose={() => setExpandedSrc(null)}
        />
      ) : null}
    </div>
  );
}
