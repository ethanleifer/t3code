import { useEffect, useId, useState } from "react";
import { create } from "zustand";

import { SECTION_NAME_MAX_LENGTH } from "./Sidebar.sections";
import type { SectionMenuChoice } from "./threadActionMenu.logic";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type Request = { readonly resolve: (name: string | null) => void };
const useRequest = create<{ request: Request | null }>(() => ({ request: null }));

function requestSectionName(): Promise<string | null> {
  useRequest.getState().request?.resolve(null);
  return new Promise((resolve) => useRequest.setState({ request: { resolve } }));
}

/** The section a menu choice moves a thread to, or null when the user cancels naming one. */
export async function resolveSectionMenuChoice(
  choice: SectionMenuChoice,
): Promise<{ readonly section: string | null } | null> {
  switch (choice.kind) {
    case "set":
      return { section: choice.name };
    case "remove":
      return { section: null };
    case "new": {
      const name = await requestSectionName();
      return name === null ? null : { section: name };
    }
  }
}

function finish(name: string | null) {
  const request = useRequest.getState().request;
  useRequest.setState({ request: null });
  request?.resolve(name);
}

export function SectionNameDialogHost() {
  const request = useRequest((state) => state.request);
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- resolves a pending name request with null when the host unmounts
  useEffect(() => () => finish(null), []);
  return request ? <SectionNameDialog /> : null;
}

function SectionNameDialog() {
  const id = useId();
  const [name, setName] = useState("");
  const trimmed = name.trim();
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) finish(null);
      }}
    >
      <DialogPopup className="sm:max-w-sm">
        <form
          className="flex min-h-0 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            if (trimmed !== "") finish(trimmed);
          }}
        >
          <DialogHeader>
            <DialogTitle>New section</DialogTitle>
            <DialogDescription>
              Sections group threads across Active, Working, Snoozed, and Settled.
            </DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${id}-name`}>Name</Label>
              <Input
                id={`${id}-name`}
                autoFocus
                value={name}
                maxLength={SECTION_NAME_MAX_LENGTH}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
          </DialogPanel>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => finish(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={trimmed === ""}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}
