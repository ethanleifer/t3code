import { Area, AreaError, type AreaId, type AreaSaveInput } from "@t3tools/contracts";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";
import * as Semaphore from "effect/Semaphore";
import * as ServerConfig from "../config.ts";

export class AreaStore extends Context.Service<
  AreaStore,
  {
    readonly list: () => Effect.Effect<readonly Area[], AreaError>;
    readonly get: (id: AreaId) => Effect.Effect<Area | null, AreaError>;
    readonly save: (input: AreaSaveInput) => Effect.Effect<Area, AreaError>;
    readonly remove: (input: {
      id: AreaId;
      expectedRevision: number;
    }) => Effect.Effect<void, AreaError>;
  }
>()("t3/areas/AreaStore") {}

const areaJson = Schema.fromJsonString(Area);
const decodeArea = Schema.decodeUnknownEffect(areaJson);
const encodeArea = Schema.encodeEffect(areaJson);

const make = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const config = yield* ServerConfig.ServerConfig;
  const directory = path.join(config.stateDir, "areas");
  const lock = yield* Semaphore.make(1);
  const failure = () => new AreaError({ message: "Could not read or save Area context." });
  const read = Effect.fn("AreaStore.read")(function* (id: AreaId) {
    const file = path.join(directory, `${id}.json`);
    if (!(yield* fs.exists(file))) return null;
    const source = yield* fs.readFileString(file);
    return yield* decodeArea(source);
  }, Effect.mapError(failure));
  const list = Effect.fn("AreaStore.list")(function* () {
    if (!(yield* fs.exists(directory).pipe(Effect.mapError(failure)))) return [];
    const names = yield* fs.readDirectory(directory).pipe(Effect.mapError(failure));
    return yield* Effect.forEach(
      names.filter((name) => name.endsWith(".json")),
      (name) =>
        Effect.gen(function* () {
          const source = yield* fs.readFileString(path.join(directory, name));
          return yield* decodeArea(source);
        }).pipe(Effect.mapError(failure)),
    );
  });
  const save = Effect.fn("AreaStore.save")(function* (input: AreaSaveInput) {
    return yield* lock.withPermit(
      Effect.gen(function* () {
        const previous = yield* read(input.area.id);
        if ((previous?.revision ?? null) !== input.expectedRevision)
          return yield* new AreaError({ message: "Area changed. Reload it before saving again." });
        const others = yield* list();
        const members = new Set([input.area.leadThreadId, ...input.area.threadIds]);
        if (
          others.some(
            (area) =>
              area.id !== input.area.id &&
              [area.leadThreadId, ...area.threadIds].some((id) => members.has(id)),
          )
        )
          return yield* new AreaError({
            message: "A conversation already belongs to another Area.",
          });
        const area = { ...input.area, revision: (previous?.revision ?? -1) + 1 };
        yield* fs.makeDirectory(directory, { recursive: true }).pipe(Effect.mapError(failure));
        const temporary = yield* fs
          .makeTempFile({ directory, prefix: ".area-" })
          .pipe(Effect.mapError(failure));
        const encoded = yield* encodeArea(area).pipe(Effect.mapError(failure));
        yield* fs
          .writeFileString(temporary, encoded)
          .pipe(
            Effect.andThen(fs.rename(temporary, path.join(directory, `${area.id}.json`))),
            Effect.ensuring(fs.remove(temporary).pipe(Effect.ignore)),
            Effect.mapError(failure),
          );
        return area;
      }),
    );
  });
  const remove = Effect.fn("AreaStore.remove")(function* (input: {
    id: AreaId;
    expectedRevision: number;
  }) {
    return yield* lock.withPermit(
      Effect.gen(function* () {
        const area = yield* read(input.id);
        if (area === null) return;
        if (area.revision !== input.expectedRevision)
          return yield* new AreaError({ message: "Area changed. Reload it before removing it." });
        yield* fs.remove(path.join(directory, `${input.id}.json`)).pipe(Effect.mapError(failure));
      }),
    );
  });
  return AreaStore.of({ list, get: read, save, remove });
});
export const layer = Layer.effect(AreaStore, make);
