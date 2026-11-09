import { useState } from "react";
import { ArrowUpRightIcon, SparklesIcon } from "lucide-react";
import { randomUUID } from "../../lib/utils";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import type { PreviewArea, AreaWorkstream } from "./areasPreview";
import styles from "./areas.module.css";

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
      : "Nothing is marked as needing you. Use the shared brief to give the next workstream a clear outcome.";
    onUpdate((current) => ({
      ...current,
      messages: [...current.messages, { id: randomUUID(), role: "lead", text }],
    }));
  };
  return (
    <section className={styles["area-lead"]}>
      <div className={styles["area-lead-heading"]}>
        <span className={styles["area-lead-mark"]}>
          <SparklesIcon size={17} />
        </span>
        <div>
          <h2>Area lead</h2>
          <p>Local planning preview</p>
        </div>
      </div>
      <div className={styles["area-lead-intro"]}>
        A place to steer the whole effort, carry decisions forward, and hand work back to the right
        thread.
      </div>
      {needsYou.length ? (
        <div className={styles["area-attention"]}>
          <p className={styles["area-eyebrow"]}>Your next decisions</p>
          {needsYou.map((stream) => (
            <button type="button" key={stream.id} onClick={() => onOpen(stream.id)}>
              {stream.title}
              <ArrowUpRightIcon size={14} />
            </button>
          ))}
        </div>
      ) : null}
      <div className={styles["area-messages"]} aria-live="polite">
        {area.messages.length === 0 ? (
          <p className={styles["area-muted"]}>Leave the first direction for this Area.</p>
        ) : null}
        {area.messages.map((message) => (
          <article className={styles["area-message"]} data-role={message.role} key={message.id}>
            <span>{message.role === "you" ? "You" : "Preview lead · sample response"}</span>
            <p>{message.text}</p>
          </article>
        ))}
      </div>
      <div className={styles["area-lead-composer"]}>
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
          <div className={styles["area-composer-footer"]}>
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
