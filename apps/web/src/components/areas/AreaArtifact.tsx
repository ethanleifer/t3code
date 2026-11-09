import { useState } from "react";
import { CodeIcon, ExpandIcon, EyeIcon } from "lucide-react";
import { AreaArtifactFrame } from "./AreaArtifactFrame";
import { Button } from "../ui/button";
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";

export function AreaArtifact({ html, onSave }: { html: string; onSave: (html: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [source, setSource] = useState(html);
  const [expanded, setExpanded] = useState(false);
  return (
    <section className="mb-5 min-w-0" aria-label="Overview artifact">
      <div className="mb-3 flex items-center justify-between gap-3 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2 [&_h2]:text-xs [&_h2]:font-medium">
        <div>
          <h2>Overview</h2>
          <p className="mt-1 text-2xs text-muted-foreground">HTML artifact</p>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (!editing) setSource(html);
              setEditing(!editing);
            }}
          >
            {editing ? <EyeIcon /> : <CodeIcon />}
            {editing ? "Cancel editing" : "Edit HTML"}
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Expand overview canvas"
            onClick={() => setExpanded(true)}
          >
            <ExpandIcon />
          </Button>
        </div>
      </div>
      {editing ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSave(source);
            setEditing(false);
          }}
        >
          <label
            className="mb-2 block text-xs text-muted-foreground"
            htmlFor="area-artifact-source"
          >
            HTML, CSS, and JavaScript. Paste a complete document or a fragment.
          </label>
          <textarea
            id="area-artifact-source"
            className="min-h-96 w-full resize-y rounded-md border border-input bg-code p-3 font-mono text-xs leading-relaxed text-foreground outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            spellCheck={false}
            value={source}
            onChange={(event) => setSource(event.target.value)}
          />
          <div className="mt-2 flex items-center justify-between gap-3 [&_span]:text-2xs [&_span]:text-muted-foreground">
            <span>Replace the whole canvas. There is no required structure.</span>
            <Button size="sm" type="submit">
              Save & render
            </Button>
          </div>
        </form>
      ) : (
        <>
          <div className="h-[520px] min-h-48 resize-y overflow-hidden rounded-lg border border-border bg-background">
            <AreaArtifactFrame html={html} />
          </div>
          <p className="mt-1 text-2xs text-muted-foreground">
            Drag the lower corner to resize. Expand for more room.
          </p>
        </>
      )}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogPopup className="w-[94vw] max-w-[1400px]">
          <DialogHeader>
            <DialogTitle>Overview</DialogTitle>
            <DialogDescription>
              HTML, CSS, and JavaScript. Make this space your own.
            </DialogDescription>
          </DialogHeader>
          <div className="px-4 pb-4">
            <AreaArtifactFrame html={html} expanded />
          </div>
        </DialogPopup>
      </Dialog>
    </section>
  );
}
