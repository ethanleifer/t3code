import { describe, expect, it } from "vite-plus/test";
import { buildThreadTagMenu, threadTagAction } from "./threadTagMenu";

describe("thread tag menus", () => {
  it("uses exact names, preserves arbitrary colors, and removes undefined legacy tags", () => {
    const menu = buildThreadTagMenu([
      {
        canTag: true,
        definitions: [
          { name: "Review", color: "#Aa10FF" },
          { name: "review", color: "#123456" },
        ],
        tags: ["Review", "section:old"],
      },
    ]);
    expect(menu.children).toMatchObject([
      { id: "tag:remove:Review", swatch: "#Aa10FF", checked: true },
      { id: "tag:add:review", swatch: "#123456", checked: false },
      { id: "tag:remove:section:old", checked: true },
      { id: "manage-tags" },
    ]);
    expect(threadTagAction("tag:remove:section:old")).toEqual({
      tag: "section:old",
      tagged: false,
    });
  });

  it("offers shared definitions and disables mutations if any destination denies permission", () => {
    const menu = buildThreadTagMenu([
      {
        canTag: true,
        definitions: [
          { name: "Review", color: "#112233" },
          { name: "Local", color: "#abcdef" },
        ],
        tags: ["Review"],
      },
      { canTag: false, definitions: [{ name: "Review", color: "#fedcba" }], tags: [] },
    ]);
    expect(menu.children).toMatchObject([
      { id: "tag:add:Review", checked: false, disabled: true },
      { id: "manage-tags" },
    ]);
    expect(menu.children?.at(-1)?.disabled).toBeUndefined();
  });
});
