import { useState } from "react";
import { CodeIcon, ExpandIcon, EyeIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import styles from "./areas.module.css";

export function AreaArtifact({ html, onSave }: { html: string; onSave: (html: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [source, setSource] = useState(html);
  const [expanded, setExpanded] = useState(false);
  const frame = (large: boolean) => (
    <iframe
      title={large ? "Expanded Area artifact" : "Area overview artifact"}
      className={large ? styles["artifact-expanded-frame"] : styles["artifact-frame"]}
      srcDoc={html}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
    />
  );
  return (
    <section className={styles["area-artifact"]} aria-label="Overview artifact">
      <div className={styles["area-section-heading"]}>
        <div>
          <h2>Overview canvas</h2>
          <p className={styles["artifact-caption"]}>Anything you can make in HTML.</p>
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
          <label className={styles["artifact-source-label"]} htmlFor="area-artifact-source">
            HTML, CSS, and JavaScript. Paste a complete document or a fragment.
          </label>
          <textarea
            id="area-artifact-source"
            className={styles["artifact-source"]}
            spellCheck={false}
            value={source}
            onChange={(event) => setSource(event.target.value)}
          />
          <div className={styles["artifact-editor-footer"]}>
            <span>Replace the whole canvas. There is no required structure.</span>
            <Button size="sm" type="submit">
              Save & render
            </Button>
          </div>
        </form>
      ) : (
        <>
          <div className={styles["artifact-resizer"]}>{frame(false)}</div>
          <p className={styles["artifact-caption"]}>
            Drag the lower corner to resize. Expand for more room.
          </p>
        </>
      )}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogPopup className="w-[94vw] max-w-[1400px]">
          <DialogHeader>
            <DialogTitle>Overview canvas</DialogTitle>
            <DialogDescription>Your Area’s freeform HTML artifact.</DialogDescription>
          </DialogHeader>
          <div className="px-4 pb-4">{frame(true)}</div>
        </DialogPopup>
      </Dialog>
    </section>
  );
}
