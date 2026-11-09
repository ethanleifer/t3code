import { expect, it } from "vite-plus/test";
import { render } from "../../../test/render";
import { AreaArtifact } from "./AreaArtifact";

it("runs arbitrary artifact scripts while keeping the app document isolated", async () => {
  using listeners = new DisposableStack();
  const ready = new Promise<string>((resolve) => {
    const receive = (event: MessageEvent<unknown>) => {
      if (event.data === "areas-artifact-isolated" || event.data === "areas-artifact-exposed")
        resolve(event.data);
    };
    window.addEventListener("message", receive);
    listeners.defer(() => window.removeEventListener("message", receive));
  });
  await using screen = await render(
    <AreaArtifact
      html={`<!doctype html><button id="test">Interact</button><script>document.getElementById('test').onclick = function () { try { parent.document.body; parent.postMessage('areas-artifact-exposed', '*'); } catch { parent.postMessage('areas-artifact-isolated', '*'); } }; document.getElementById('test').click();</script>`}
      onSave={() => {}}
    />,
  );
  await expect.element(screen.getByRole("button", { name: "Edit HTML" })).toBeVisible();
  expect(await ready).toBe("areas-artifact-isolated");
});
