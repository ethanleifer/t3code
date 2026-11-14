import { AreaError, type Area, type AreaSaveInput, type ThreadId } from "@t3tools/contracts";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as ProjectionStore from "../orchestration-v2/ProjectionStore.ts";
import * as AreaStore from "./AreaStore.ts";

export class AreaContext extends Context.Service<
  AreaContext,
  {
    readonly forThread: (threadId: ThreadId) => Effect.Effect<Area | null, AreaError>;
    readonly save: (input: AreaSaveInput) => Effect.Effect<Area, AreaError>;
  }
>()("t3/areas/AreaContext") {}

const make = Effect.gen(function* () {
  const store = yield* AreaStore.AreaStore;
  const projections = yield* ProjectionStore.ProjectionStoreV2;
  const readThread = (id: ThreadId) =>
    projections
      .getThreadShell(id)
      .pipe(
        Effect.mapError(() => new AreaError({ message: "Could not read the Area conversation." })),
      );
  const forThread = Effect.fn("AreaContext.forThread")(function* (threadId: ThreadId) {
    const areas = yield* store.list();
    if (areas.length === 0) return null;
    const seen = new Set<ThreadId>();
    let id: ThreadId | null = threadId;
    while (id !== null && !seen.has(id)) {
      const currentId: ThreadId = id;
      seen.add(currentId);
      const thread = yield* readThread(currentId);
      if (thread === null || thread.deletedAt !== null) return null;
      const area = areas.find(
        (item) => item.leadThreadId === currentId || item.threadIds.includes(currentId),
      );
      if (area !== undefined) return area;
      id = thread.lineage.parentThreadId;
    }
    return null;
  });
  const save = Effect.fn("AreaContext.save")(function* (input: AreaSaveInput) {
    for (const id of new Set([input.area.leadThreadId, ...input.area.threadIds])) {
      const thread = yield* readThread(id);
      if (thread === null || thread.deletedAt !== null)
        return yield* new AreaError({
          message: "Choose conversations that exist on this environment.",
        });
    }
    return yield* store.save(input);
  });
  return AreaContext.of({ forThread, save });
});
export const layer = Layer.effect(AreaContext, make).pipe(Layer.provide(ProjectionStore.layer));
