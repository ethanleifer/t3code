import type { ContextMenuItem, ThreadTagDefinition } from "@t3tools/contracts";

export type ThreadTagMenuId = "tags" | "manage-tags" | `tag:add:${string}` | `tag:remove:${string}`;

export function buildThreadTagMenu(
  targets: readonly {
    readonly definitions: readonly ThreadTagDefinition[];
    readonly tags: readonly string[];
    readonly canTag: boolean;
  }[],
): ContextMenuItem<ThreadTagMenuId> {
  const first = targets[0];
  const definitions =
    first?.definitions.filter((definition) =>
      targets.every((target) =>
        target.definitions.some((candidate) => candidate.name === definition.name),
      ),
    ) ?? [];
  const canTag = targets.length > 0 && targets.every((target) => target.canTag);
  const children: ContextMenuItem<ThreadTagMenuId>[] = definitions.map((definition) => {
    const checked = targets.every((target) => target.tags.includes(definition.name));
    return {
      id: `tag:${checked ? "remove" : "add"}:${definition.name}`,
      label: definition.name,
      swatch: definition.color,
      checked,
      disabled: !canTag,
    };
  });
  const legacyTags = new Set(
    targets
      .flatMap((target) => target.tags)
      .filter((tag) => !definitions.some((definition) => definition.name === tag)),
  );
  for (const tag of legacyTags) {
    children.push({
      id: `tag:remove:${tag}`,
      label: `Remove ${tag}`,
      checked: true,
      disabled: !canTag,
    });
  }
  children.push({ id: "manage-tags", label: "Manage tags…", separatorBefore: children.length > 0 });
  return { id: "tags", label: "Tags", icon: "tags", children };
}

export function threadTagAction(action: string) {
  if (action.startsWith("tag:add:")) return { tag: action.slice("tag:add:".length), tagged: true };
  if (action.startsWith("tag:remove:"))
    return { tag: action.slice("tag:remove:".length), tagged: false };
  return null;
}
