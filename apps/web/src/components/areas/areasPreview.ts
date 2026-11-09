import { randomUUID } from "../../lib/utils";
import { EnvironmentId, ThreadId, type ScopedThreadRef } from "@t3tools/contracts";
import * as Schema from "effect/Schema";
import type { SidebarThreadSummary } from "../../types";
import { resolveSidebarThreadStatus } from "../Sidebar.logic";

export const WORKSTREAM_STATES = ["needs-you", "working", "waiting", "done"] as const;
export type WorkstreamState = (typeof WORKSTREAM_STATES)[number];
export const WORKSTREAM_LABELS: Record<WorkstreamState, string> = {
  "needs-you": "Needs you",
  working: "In progress",
  waiting: "Waiting",
  done: "Done",
};
const Workstream = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  summary: Schema.String,
  nextAction: Schema.String,
  updates: Schema.Array(Schema.String),
  source: Schema.Union([
    Schema.Struct({ kind: Schema.Literal("sample"), state: Schema.Literals(WORKSTREAM_STATES) }),
    Schema.Struct({
      kind: Schema.Literal("thread"),
      environmentId: EnvironmentId,
      threadId: ThreadId,
    }),
  ]),
});
export type AreaWorkstream = typeof Workstream.Type;
const Message = Schema.Struct({
  id: Schema.String,
  role: Schema.Literals(["you", "lead"]),
  text: Schema.String,
});
export const PreviewArea = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  goal: Schema.String,
  brief: Schema.String,
  artifactHtml: Schema.optionalKey(Schema.String),
  workstreams: Schema.Array(Workstream),
  messages: Schema.Array(Message),
});
export type PreviewArea = typeof PreviewArea.Type;
export const AreasPreviewState = Schema.Struct({
  areas: Schema.Array(PreviewArea),
  selectedAreaId: Schema.String,
});
export const AREAS_PREVIEW_STORAGE_KEY = "t3code:areas-preview:v1";

export const INITIAL_AREAS: typeof AreasPreviewState.Type = {
  selectedAreaId: "personal-workflow",
  areas: [
    {
      id: "personal-workflow",
      name: "Personal T3 workflow",
      goal: "Spend less time managing threads. Keep the work moving, and bring me the decisions that matter.",
      brief:
        "We’re making T3 a calmer place to direct several agents at once. Sidebar improvements have landed. Topic grouping needs a product decision, and the next step is exploring an Area that keeps the whole picture in view.\n\nKeep changes small and reviewable. Show evidence with each handoff. Leave final merge decisions with me.",
      workstreams: [
        {
          id: "topics",
          title: "Topic grouping",
          summary:
            "An optional category on a tag lets you group by topic while keeping built-in status sorting.",
          nextAction: "Try topic categories and decide whether the grouping feels useful.",
          updates: [
            "A draft is ready for your review.",
            "Existing tags keep working without a category.",
          ],
          source: { kind: "sample", state: "needs-you" },
        },
        {
          id: "areas",
          title: "Explore the next level of work",
          summary:
            "A shared brief, one lead conversation, and ordinary threads underneath. Talk to the lead and open the shared artifact when you need the bigger picture.",
          nextAction: "Open the shared artifact, inspect a workstream, and return to the lead.",
          updates: [
            "The overview is the starting point.",
            "Every workstream keeps its own context and handoff.",
          ],
          source: { kind: "sample", state: "working" },
        },
        {
          id: "reviews",
          title: "Keep reviews moving",
          summary: "Track review handoffs and surface the next action when someone needs you.",
          nextAction: "Waiting for a reviewer. Try a review update in this sample workstream.",
          updates: [
            "The review request has been shared.",
            "A follow-up belongs here, beside the work it concerns.",
          ],
          source: { kind: "sample", state: "waiting" },
        },
        {
          id: "sidebar",
          title: "A quieter sidebar",
          summary:
            "Settled threads stay separate. Pins lead their groups. Tags sit quietly beside pull requests.",
          nextAction: "No action needed. The result stays available as context.",
          updates: ["The settling, sorting, and card label changes have landed."],
          source: { kind: "sample", state: "done" },
        },
      ],
      messages: [
        {
          id: "welcome",
          role: "lead",
          text: "I’ll keep the goal and the workstreams together here. Start with what needs you, open a workstream for the details, or leave a direction for the next handoff. This is a local preview; these sample responses don’t run an agent.",
        },
      ],
    },
  ],
};

export function workstreamState(
  stream: AreaWorkstream,
  thread: SidebarThreadSummary | undefined,
): WorkstreamState {
  if (stream.source.kind === "sample") return stream.source.state;
  if (thread === undefined) return "waiting";
  if (thread.settledOverride === "settled") return "done";
  const status = resolveSidebarThreadStatus(thread);
  switch (status) {
    case "approval":
    case "input":
    case "request":
    case "failed":
    case "limited":
      return "needs-you";
    case "working":
    case "preparing":
      return "working";
    case "ready":
      return thread.latestRun === null ? "waiting" : "needs-you";
    case "waiting":
      return "waiting";
  }
}

export function attachAreaThread(
  area: PreviewArea,
  ref: ScopedThreadRef,
  title: string,
): PreviewArea {
  if (
    area.workstreams.some(
      (stream) =>
        stream.source.kind === "thread" &&
        stream.source.environmentId === ref.environmentId &&
        stream.source.threadId === ref.threadId,
    )
  )
    return area;
  return {
    ...area,
    workstreams: [
      ...area.workstreams,
      {
        id: randomUUID(),
        title,
        summary: "Attached from your T3 threads. Its status follows the original thread.",
        nextAction: "Open the original thread to continue working with its agent.",
        updates: ["Attached to this Area. The original thread is unchanged."],
        source: { kind: "thread", ...ref },
      },
    ],
  };
}
