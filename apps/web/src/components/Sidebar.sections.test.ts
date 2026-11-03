import { describe, expect, it } from "vite-plus/test";

import { groupThreadsBySection, planThreadSectionTags } from "./Sidebar.sections.ts";

describe("groupThreadsBySection", () => {
  it("puts unsectioned threads first, then sections by name, keeping shelf order within each", () => {
    const threads = [
      { id: "a", tags: ["section:Work"] },
      { id: "b", tags: ["hidden"] },
      { id: "c", tags: ["section:Home"] },
      { id: "d", tags: ["section:Work"] },
      { id: "e", tags: undefined },
    ];
    expect(groupThreadsBySection(threads, (thread) => thread.tags).map((t) => t.id)).toEqual([
      "b",
      "e",
      "c",
      "a",
      "d",
    ]);
  });
});

describe("planThreadSectionTags", () => {
  it.each([
    {
      name: "moves between sections, keeping other tags",
      tags: ["hidden", "section:Home"],
      next: "Work",
      changes: [
        { tag: "section:Home", tagged: false },
        { tag: "section:Work", tagged: true },
      ],
    },
    {
      name: "removes every section tag",
      tags: ["section:Home", "hidden"],
      next: null,
      changes: [{ tag: "section:Home", tagged: false }],
    },
    {
      name: "is a no-op for the current section",
      tags: ["section:Work"],
      next: "Work",
      changes: [],
    },
    {
      name: "adds a section to an untagged thread",
      tags: undefined,
      next: "Work",
      changes: [{ tag: "section:Work", tagged: true }],
    },
  ])("$name", ({ tags, next, changes }) => {
    expect(planThreadSectionTags(tags, next)).toEqual(changes);
  });
});
