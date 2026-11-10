import { useAtomValue } from "@effect/atom-react";
import { enabledEnvironmentIds } from "@t3tools/client-runtime/state/connections";
import type { EnvironmentThreadShell } from "@t3tools/client-runtime/state/shell";
import type { EnvironmentId } from "@t3tools/contracts";
import { Atom } from "effect/reactivity";
import { useMemo } from "react";

import { environmentCatalog } from "../../connection/catalog";
import { serverEnvironment } from "../../state/server";
import { hasAllTags, mergeThreadTagDefinitions } from "./homeThreadList";

const threadTagDefinitionsAtom = Atom.family((environmentId: EnvironmentId | null) =>
  Atom.make((get) => {
    const ids =
      environmentId === null
        ? [...enabledEnvironmentIds(get(environmentCatalog.catalogValueAtom))]
        : [environmentId];
    const settings = ids.map((id) => get(serverEnvironment.settingsValueAtom(id)));
    return {
      definitions: mergeThreadTagDefinitions(
        settings.map((value) => value?.threadTagDefinitions ?? []),
      ),
      loaded: ids.length > 0 && settings.every((value) => value !== null),
    };
  }).pipe(Atom.withLabel(`mobile-home:thread-tag-definitions:${environmentId ?? "all"}`)),
);

export function useThreadTagDefinitions(environmentId: EnvironmentId | null) {
  return useAtomValue(threadTagDefinitionsAtom(environmentId));
}

export function useTagFilteredThreads(
  threads: ReadonlyArray<EnvironmentThreadShell>,
  tagNames: ReadonlyArray<string>,
) {
  return useMemo(
    () =>
      tagNames.length === 0 ? threads : threads.filter((thread) => hasAllTags(thread, tagNames)),
    [threads, tagNames],
  );
}
