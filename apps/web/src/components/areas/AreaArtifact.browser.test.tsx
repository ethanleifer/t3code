import { expect, it } from "vite-plus/test";
import { render } from "../../../test/render";
import { AreaArtifact } from "./AreaArtifact";

it("themes arbitrary artifact scripts while keeping the app document isolated", async () => {
  using listeners = new DisposableStack();
  const waitForMessage = (values: readonly string[]) =>
    new Promise<string>((resolve) => {
      const receive = (event: MessageEvent<unknown>) => {
        if (typeof event.data === "string" && values.includes(event.data)) resolve(event.data);
      };
      window.addEventListener("message", receive);
      listeners.defer(() => window.removeEventListener("message", receive));
    });
  const ready = waitForMessage(["areas-artifact-isolated", "areas-artifact-exposed"]);
  const themed = waitForMessage(["areas-theme-applied", "areas-theme-missing"]);
  await using screen = await render(
    <AreaArtifact
      html={`<!doctype html><button id="test">Interact</button><script>document.getElementById('test').onclick = function () { try { parent.document.body; parent.postMessage('areas-artifact-exposed', '*'); } catch { parent.postMessage('areas-artifact-isolated', '*'); } }; document.getElementById('test').click(); window.addEventListener('message', function(e) { var expected = e.data?.params?.styles?.variables; if (expected) parent.postMessage(getComputedStyle(document.documentElement).getPropertyValue('--background').trim() === expected['--background'] ? 'areas-theme-applied' : 'areas-theme-missing', '*'); });</script>`}
      onSave={() => {}}
    />,
  );
  await expect.element(screen.getByRole("button", { name: "Edit HTML" })).toBeVisible();
  expect(await ready).toBe("areas-artifact-isolated");
  expect(await themed).toBe("areas-theme-applied");
});
