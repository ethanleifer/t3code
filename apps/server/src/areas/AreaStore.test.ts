import * as Exit from "effect/Exit";
import { assert, it } from "@effect/vitest";
import * as NodeServices from "@effect/platform-node/NodeServices";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import { AreaId, ThreadId } from "@t3tools/contracts";
import * as ServerConfig from "../config.ts";
import * as AreaStore from "./AreaStore.ts";

it.effect("keeps shared context across store instances and refuses stale writes", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const home = yield* fs.makeTempDirectoryScoped({ prefix: "t3-area-store-" });
    const layer = AreaStore.layer.pipe(Layer.provide(ServerConfig.layerTest(home, home)));
    const content = {
      id: AreaId.make("payments"),
      name: "Payments",
      goal: "Make checkout reliable",
      brief: "Do not merge without review",
      artifactHtml: "<h1>Payments</h1>",
      leadThreadId: ThreadId.make("lead"),
      threadIds: [ThreadId.make("worker")],
    };
    const first = yield* Effect.gen(function* () {
      const store = yield* AreaStore.AreaStore;
      const saved = yield* store.save({ area: content, expectedRevision: null });
      assert.strictEqual(saved.revision, 0);
      return saved;
    }).pipe(Effect.provide(layer));
    yield* Effect.gen(function* () {
      const store = yield* AreaStore.AreaStore;
      assert.deepStrictEqual(yield* store.get(content.id), first);
      const saved = yield* store.save({
        area: { ...content, brief: "New decision" },
        expectedRevision: 0,
      });
      assert.strictEqual(saved.revision, 1);
      const stale = yield* store.save({ area: content, expectedRevision: 0 }).pipe(Effect.flip);
      assert.include(stale.message, "changed");
      assert.strictEqual((yield* store.get(content.id))?.brief, "New decision");
      const competing = yield* Effect.all(
        [
          store
            .save({ area: { ...content, brief: "First writer" }, expectedRevision: 1 })
            .pipe(Effect.exit),
          store
            .save({ area: { ...content, brief: "Second writer" }, expectedRevision: 1 })
            .pipe(Effect.exit),
        ],
        { concurrency: "unbounded" },
      );
      assert.strictEqual(competing.filter(Exit.isSuccess).length, 1);
      assert.strictEqual((yield* store.get(content.id))?.revision, 2);
      yield* store.remove({ id: content.id, expectedRevision: 2 });
      assert.isNull(yield* store.get(content.id));
    }).pipe(Effect.provide(layer));
  }).pipe(Effect.provide(NodeServices.layer)),
);
