import { CommandId, type ThreadTag, type ThreadTagDefinition } from "@t3tools/contracts";
import * as SecureRandom from "effect/crypto/SecureRandom";
import * as Effect from "effect/Effect";
import * as Stream from "effect/Stream";

import { forkParkedFiber } from "../serverActivation.ts";
import * as ServerSettings from "../serverSettings.ts";
import * as Orchestrator from "./Orchestrator.ts";
import * as ProjectionStore from "./ProjectionStore.ts";

const definedTags = (definitions: ReadonlyArray<ThreadTagDefinition>): ReadonlySet<ThreadTag> =>
  new Set(definitions.map((definition) => definition.name));

/**
 * Removing a tag definition removes that tag from every thread, archived ones included. Tags
 * that never had a definition are left alone. Removals live in memory, so a restart between the
 * settings write and the cleanup leaves those threads tagged.
 */
export const make = Effect.gen(function* () {
  const orchestrator = yield* Orchestrator.OrchestratorV2;
  const projections = yield* ProjectionStore.ProjectionStoreV2;
  const settings = yield* ServerSettings.ServerSettingsService;
  const random = yield* SecureRandom.SecureRandom;

  const untag = Effect.fn("ThreadTagDefinitionCleanup.untag")(
    function* (tag: ThreadTag) {
      // Receipts replay by id, so deleting a tag again after re-adding it needs a new id.
      const removal = yield* random.uuidV4();
      const threadIds = yield* projections.listTaggedThreadIds(tag);
      yield* Effect.forEach(
        threadIds,
        (threadId) =>
          orchestrator
            .dispatch({
              type: "thread.tag.set",
              commandId: CommandId.make(`server:tag-definition-removed:${removal}:${threadId}`),
              threadId,
              tag,
              tagged: false,
            })
            .pipe(
              Effect.catch((cause) =>
                Effect.logWarning("tag definition cleanup skipped a thread", {
                  tag,
                  threadId,
                  cause,
                }),
              ),
            ),
        { discard: true },
      );
    },
    (effect, tag) =>
      effect.pipe(
        Effect.catch((cause) => Effect.logWarning("tag definition cleanup failed", { tag, cause })),
      ),
  );

  const start = Effect.fn("ThreadTagDefinitionCleanup.start")(function* () {
    const changes = yield* settings.subscribeChanges;
    let previous = definedTags((yield* settings.getSettings).threadTagDefinitions);
    return yield* forkParkedFiber(
      Stream.runForEach(changes, (next) => {
        const current = definedTags(next.threadTagDefinitions);
        const removed = [...previous].filter((tag) => !current.has(tag));
        previous = current;
        return Effect.forEach(removed, untag, { discard: true });
      }),
    );
  });
  return { start };
});
