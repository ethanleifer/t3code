import { useEffect, useRef } from "react";
import {
  htmlRenderThemeMessage,
  injectHtmlRenderBootstrap,
  readHtmlRenderLinkRequest,
} from "@t3tools/shared/htmlRender";
import { useHtmlRenderTheme } from "../../hooks/useHtmlRenderTheme";

export function AreaArtifactFrame({
  html,
  expanded = false,
}: {
  html: string;
  expanded?: boolean;
}) {
  const theme = useHtmlRenderTheme();
  const frameRef = useRef<HTMLIFrameElement>(null);
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- posts app palette and font changes to the sandboxed artifact
  useEffect(() => {
    frameRef.current?.contentWindow?.postMessage(htmlRenderThemeMessage(theme), "*");
  }, [theme]);
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- handles user-initiated links forwarded by the existing HTML artifact bootstrap
  useEffect(() => {
    const onMessage = (event: MessageEvent<unknown>) => {
      const frame = frameRef.current;
      if (frame === null || event.source !== frame.contentWindow) return;
      const link = readHtmlRenderLinkRequest(event.data);
      if (
        link === undefined ||
        document.activeElement !== frame ||
        navigator.userActivation?.isActive === false
      )
        return;
      window.open(link.url, "_blank", "noopener,noreferrer");
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);
  return (
    <iframe
      ref={frameRef}
      title={expanded ? "Expanded Area artifact" : "Area overview artifact"}
      className={
        expanded
          ? "block h-[75dvh] w-full rounded-md border-0 bg-background"
          : "block size-full border-0"
      }
      srcDoc={injectHtmlRenderBootstrap(html)}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      onLoad={() =>
        frameRef.current?.contentWindow?.postMessage(htmlRenderThemeMessage(theme), "*")
      }
    />
  );
}
