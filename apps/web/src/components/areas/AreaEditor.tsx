import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";

export function AreaEditor({
  kind,
  initialName = "",
  initialText = "",
  onSave,
  onClose,
}: {
  kind: "area" | "workstream";
  initialName?: string;
  initialText?: string;
  onSave: (name: string, text: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [text, setText] = useState(initialText);
  const title = kind === "area" ? "Create an Area" : "Add a workstream";
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPopup>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (name.trim()) onSave(name.trim(), text.trim());
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {kind === "area"
                ? "Give an ongoing body of work a home. Repositories and threads can come later."
                : "One outcome with its own context and next step."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-4">
            <label className="block space-y-2 text-sm">
              {kind === "area" ? "Area name" : "Workstream name"}
              <Input
                autoFocus
                aria-label={kind === "area" ? "Area name" : "Workstream name"}
                value={name}
                maxLength={100}
                onChange={(event) => setName(event.target.value)}
                placeholder={
                  kind === "area" ? "e.g. Customer onboarding" : "e.g. Simplify the sign-up flow"
                }
              />
            </label>
            <label className="block space-y-2 text-sm">
              {kind === "area" ? "What are we working toward?" : "Context and expected result"}
              <Textarea
                aria-label="Context and expected result"
                value={text}
                maxLength={6000}
                rows={5}
                onChange={(event) => setText(event.target.value)}
              />
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {kind === "area" ? "Create Area" : "Add workstream"}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}
