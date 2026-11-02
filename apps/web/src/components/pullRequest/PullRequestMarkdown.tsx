import { ExternalLinkIcon, PaperclipIcon } from "lucide-react";
import { markdownImageSourceFragment } from "@t3tools/client-runtime/markdown-images";
import { sourceControlClients } from "@t3tools/client-runtime/source-control-clients";
import {
  SOURCE_CONTROL_MEDIA_ASSET,
  type AssetResource,
  type EnvironmentId,
  type ScopedThreadRef,
} from "@t3tools/contracts";
import { createContext, useContext } from "react";
import type { PluggableList } from "unified";

import { useAssetUrlRefresh, useAssetUrlState } from "~/assets/assetUrls";
import { cn } from "~/lib/utils";
import { PULL_REQUESTS_PANEL_REF } from "~/rightPanelStore";

import ChatMarkdown from "../ChatMarkdown";
import { MediaVideoPlayer } from "../media/MediaVideoPlayer";
import { splitPullRequestBody } from "./pullRequestMarkdown.logic";

export const PullRequestMarkdownContext = createContext<{
  /** Stable per repository, so comments share one renderer and its parse cache. */
  remarkPlugins: PluggableList;
  lineBreaks: boolean;
  threadRef: ScopedThreadRef | null;
} | null>(null);

function PullRequestHostVideo({
  environmentId,
  cwd,
  url,
  fetchUrl,
}: {
  environmentId: EnvironmentId;
  cwd: string;
  url: string;
  fetchUrl: string;
}) {
  const resource: AssetResource = { _tag: SOURCE_CONTROL_MEDIA_ASSET, cwd, url: fetchUrl };
  const assetUrl = useAssetUrlState(environmentId, resource);
  const refreshAssetUrl = useAssetUrlRefresh(environmentId, resource);
  const src =
    assetUrl._tag === "Success" ? assetUrl.url : assetUrl._tag === "Failure" ? fetchUrl : null;
  return (
    <MediaVideoPlayer
      src={src === null ? null : src + markdownImageSourceFragment(url)}
      originalUrl={url}
      label="Pull request video"
      className="w-full"
      videoClassName="rounded-lg border border-border/60"
      onRetry={refreshAssetUrl}
    />
  );
}

/** Where each markdown segment begins in `text`, or -1. Segments keep the body's order. */
function markdownSegmentStarts(
  text: string,
  segments: ReturnType<typeof splitPullRequestBody>,
): ReadonlyArray<number> {
  let searchFrom = 0;
  return segments.map((segment) => {
    if (segment.kind !== "markdown") return -1;
    const start = text.indexOf(segment.text, searchFrom);
    if (start >= 0) searchFrom = start + segment.text.length;
    return start;
  });
}

export function PullRequestMarkdown({
  text,
  cwd,
  environmentId,
  threadRef,
  lineBreaks,
  className,
  onTaskListChange,
}: {
  text: string;
  cwd: string;
  environmentId: EnvironmentId;
  threadRef?: ScopedThreadRef | null;
  lineBreaks?: boolean;
  className?: string;
  /** Receives offsets into `text`, not into the segment that rendered the checkbox. */
  onTaskListChange?: ((input: { markerOffset: number; checked: boolean }) => void) | undefined;
}) {
  const segments = splitPullRequestBody(text);
  const starts = markdownSegmentStarts(text, segments);
  const context = useContext(PullRequestMarkdownContext);
  const resolvedThreadRef = threadRef ?? context?.threadRef ?? undefined;
  return (
    <div
      className={cn(
        "space-y-3 [&_[data-markdown-details]]:border-0 [&_[data-markdown-details-summary]]:text-foreground/80 [&_[data-markdown-details-summary]>svg]:text-muted-foreground/60",
        className,
      )}
      data-image-gallery
    >
      {segments.map((segment, index) => {
        if (segment.kind === "markdown" || segment.media === "image") {
          const segmentStart = starts[index] ?? -1;
          return (
            <ChatMarkdown
              key={segment.id}
              text={segment.kind === "markdown" ? segment.text : `![](<${segment.url}>)`}
              cwd={cwd}
              threadRef={resolvedThreadRef}
              pullRequestPanelRef={resolvedThreadRef ?? PULL_REQUESTS_PANEL_REF}
              environmentId={environmentId}
              {...(context ? { extraRemarkPlugins: context.remarkPlugins } : {})}
              lineBreaks={lineBreaks ?? context?.lineBreaks ?? false}
              sourceControlMedia
              onTaskListChange={
                onTaskListChange && segmentStart >= 0
                  ? ({ markerOffset, checked }) =>
                      onTaskListChange({ markerOffset: segmentStart + markerOffset, checked })
                  : undefined
              }
            />
          );
        }
        const hostMedia = sourceControlClients.mediaUrl(segment.url);
        if (segment.media === "video" && hostMedia !== null) {
          return (
            <PullRequestHostVideo
              key={`${segment.id}:${segment.url}`}
              environmentId={environmentId}
              cwd={cwd}
              url={segment.url}
              fetchUrl={hostMedia.fetchUrl}
            />
          );
        }
        if (segment.media === "video") {
          return (
            <MediaVideoPlayer
              key={`${segment.id}:${segment.url}`}
              src={segment.url}
              originalUrl={segment.url}
              label="Pull request video"
              className="w-full"
              videoClassName="rounded-lg border border-border/60"
            />
          );
        }
        return (
          // Desktop converts blocked _blank navigation to openExternal.
          <a
            key={segment.id}
            href={segment.url}
            rel="noreferrer noopener"
            target="_blank"
            className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm hover:bg-muted/60"
          >
            <PaperclipIcon aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">
              Open attachment on {hostMedia?.definition.label ?? new URL(segment.url).hostname}
            </span>
            <ExternalLinkIcon aria-hidden className="size-3 shrink-0 text-muted-foreground" />
          </a>
        );
      })}
    </div>
  );
}
