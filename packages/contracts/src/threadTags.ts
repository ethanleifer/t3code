import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import * as SchemaTransformation from "effect/SchemaTransformation";

import { TrimmedNonEmptyString } from "./baseSchemas.ts";

/** Tags match by exact spelling and case after trimming. */
export const ThreadTag = TrimmedNonEmptyString.check(
  Schema.isMaxLength(64),
  Schema.makeFilter((value) =>
    /[\p{Cc}]/u.test(value) ? "A thread tag must be a single line of text." : true,
  ),
);
export type ThreadTag = typeof ThreadTag.Type;

/** Tags read back from storage or a peer. Lenient so a later tag rule never fails a whole thread. */
export const StoredThreadTags = Schema.Array(Schema.String).pipe(
  Schema.catchDecoding(() => Effect.succeedSome([])),
);

export const ThreadTagColor = Schema.String.check(
  Schema.isPattern(/^#[0-9a-fA-F]{6}$/, { message: "A tag color must be a #rrggbb hex color." }),
);
export type ThreadTagColor = typeof ThreadTagColor.Type;

export const ThreadTagDefinition = Schema.Struct({
  name: ThreadTag,
  color: ThreadTagColor,
});
export type ThreadTagDefinition = typeof ThreadTagDefinition.Type;

export const MAX_THREAD_TAG_DEFINITIONS = 100;

export const THREAD_TAG_COLOR_PRESETS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
] as const satisfies readonly ThreadTagColor[];

export const ThreadTagDefinitions = Schema.Array(ThreadTagDefinition).check(
  Schema.isMaxLength(MAX_THREAD_TAG_DEFINITIONS),
  Schema.makeFilter((definitions) =>
    new Set(definitions.map((definition) => definition.name)).size === definitions.length
      ? true
      : "Thread tag names must be unique.",
  ),
);

const decodeThreadTagDefinition = Schema.decodeUnknownOption(ThreadTagDefinition);

/** Bad entries and repeated names drop alone, so a hand edit cannot reset settings. */
export const StoredThreadTagDefinitions = Schema.Array(Schema.Unknown).pipe(
  Schema.decodeTo(
    Schema.Array(ThreadTagDefinition),
    SchemaTransformation.transform<ReadonlyArray<ThreadTagDefinition>, ReadonlyArray<unknown>>({
      decode: (values) => {
        const names = new Set<string>();
        const definitions: Array<ThreadTagDefinition> = [];
        for (const value of values) {
          const definition = Option.getOrUndefined(decodeThreadTagDefinition(value));
          if (definition === undefined || names.has(definition.name)) continue;
          names.add(definition.name);
          definitions.push(definition);
          if (definitions.length === MAX_THREAD_TAG_DEFINITIONS) break;
        }
        return definitions;
      },
      encode: (definitions) => definitions,
    }),
  ),
);
