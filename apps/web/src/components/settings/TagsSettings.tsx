import { useAtomValue } from "@effect/atom-react";
import {
  type EnvironmentId,
  MAX_THREAD_TAG_DEFINITIONS,
  THREAD_TAG_COLOR_PRESETS,
  ThreadTag,
  type ThreadTagColor,
  type ThreadTagDefinition,
  isManagedSettingPath,
} from "@t3tools/contracts";
import * as Schema from "effect/Schema";
import { useState } from "react";
import { useEnvironmentSettings } from "../../hooks/useSettings";
import { useThreadShells } from "../../state/entities";
import { serverEnvironment } from "../../state/server";
import { useAtomCommand } from "../../state/use-atom-command";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { useSettingsScope } from "./SettingsScopeContext";
import { searchableSetting } from "./settingsSearch";
import { SettingsPageContainer, SettingsRow, SettingsSection } from "./settingsLayout";

const isThreadTag = Schema.is(ThreadTag);

function TagColorPicker({
  value,
  onChange,
  label,
}: {
  value: ThreadTagColor;
  onChange: (color: ThreadTagColor) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      {THREAD_TAG_COLOR_PRESETS.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`${label}: ${color}`}
          aria-pressed={value.toLowerCase() === color}
          className="size-6 rounded-full border-2 border-transparent -outline-offset-2 aria-pressed:border-foreground focus-visible:outline-2 focus-visible:outline-ring"
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
        />
      ))}
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        Custom
        <input
          type="color"
          aria-label={`Custom ${label.toLowerCase()}`}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      </label>
    </div>
  );
}

export function TagsSettingsPanel() {
  const { scope, environment } = useSettingsScope();
  return (
    <SettingsPageContainer>
      {scope.kind !== "environment" || !environment ? (
        <p className="text-sm text-muted-foreground">Select an environment to manage its tags.</p>
      ) : (
        <EnvironmentTagsSettings
          key={environment.environmentId}
          environmentId={environment.environmentId}
          managed={
            environment.serverConfig?.managedPolicy !== undefined &&
            isManagedSettingPath(environment.serverConfig.managedPolicy, "threadTagDefinitions")
          }
        />
      )}
    </SettingsPageContainer>
  );
}

function EnvironmentTagsSettings({
  environmentId,
  managed,
}: {
  environmentId: EnvironmentId;
  managed: boolean;
}) {
  const definitions = useEnvironmentSettings(
    environmentId,
    (settings) => settings.threadTagDefinitions,
  );
  const threads = useThreadShells();
  const canWrite = useAtomValue(serverEnvironment.updateSettings.permissionAtom(environmentId));
  const persist = useAtomCommand(serverEnvironment.updateSettings);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<ThreadTagColor>(THREAD_TAG_COLOR_PRESETS[0]);
  const [deleting, setDeleting] = useState<ThreadTagDefinition | null>(null);
  const validName =
    isThreadTag(name.trim()) && !definitions.some((definition) => definition.name === name.trim());
  const disabled = !canWrite || managed || pending;
  const save = async (next: readonly ThreadTagDefinition[]) => {
    setPending(true);
    const result = await persist({
      environmentId,
      input: { patch: { threadTagDefinitions: next } },
    });
    setPending(false);
    return result._tag === "Success";
  };
  const count = threads.filter(
    (thread) =>
      thread.environmentId === environmentId &&
      deleting !== null &&
      thread.source.tags?.includes(deleting.name),
  ).length;
  return (
    <SettingsSection {...searchableSetting("thread-tags")}>
      <SettingsRow
        title="Tag definitions"
        description="Create tags for this environment, then apply them from a thread's Tags menu. Names are case-sensitive."
        serverScoped
        settingKeys={["threadTagDefinitions"]}
      >
        <fieldset disabled={disabled} className="space-y-4 pb-3">
          {definitions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No tags yet.</p>
          ) : null}
          {definitions.map((definition) => (
            <TagDefinitionEditor
              key={`${definition.name}:${definition.color}`}
              definition={definition}
              onSave={(nextColor) =>
                save(
                  definitions.map((entry) =>
                    entry.name === definition.name ? { ...entry, color: nextColor } : entry,
                  ),
                )
              }
              onDelete={() => setDeleting(definition)}
            />
          ))}
          <form
            className="space-y-3 border-t border-border pt-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!validName || disabled || definitions.length >= MAX_THREAD_TAG_DEFINITIONS)
                return;
              void save([...definitions, { name: name.trim(), color }]).then((saved) => {
                if (saved) {
                  setName("");
                  setColor(THREAD_TAG_COLOR_PRESETS[0]);
                }
              });
            }}
          >
            <Input
              aria-label="New tag name"
              placeholder="Tag name"
              value={name}
              maxLength={64}
              onChange={(event) => setName(event.currentTarget.value)}
            />
            <TagColorPicker value={color} onChange={setColor} label="New tag color" />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              disabled={!validName || definitions.length >= MAX_THREAD_TAG_DEFINITIONS}
            >
              Create tag
            </Button>
            {name.trim() !== "" && !validName ? (
              <p className="text-xs text-muted-foreground">
                Use a unique, single-line name of up to 64 characters.
              </p>
            ) : null}
            {definitions.length >= MAX_THREAD_TAG_DEFINITIONS ? (
              <p className="text-xs text-muted-foreground">
                Up to {MAX_THREAD_TAG_DEFINITIONS} tags per environment.
              </p>
            ) : null}
          </form>
        </fieldset>
      </SettingsRow>
      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tag {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the tag from all threads in this environment. Approximately {count}{" "}
              loaded threads use it; unloaded threads may also be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" />}>Cancel</AlertDialogClose>
            <Button
              variant="destructive"
              disabled={disabled}
              onClick={() => {
                if (deleting === null) return;
                void save(
                  definitions.filter((definition) => definition.name !== deleting.name),
                ).then((saved) => {
                  if (saved) setDeleting(null);
                });
              }}
            >
              Delete tag
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </SettingsSection>
  );
}

function TagDefinitionEditor({
  definition,
  onSave,
  onDelete,
}: {
  definition: ThreadTagDefinition;
  onSave: (color: ThreadTagColor) => Promise<boolean>;
  onDelete: () => void;
}) {
  const [color, setColor] = useState(definition.color);
  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave(color);
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: definition.color }}
        />
        <span className="min-w-0 flex-1 truncate text-sm">{definition.name}</span>
        <Button type="submit" variant="outline" size="sm" disabled={color === definition.color}>
          Save color
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          Delete
        </Button>
      </div>
      <TagColorPicker value={color} onChange={setColor} label={`${definition.name} color`} />
    </form>
  );
}
