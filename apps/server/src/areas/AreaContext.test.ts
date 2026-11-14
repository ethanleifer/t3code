import { areaTurnContext } from "./areaPrompt.ts";
import { assert, it } from "@effect/vitest";
import * as NodeServices from "@effect/platform-node/NodeServices";
import * as DateTime from "effect/DateTime";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import {
  AreaId,
  EventId,
  ProjectId,
  ProviderInstanceId,
  ThreadId,
  type OrchestrationV2AppThread,
} from "@t3tools/contracts";
import * as ServerConfig from "../config.ts";
import * as Sqlite from "../persistence/Sqlite.ts";
import * as ProjectionStore from "../orchestration-v2/ProjectionStore.ts";
import * as AreaContext from "./AreaContext.ts";
import * as AreaStore from "./AreaStore.ts";

it.effect(
  "shares revised context with nested workers, keeps unrelated threads separate, and leaves native commands alone",
  () =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const home = yield* fs.makeTempDirectoryScoped({ prefix: "t3-area-context-" });
      const database = Sqlite.layerMemory;
      const projections = ProjectionStore.layer.pipe(Layer.provide(database));
      const stores = Layer.mergeAll(
        projections,
        AreaStore.layer.pipe(Layer.provide(ServerConfig.layerTest(home, home))),
      );
      yield* Effect.gen(function* () {
        const store = yield* ProjectionStore.ProjectionStoreV2;
        const areas = yield* AreaContext.AreaContext;
        const now = yield* DateTime.now;
        const lead = ThreadId.make("lead");
        const worker = ThreadId.make("worker");
        const nested = ThreadId.make("nested");
        const other = ThreadId.make("other");
        const create = (id: ThreadId, parent: ThreadId | null) => {
          const thread: OrchestrationV2AppThread = {
            id,
            projectId: ProjectId.make("project"),
            title: id,
            providerInstanceId: ProviderInstanceId.make("codex"),
            modelSelection: { instanceId: ProviderInstanceId.make("codex"), model: "test" },
            runtimeMode: "full-access",
            interactionMode: "default",
            branch: null,
            worktreePath: null,
            activeProviderThreadId: null,
            lineage: {
              parentThreadId: parent,
              relationshipToParent: parent ? "subagent" : null,
              rootThreadId: parent ? lead : id,
            },
            forkedFrom: null,
            createdBy: "user",
            creationSource: "web",
            createdAt: now,
            updatedAt: now,
            archivedAt: null,
            settledOverride: null,
            settledAt: null,
            lastVisitedAt: null,
            deletedAt: null,
          };
          return store.apply({
            id: EventId.make(`event:${id}`),
            type: "thread.created",
            threadId: id,
            occurredAt: now,
            payload: thread,
          });
        };
        yield* create(lead, null);
        yield* create(worker, lead);
        yield* create(nested, worker);
        yield* create(other, null);
        const first = yield* areas.save({
          expectedRevision: null,
          area: {
            id: AreaId.make("payments"),
            name: "Payments",
            goal: "Improve reliability",
            brief: "Review before merging",
            artifactHtml: "<h1>Payments</h1>",
            leadThreadId: lead,
            threadIds: [],
          },
        });
        assert.deepStrictEqual(yield* areas.forThread(nested), first);
        assert.isNull(yield* areas.forThread(other));
        const revised = yield* areas.save({
          expectedRevision: first.revision,
          area: { ...first, brief: "Release Friday", artifactHtml: "<h1>Friday release</h1>" },
        });
        assert.deepStrictEqual(yield* areas.forThread(worker), revised);
        assert.include(areaTurnContext(revised, lead, "Delegate the next task"), '"role":"lead"');
        assert.include(areaTurnContext(revised, worker, "Continue"), "Release Friday");
        assert.strictEqual(areaTurnContext(revised, lead, "/goal improve checkout"), "");
        assert.strictEqual(areaTurnContext(revised, lead, "/compact"), "");
        const missing = yield* areas
          .save({
            expectedRevision: revised.revision,
            area: { ...revised, leadThreadId: ThreadId.make("missing") },
          })
          .pipe(Effect.flip);
        assert.include(missing.message, "exist");
      }).pipe(
        Effect.provide(
          AreaContext.layer.pipe(
            Layer.provideMerge(stores),
            Layer.provide(ServerConfig.layerTest(home, home)),
            Layer.provide(database),
          ),
        ),
      );
    }).pipe(Effect.provide(NodeServices.layer)),
);
