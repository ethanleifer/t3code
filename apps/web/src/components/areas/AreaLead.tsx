import { useState } from "react";
import { ArrowUpRightIcon, MessageSquareIcon } from "lucide-react";
import { randomUUID } from "../../lib/utils";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import type { PreviewArea, AreaWorkstream } from "./areasPreview";

export function AreaLead({
  area,
  needsYou,
  onUpdate,
  onOpen,
}: {
  area: PreviewArea;
  needsYou: readonly AreaWorkstream[];
  onUpdate: (update: (current: PreviewArea) => PreviewArea) => void;
  onOpen: (id: string) => void;
}) {
  const [note, setNote] = useState("");
  const addSummary = () => {
    const text = needsYou.length
      ? `Needs your attention: ${needsYou.map((stream) => `${stream.title}: ${stream.nextAction}`).join("\n\n")}`
      : "Nothing is marked as needing you. Use the overview to give the next workstream a clear outcome.";
    onUpdate((current) => ({
      ...current,
      messages: [...current.messages, { id: randomUUID(), role: "lead", text }],
    }));
  };
  return (
    <section className="flex min-w-0 flex-col">
      <div className="flex items-center gap-2 [&_h2]:text-xs [&_h2]:font-medium [&_p]:text-2xs [&_p]:text-muted-foreground">
        <MessageSquareIcon className="size-4 text-icon-muted" />
        <h2>Area lead</h2>
        <span className="ml-auto">
          <Badge variant="secondary" size="sm">
            Sample
          </Badge>
        </span>
      </div>
      {needsYou.length ? (
        <div className="mt-4 rounded-md border border-border/60 px-3 py-2 [&_button]:flex [&_button]:w-full [&_button]:cursor-pointer [&_button]:items-center [&_button]:justify-between [&_button]:gap-2 [&_button]:rounded-sm [&_button]:py-1 [&_button]:text-left [&_button]:text-xs [&_button:focus-visible]:ring-2 [&_button:focus-visible]:ring-inset [&_button:focus-visible]:ring-ring [&_button:hover]:text-primary">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Needs you</p>
          {needsYou.map((stream) => (
            <button type="button" key={stream.id} onClick={() => onOpen(stream.id)}>
              {stream.title}
              <ArrowUpRightIcon size={14} />
            </button>
          ))}
        </div>
      ) : null}
      <div className="my-4 flex max-h-96 flex-col gap-4 overflow-y-auto" aria-live="polite">
        {area.messages.length === 0 ? (
          <p className="text-xs text-muted-foreground">Leave the first direction for this Area.</p>
        ) : null}
        {area.messages.map((message) => (
          <article
            className="text-sm data-[role=you]:rounded-lg data-[role=you]:bg-message data-[role=you]:px-3 data-[role=you]:py-2 [&>span]:text-2xs [&>span]:text-muted-foreground [&>p]:mt-1 [&>p]:whitespace-pre-wrap [&>p]:text-xs [&>p]:leading-relaxed"
            data-role={message.role}
            key={message.id}
          >
            <span>{message.role === "you" ? "You" : "Preview lead · sample response"}</span>
            <p>{message.text}</p>
          </article>
        ))}
      </div>
      <div className="flex flex-col items-start gap-3 [&_form]:w-full">
        <Button size="sm" variant="outline" onClick={addSummary}>
          What needs me?
        </Button>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const text = note.trim();
            if (!text) return;
            onUpdate((current) => ({
              ...current,
              messages: [...current.messages, { id: randomUUID(), role: "you", text }],
            }));
            setNote("");
          }}
        >
          <Textarea
            aria-label="Direction for the Area"
            placeholder="Leave a direction or decision…"
            rows={3}
            maxLength={6000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <div className="mt-2 flex items-center justify-between gap-2 [&>span]:text-3xs [&>span]:text-muted-foreground">
            <span>Notes stay here. No model connected.</span>
            <Button size="sm" type="submit" disabled={!note.trim()}>
              Save note
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
