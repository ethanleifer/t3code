import type { PreviewArea } from "./areasPreview";

function escapeText(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function createAreaArtifact(area: Pick<PreviewArea, "name" | "goal" | "brief">) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeText(area.name)}</title>
<style>
body{margin:0;padding:24px;color:var(--foreground);background:var(--background);font:14px/1.7 var(--font-sans)}h1{font-size:18px;font-weight:600;margin:0 0 12px}p{white-space:pre-wrap;margin:0 0 16px}
</style>
</head>
<body><h1>${escapeText(area.name)}</h1><p>${escapeText(area.goal)}</p><p>${escapeText(area.brief)}</p></body>
</html>`;
}
