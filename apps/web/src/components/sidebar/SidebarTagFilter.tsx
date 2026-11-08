import type { ThreadTagColor, ThreadTagDefinition } from "@t3tools/contracts";
import { TagIcon, XIcon } from "lucide-react";

import { cn } from "~/lib/utils";
import { Button } from "../ui/button";
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "../ui/menu";
import { SidebarHeaderIconButton } from "./SidebarThreadHeader";

function ThreadTagDot({
  color,
  className,
}: {
  color: ThreadTagColor;
  className?: string | undefined;
}) {
  return (
    <span
      aria-hidden
      className={cn("size-2 shrink-0 rounded-full", className)}
      style={{ backgroundColor: color }}
    />
  );
}

export function SidebarTagFilterMenu({
  definitions,
  selected,
  onSelectedChange,
}: {
  definitions: ReadonlyArray<ThreadTagDefinition>;
  selected: readonly string[];
  onSelectedChange: (names: readonly string[]) => void;
}) {
  if (definitions.length === 0) return null;
  const selectedDefinitions = definitions.filter((definition) =>
    selected.includes(definition.name),
  );
  return (
    <Menu>
      <MenuTrigger
        render={
          <SidebarHeaderIconButton
            label={
              selected.length > 0
                ? `Filter threads by tag: ${selected.join(", ")}`
                : "Filter threads by tag"
            }
          />
        }
      >
        {selectedDefinitions.length > 0 ? (
          <span className="flex shrink-0 items-center">
            {selectedDefinitions.slice(0, 3).map((definition, index) => (
              <ThreadTagDot
                key={definition.name}
                color={definition.color}
                className={index === 0 ? undefined : "-ml-0.5 ring-2 ring-sidebar"}
              />
            ))}
          </span>
        ) : (
          <TagIcon className="size-4" />
        )}
      </MenuTrigger>
      <MenuPopup align="start" collisionAvoidance={{ side: "flip", align: "shift" }}>
        <MenuGroup>
          <MenuGroupLabel>Show threads tagged</MenuGroupLabel>
          {definitions.map((definition) => (
            <MenuCheckboxItem
              key={definition.name}
              checked={selected.includes(definition.name)}
              closeOnClick={false}
              onCheckedChange={(checked) =>
                onSelectedChange(
                  checked
                    ? [...selected, definition.name]
                    : selected.filter((name) => name !== definition.name),
                )
              }
            >
              <span className="flex min-w-0 items-center gap-2">
                <ThreadTagDot color={definition.color} />
                <span className="truncate">{definition.name}</span>
              </span>
            </MenuCheckboxItem>
          ))}
        </MenuGroup>
        {selected.length > 0 ? (
          <>
            <MenuSeparator />
            <MenuItem onClick={() => onSelectedChange([])}>Clear tag filter</MenuItem>
          </>
        ) : null}
      </MenuPopup>
    </Menu>
  );
}

export function SidebarActiveTagFilter({
  definitions,
  selected,
  onClear,
}: {
  definitions: ReadonlyArray<ThreadTagDefinition>;
  selected: readonly string[];
  onClear: () => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 px-2 pt-1 text-xs text-sidebar-muted-foreground">
      <span className="shrink-0">Tagged</span>
      <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
        {selected.map((name) => {
          const definition = definitions.find((definition) => definition.name === name);
          return (
            <span key={name} className="flex min-w-0 items-center gap-1">
              {definition ? <ThreadTagDot color={definition.color} /> : null}
              <span className="truncate text-sidebar-foreground">{name}</span>
            </span>
          );
        })}
      </span>
      <Button
        type="button"
        size="icon-micro"
        variant="ghost-muted"
        className="shrink-0"
        aria-label="Clear tag filter"
        onClick={onClear}
      >
        <XIcon className="size-3" />
      </Button>
    </div>
  );
}
