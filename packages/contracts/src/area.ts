import * as Schema from "effect/Schema";
import { NonNegativeInt, ThreadId, TrimmedNonEmptyString } from "./baseSchemas.ts";

export const AreaId = Schema.String.check(Schema.isPattern(/^[a-zA-Z0-9_-]{1,80}$/)).pipe(
  Schema.brand("AreaId"),
);
export type AreaId = typeof AreaId.Type;
export const AreaContent = Schema.Struct({
  id: AreaId,
  name: TrimmedNonEmptyString,
  goal: Schema.String.check(Schema.isMaxLength(8_000)),
  brief: Schema.String.check(Schema.isMaxLength(32_000)),
  artifactHtml: Schema.String.check(Schema.isMaxLength(1_000_000)),
  leadThreadId: ThreadId,
  threadIds: Schema.Array(ThreadId),
});
export const Area = Schema.Struct({ ...AreaContent.fields, revision: NonNegativeInt });
export type Area = typeof Area.Type;
export const AreaSaveInput = Schema.Struct({
  area: AreaContent,
  expectedRevision: Schema.NullOr(NonNegativeInt),
});
export type AreaSaveInput = typeof AreaSaveInput.Type;
export class AreaError extends Schema.TaggedError<AreaError>()("AreaError", {
  message: Schema.String,
}) {}
