import { EnvironmentId, type ThreadTagDefinition } from "@t3tools/contracts";
import { act, useLayoutEffect } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vite-plus/test";

const harness = vi.hoisted(() => ({
  saved: [] as unknown[],
  definitions: undefined as ReadonlyArray<ThreadTagDefinition> | undefined,
}));

vi.mock("../../state/preferences", () => ({ updateMobilePreferencesAtom: {} }));
vi.mock("@effect/atom-react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@effect/atom-react")>()),
  useAtomSet: () => (value: unknown) => harness.saved.push(value),
}));

vi.mock("./thread-tag-filter", () => ({
  useThreadTagDefinitions: () => ({
    definitions: harness.definitions ?? [],
    loaded: harness.definitions !== undefined,
  }),
}));

import { HomeListOptionsProvider, useHomeListOptions } from "./home-list-options";

const ENVIRONMENT = EnvironmentId.make("env-1");
const AVAILABLE = new Set([ENVIRONMENT]);

it("saves the scope from every update made in one event", async () => {
  harness.saved = [];
  harness.definitions = undefined;
  let controls: ReturnType<typeof useHomeListOptions> | undefined;
  // Filters saved before tag filtering have no tagNames.
  const savedFilters = { environmentId: null, projectKey: null };
  function Probe() {
    const result = useHomeListOptions(AVAILABLE);
    useLayoutEffect(() => {
      controls = result;
    });
    return null;
  }

  const root = createRoot(document.createElement("div"));
  await act(async () =>
    root.render(
      <HomeListOptionsProvider projectGroupingMode="repository" savedFilters={savedFilters}>
        <Probe />
      </HomeListOptionsProvider>,
    ),
  );
  expect(controls!.options.selectedTagNames).toEqual([]);
  act(() => {
    controls!.setSelectedEnvironmentId(ENVIRONMENT);
    controls!.setSelectedProjectKey("env-1:project-1");
    controls!.setSelectedTagNames(["bug"]);
  });

  expect(harness.saved.at(-1)).toEqual({
    threadListFilters: {
      environmentId: ENVIRONMENT,
      projectKey: "env-1:project-1",
      tagNames: ["bug"],
    },
  });
  expect(controls!.options.selectedEnvironmentId).toBe(ENVIRONMENT);
  expect(controls!.options.selectedProjectKey).toBe("env-1:project-1");
  harness.definitions = [{ name: "bug", color: "#aBc123" }];
  await act(async () =>
    root.render(
      <HomeListOptionsProvider projectGroupingMode="repository" savedFilters={savedFilters}>
        <Probe />
      </HomeListOptionsProvider>,
    ),
  );
  const savedCount = harness.saved.length;
  harness.definitions = undefined;
  await act(async () =>
    root.render(
      <HomeListOptionsProvider projectGroupingMode="repository" savedFilters={savedFilters}>
        <Probe />
      </HomeListOptionsProvider>,
    ),
  );
  expect(controls!.options.selectedTagNames).toEqual(["bug"]);
  expect(harness.saved).toHaveLength(savedCount);
  harness.definitions = [];
  await act(async () =>
    root.render(
      <HomeListOptionsProvider projectGroupingMode="repository" savedFilters={savedFilters}>
        <Probe />
      </HomeListOptionsProvider>,
    ),
  );
  expect(controls!.options.selectedTagNames).toEqual([]);
  expect(harness.saved.at(-1)).toEqual({
    threadListFilters: { environmentId: ENVIRONMENT, projectKey: "env-1:project-1", tagNames: [] },
  });
  act(() => root.unmount());
});

it("restores saved tags while environment settings are loading", async () => {
  harness.saved = [];
  harness.definitions = undefined;
  let options: ReturnType<typeof useHomeListOptions>["options"] | undefined;
  function Probe() {
    const result = useHomeListOptions(AVAILABLE);
    useLayoutEffect(() => {
      options = result.options;
    });
    return null;
  }
  const root = createRoot(document.createElement("div"));
  await act(async () =>
    root.render(
      <HomeListOptionsProvider
        projectGroupingMode="repository"
        savedFilters={{
          environmentId: ENVIRONMENT,
          projectKey: null,
          tagNames: ["Bug", "urgent"],
        }}
      >
        <Probe />
      </HomeListOptionsProvider>,
    ),
  );
  expect(options?.selectedTagNames).toEqual(["Bug", "urgent"]);
  expect(harness.saved).toEqual([]);
  act(() => root.unmount());
});
