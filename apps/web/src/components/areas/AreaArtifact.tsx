import { toastManager } from "../ui/toast";
import { useEffect, useState } from "react";
import type { ScopedThreadRef } from "@t3tools/contracts";
import { injectHtmlRenderBootstrap } from "@t3tools/shared/htmlRender";
import { CodeIcon } from "lucide-react";
import { HtmlRenderPreview } from "../chat/HtmlRenderPreview";
import { Button } from "../ui/button";

export function AreaArtifact({
  html,
  title,
  threadRef,
  onSave,
}: {
  html: string;
  title: string;
  threadRef?: ScopedThreadRef;
  onSave: (html: string) => void | boolean | Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [source, setSource] = useState(html);
  const [src, setSrc] = useState<string | null>(null);
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- owns the browser-local document URL and releases it when the saved source changes or unmounts
  useEffect(() => {
    const url = URL.createObjectURL(
      new Blob([injectHtmlRenderBootstrap(html)], { type: "text/html" }),
    );
    // oxlint-disable-next-line react/set-state-in-effect -- publishes the document URL owned by this effect and its cleanup
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [html]);
  return (
    <section aria-label="Overview artifact pane" className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 justify-end border-b border-border px-2 py-1">
        <Button
          size="sm"
          variant="ghost-muted"
          onClick={() => {
            if (!editing) setSource(html);
            setEditing(!editing);
          }}
        >
          <CodeIcon />
          {editing ? "Cancel editing" : "Edit HTML"}
        </Button>
      </div>
      {editing ? (
        <form
          className="flex min-h-0 flex-1 flex-col gap-2 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (saving) return;
            setSaving(true);
            void Promise.resolve()
              .then(() => onSave(source))
              .then((saved) => {
                if (saved !== false) setEditing(false);
              })
              .catch(() => {
                toastManager.add({
                  type: "error",
                  title: "Could not save the overview",
                  description: "Your HTML draft is still in the editor.",
                });
              })
              .finally(() => setSaving(false));
          }}
        >
          <label className="text-xs text-muted-foreground" htmlFor="area-artifact-source">
            HTML source
          </label>
          <textarea
            id="area-artifact-source"
            className="min-h-48 w-full flex-1 resize-none rounded-md border border-input bg-code p-3 font-mono text-xs leading-relaxed text-foreground outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            spellCheck={false}
            value={source}
            onChange={(event) => setSource(event.target.value)}
          />
          <div className="flex justify-end">
            <Button size="sm" type="submit" disabled={saving}>
              Save & render
            </Button>
          </div>
        </form>
      ) : src !== null ? (
        <div className="min-h-0 flex-1">
          <HtmlRenderPreview key={src} src={src} title={title} threadRef={threadRef} />
        </div>
      ) : null}
    </section>
  );
}
