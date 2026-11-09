import { EnvironmentId, ThreadId } from "@t3tools/contracts";
import * as Schema from "effect/Schema";
import { describe, expect, it } from "vite-plus/test";
import { createAreaArtifact } from "./areaArtifactTemplate";
import { makeThreadFixture } from "../../test-fixtures";
import {
  AreasPreviewState,
  INITIAL_AREAS,
  attachAreaThread,
  workstreamState,
  type AreaWorkstream,
  type PreviewArea,
} from "./areasPreview";

const area: PreviewArea = {
  id: "test",
  name: "Area",
  goal: "Goal",
  brief: "Context",
  workstreams: [],
  messages: [],
};
const ref = { environmentId: EnvironmentId.make("local"), threadId: ThreadId.make("thread") };
const linked: AreaWorkstream = {
  id: "linked",
  title: "Thread",
  summary: "",
  nextAction: "",
  updates: [],
  source: { kind: "thread", ...ref },
};

describe("Areas preview", () => {
  it("round-trips the brief, directions, samples and scoped thread links through browser storage", () => {
    const state = {
      ...INITIAL_AREAS,
      areas: [
        attachAreaThread(
          {
            ...area,
            brief: "A decision\n\nMore context",
            artifactHtml:
              '<style>body{background:navy}</style><button onclick="this.textContent=1">Custom</button>',
            messages: [{ id: "note", role: "you", text: "Keep it simple" }],
          },
          ref,
          "Original",
        ),
      ],
    };
    const json = Schema.fromJsonString(AreasPreviewState);
    expect(Schema.decodeSync(json)(Schema.encodeSync(json)(state))).toEqual(state);
    expect(() => Schema.decodeSync(json)('{"areas":[],"selectedAreaId":1}')).toThrow();
  });

  it("keeps user context as text in the starter artifact", () => {
    const html = createAreaArtifact({
      name: '</title><script>alert("title")</script>',
      goal: '<img src=x onerror="alert(1)">',
      brief: "A & B",
    });
    expect(html).toContain("&lt;/title&gt;&lt;script&gt;alert(&quot;title&quot;)&lt;/script&gt;");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(html).toContain("A &amp; B");
    expect(html).not.toContain("<img src=x");
  });

  it("attaches once per scoped thread without mutating the Area and keeps other environments distinct", () => {
    const attached = attachAreaThread(area, ref, "First");
    expect(area.workstreams).toEqual([]);
    expect(attached.workstreams).toHaveLength(1);
    expect(attachAreaThread(attached, ref, "Renamed")).toBe(attached);
    const remote = attachAreaThread(
      attached,
      { ...ref, environmentId: EnvironmentId.make("remote") },
      "Remote",
    );
    expect(remote.workstreams).toHaveLength(2);
    expect(remote.workstreams.map((stream) => stream.source)).toEqual([
      { kind: "thread", ...ref },
      { kind: "thread", ...ref, environmentId: EnvironmentId.make("remote") },
    ]);
  });

  it("derives linked attention from the current thread and keeps sample status independent", () => {
    const idle = makeThreadFixture();
    expect(workstreamState(linked, undefined)).toBe("waiting");
    expect(workstreamState(linked, idle)).toBe("waiting");
    expect(workstreamState(linked, { ...idle, hasPendingApprovals: true })).toBe("needs-you");
    expect(workstreamState(linked, { ...idle, hasPendingUserInput: true })).toBe("needs-you");
    expect(workstreamState(linked, { ...idle, settledOverride: "settled" })).toBe("done");
    expect(
      workstreamState(
        { ...linked, source: { kind: "sample", state: "working" } },
        { ...idle, settledOverride: "settled" },
      ),
    ).toBe("working");
  });
});
