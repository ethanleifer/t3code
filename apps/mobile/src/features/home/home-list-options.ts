import type { EnvironmentId, SidebarProjectGroupingMode } from "@t3tools/contracts";
import { DEFAULT_SIDEBAR_PROJECT_SORT_ORDER } from "@t3tools/contracts";
import { RegistryContext, useAtomSet, useAtomValue } from "@effect/atom-react";
import { Atom } from "effect/reactivity";
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import type { ThreadListFilters } from "../../persistence/mobile-preferences";
import { updateMobilePreferencesAtom } from "../../state/preferences";
import { definedTagNames, type HomeProjectSortOrder } from "./homeThreadList";
import { useThreadTagDefinitions } from "./thread-tag-filter";

export interface HomeListOptions {
  readonly selectedEnvironmentId: EnvironmentId | null;
  readonly selectedProjectKey: string | null;
  readonly selectedTagNames: ReadonlyArray<string>;
  readonly projectSortOrder: HomeProjectSortOrder;
}

export interface ResolvedHomeListOptions extends HomeListOptions {
  readonly projectGroupingMode: SidebarProjectGroupingMode;
}

function defaultHomeListOptions(filters?: ThreadListFilters): HomeListOptions {
  return {
    selectedEnvironmentId: filters?.environmentId ?? null,
    selectedProjectKey: filters?.projectKey ?? null,
    selectedTagNames: filters?.tagNames ?? [],
    projectSortOrder:
      DEFAULT_SIDEBAR_PROJECT_SORT_ORDER === "manual"
        ? "updated_at"
        : DEFAULT_SIDEBAR_PROJECT_SORT_ORDER,
  };
}

interface HomeListOptionsContextValue {
  readonly options: HomeListOptions;
  readonly updateOptions: (patch: Partial<HomeListOptions>) => void;
  readonly projectGroupingMode: SidebarProjectGroupingMode;
}

const HomeListOptionsContext = createContext<HomeListOptionsContextValue | null>(null);

export function HomeListOptionsProvider({
  children,
  projectGroupingMode,
  savedFilters,
}: PropsWithChildren<{
  readonly projectGroupingMode: SidebarProjectGroupingMode;
  readonly savedFilters?: ThreadListFilters | undefined;
}>) {
  const registry = useContext(RegistryContext);
  const [optionsAtom] = useState(() => Atom.make(defaultHomeListOptions(savedFilters)));
  const options = useAtomValue(optionsAtom);
  const savePreferences = useAtomSet(updateMobilePreferencesAtom);
  // Only the scope persists; the sort order is per session. Updates read the
  // registry, so several in one event each build on the last and save it.
  const updateOptions = (patch: Partial<HomeListOptions>) => {
    const current = registry.get(optionsAtom);
    const next = { ...current, ...patch };
    registry.set(optionsAtom, next);
    if (
      next.selectedEnvironmentId !== current.selectedEnvironmentId ||
      next.selectedProjectKey !== current.selectedProjectKey ||
      next.selectedTagNames !== current.selectedTagNames
    ) {
      savePreferences({
        threadListFilters: {
          environmentId: next.selectedEnvironmentId,
          projectKey: next.selectedProjectKey,
          tagNames: next.selectedTagNames,
        },
      });
    }
  };
  const value = { options, updateOptions, projectGroupingMode };
  return createElement(HomeListOptionsContext, { value }, children);
}

export function useHomeListOptions(availableEnvironmentIds: ReadonlySet<EnvironmentId>) {
  const shared = useContext(HomeListOptionsContext);
  const [localOptions, setLocalOptions] = useState<HomeListOptions>(defaultHomeListOptions);
  const options = shared?.options ?? localOptions;
  const updateOptions =
    shared?.updateOptions ??
    ((patch: Partial<HomeListOptions>) => setLocalOptions((current) => ({ ...current, ...patch })));
  const selectedEnvironmentId =
    options.selectedEnvironmentId !== null &&
    availableEnvironmentIds.has(options.selectedEnvironmentId)
      ? options.selectedEnvironmentId
      : null;
  const availableOptions =
    selectedEnvironmentId === options.selectedEnvironmentId
      ? options
      : { ...options, selectedEnvironmentId };
  const { definitions: tagDefinitions, loaded: tagDefinitionsLoaded } =
    useThreadTagDefinitions(selectedEnvironmentId);
  const selectedTagNames = useMemo(
    () =>
      definedTagNames(options.selectedTagNames, tagDefinitionsLoaded ? tagDefinitions : undefined),
    [options.selectedTagNames, tagDefinitions, tagDefinitionsLoaded],
  );
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- Persist deletions only after scoped server settings have loaded.
  useEffect(() => {
    if (selectedTagNames.length !== options.selectedTagNames.length) {
      updateOptions({ selectedTagNames });
    }
  }, [selectedTagNames, options.selectedTagNames, updateOptions]);
  const resolvedOptions: ResolvedHomeListOptions = {
    ...availableOptions,
    selectedTagNames,
    projectGroupingMode: shared?.projectGroupingMode ?? "repository",
  };

  const setSelectedEnvironmentId = (value: EnvironmentId | null) => {
    updateOptions({ selectedEnvironmentId: value });
  };
  const setSelectedProjectKey = (value: string | null) => {
    updateOptions({ selectedProjectKey: value });
  };
  const setSelectedTagNames = (value: ReadonlyArray<string>) => {
    updateOptions({ selectedTagNames: value });
  };
  const setProjectSortOrder = (value: HomeProjectSortOrder) => {
    updateOptions({ projectSortOrder: value });
  };
  return {
    options: resolvedOptions,
    tagDefinitions,
    setSelectedEnvironmentId,
    setSelectedProjectKey,
    setSelectedTagNames,
    setProjectSortOrder,
  } as const;
}
