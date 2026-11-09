import { useState } from "react";
import { ArrowLeftIcon, CodeIcon, FileCodeIcon, PinIcon } from "lucide-react";
import { AreaArtifactFrame } from "./AreaArtifactFrame";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";

export function AreaArtifact({ html, onSave }: { html: string; onSave: (html: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [source, setSource] = useState(html);
  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) {
          setEditing(false);
          setSource(html);
        }
      }}
    >
      <DialogTrigger
        aria-label="Open overview artifact"
        render={
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border/60 bg-background px-3 py-2 text-left outline-none hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          />
        }
      >
        <FileCodeIcon className="size-4 shrink-0 text-icon-muted" />
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium">Overview</span>
          <span className="block text-2xs text-muted-foreground">Freeform HTML artifact</span>
        </span>
        <PinIcon className="size-3 text-icon-muted" />
        <span className="text-2xs text-muted-foreground">Open</span>
      </DialogTrigger>
      <DialogPopup className="w-[94vw] max-w-[1400px]" showCloseButton={false}>
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DialogTitle>Overview</DialogTitle>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (!editing) setSource(html);
                  setEditing(!editing);
                }}
              >
                <CodeIcon />
                {editing ? "Cancel editing" : "Edit HTML"}
              </Button>
              <DialogClose render={<Button size="sm" variant="outline" />}>
                <ArrowLeftIcon />
                Back to lead
              </DialogClose>
            </div>
          </div>
          <DialogDescription>
            HTML, CSS, and JavaScript. Make this space your own.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto px-4 pb-4">
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
                Paste a complete document or a fragment. No required structure.
              </label>
              <textarea
                id="area-artifact-source"
                className="h-[60dvh] min-h-48 w-full resize-y rounded-md border border-input bg-code p-3 font-mono text-xs leading-relaxed text-foreground outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                spellCheck={false}
                value={source}
                onChange={(event) => setSource(event.target.value)}
              />
              <div className="mt-2 flex justify-end">
                <Button size="sm" type="submit">
                  Save & render
                </Button>
              </div>
            </form>
          ) : (
            <div className="h-[65dvh] min-h-48 resize-y overflow-hidden rounded-lg border border-border bg-background">
              <AreaArtifactFrame html={html} />
            </div>
          )}
        </div>
      </DialogPopup>
    </Dialog>
  );
}
