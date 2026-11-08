import { MonitorIcon } from "lucide-react";
import type { EnvironmentId } from "@t3tools/contracts";

import { Menu, MenuPopup, MenuRadioGroup, MenuRadioItem, MenuTrigger } from "../ui/menu";
import { SidebarHeaderIconButton } from "./SidebarThreadHeader";

export function SidebarMachineFilter({
  machines,
  selected,
  onChange,
}: {
  machines: ReadonlyMap<EnvironmentId, string>;
  selected: EnvironmentId | null;
  onChange: (environmentId: EnvironmentId | null) => void;
}) {
  return (
    <Menu>
      <MenuTrigger
        render={
          <SidebarHeaderIconButton
            label={
              selected === null
                ? "Filter threads by machine"
                : `Filter threads by machine: ${machines.get(selected) ?? selected}`
            }
          />
        }
      >
        <MonitorIcon className="size-4" />
        {selected !== null ? (
          <span className="absolute right-1 top-1 size-1.5 rounded-full bg-primary" />
        ) : null}
      </MenuTrigger>
      <MenuPopup align="start" collisionAvoidance={{ side: "flip", align: "shift" }}>
        <MenuRadioGroup
          value={selected ?? ""}
          onValueChange={(value) => {
            if (value === "") onChange(null);
            else {
              const machine = [...machines.keys()].find((id) => id === value);
              if (machine !== undefined) onChange(machine);
            }
          }}
        >
          <MenuRadioItem value="">All machines</MenuRadioItem>
          {[...machines].map(([id, label]) => (
            <MenuRadioItem key={id} value={id}>
              {label}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuPopup>
    </Menu>
  );
}
