import { Pressable, ScrollView } from "react-native";
import { SymbolView } from "../../components/ui/AppSymbol";
import { ListFilterMenu } from "../layout/workspace/ListFilterMenu";
import type { EnvironmentId, ThreadTagDefinition } from "@t3tools/contracts";
import {
  toggleTagName,
  type HomeListFilterMenuEnvironment,
  type HomeListFilterMenuProject,
} from "./home-list-filter-menu";

export function ThreadListFilters(props: {
  readonly environments: ReadonlyArray<HomeListFilterMenuEnvironment>;
  readonly projects: ReadonlyArray<HomeListFilterMenuProject>;
  readonly selectedEnvironmentId: EnvironmentId | null;
  readonly selectedProjectKey: string | null;
  readonly tags: ReadonlyArray<ThreadTagDefinition>;
  readonly selectedTagNames: ReadonlyArray<string>;
  readonly onEnvironmentChange: (environmentId: EnvironmentId | null) => void;
  readonly onProjectChange: (projectKey: string | null) => void;
  readonly onTagNamesChange: (tagNames: ReadonlyArray<string>) => void;
  /** List padding the scroller bleeds through so pills start where row content does. */
  readonly gutter: number;
}) {
  const selectedEnvironment = props.environments.find(
    (environment) => environment.environmentId === props.selectedEnvironmentId,
  );
  const selectedProject = props.projects.find(
    (project) => project.key === props.selectedProjectKey,
  );
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -props.gutter, overflow: "visible" }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 2, paddingBottom: 10, gap: 8 }}
    >
      <ListFilterMenu
        label={selectedEnvironment?.label ?? "All environments"}
        accessibilityLabel="Filter threads by environment"
        active={selectedEnvironment !== undefined}
        actions={[
          {
            id: "all",
            title: "All environments",
            state: props.selectedEnvironmentId === null ? "on" : "off",
          },
          ...props.environments.map((environment) => ({
            id: JSON.stringify(environment.environmentId),
            title: environment.label,
            state:
              environment.environmentId === props.selectedEnvironmentId
                ? ("on" as const)
                : ("off" as const),
          })),
        ]}
        onSelect={(id) => {
          if (id === "all") props.onEnvironmentChange(null);
          else {
            const environment = props.environments.find(
              (candidate) => JSON.stringify(candidate.environmentId) === id,
            );
            if (environment) props.onEnvironmentChange(environment.environmentId);
          }
        }}
      />
      <ListFilterMenu
        label={selectedProject?.label ?? "All projects"}
        accessibilityLabel="Filter threads by project"
        active={selectedProject !== undefined}
        actions={[
          {
            id: "all",
            title: "All projects",
            state: props.selectedProjectKey === null ? "on" : "off",
          },
          ...props.projects.map((project) => ({
            id: JSON.stringify(project.key),
            title: project.label,
            state: project.key === props.selectedProjectKey ? ("on" as const) : ("off" as const),
          })),
        ]}
        onSelect={(id) => {
          if (id === "all") props.onProjectChange(null);
          else {
            const project = props.projects.find(
              (candidate) => JSON.stringify(candidate.key) === id,
            );
            if (project) props.onProjectChange(project.key);
          }
        }}
      />
      {props.tags.length > 0 || props.selectedTagNames.length > 0 ? (
        <ListFilterMenu
          label={
            props.selectedTagNames.length > 1
              ? `Tags ${props.selectedTagNames.length}`
              : (props.selectedTagNames[0] ?? "Tags")
          }
          accessibilityLabel="Filter threads by tag"
          active={props.selectedTagNames.length > 0}
          actions={[
            {
              id: "all",
              title: "All tags",
              state: props.selectedTagNames.length === 0 ? "on" : "off",
            },
            ...props.tags.map((tag) => ({
              id: JSON.stringify(tag.name),
              title: tag.name,
              image: "circle.fill",
              imageColor: tag.color,
              state: props.selectedTagNames.includes(tag.name) ? ("on" as const) : ("off" as const),
            })),
          ]}
          onSelect={(id) => {
            if (id === "all") props.onTagNamesChange([]);
            else {
              const tag = props.tags.find((candidate) => JSON.stringify(candidate.name) === id);
              if (tag) props.onTagNamesChange(toggleTagName(props.selectedTagNames, tag.name));
            }
          }}
        />
      ) : null}
      {props.selectedEnvironmentId !== null ||
      props.selectedProjectKey !== null ||
      props.selectedTagNames.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reset thread filters"
          className="h-8 w-8 items-center justify-center"
          onPress={() => {
            props.onEnvironmentChange(null);
            props.onProjectChange(null);
            props.onTagNamesChange([]);
          }}
        >
          <SymbolView name="xmark.circle.fill" size={18} tintColorClassName="accent-icon-muted" />
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
