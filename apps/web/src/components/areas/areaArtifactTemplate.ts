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
*{box-sizing:border-box}html{padding:0}body{margin:0;color:var(--foreground);background:var(--background);font:13px/1.65 var(--font-sans)}main{max-width:1000px;margin:auto;padding:24px}small{font-size:11px;color:var(--muted-foreground)}header{display:flex;justify-content:space-between;gap:16px;align-items:start}h1{font-size:18px;font-weight:600;line-height:1.4;letter-spacing:-.02em;margin:6px 0 8px}p{margin:0 0 12px}header p{max-width:600px;color:var(--muted-foreground)}.grid{display:grid;grid-template-columns:1.3fr 1fr;gap:24px;margin-top:20px}section{border-top:1px solid var(--border);padding-top:16px}h2{font-size:12px;font-weight:600;margin:0 0 10px}.context{font-size:12px;white-space:pre-wrap;color:var(--muted-foreground)}.decision{border:1px solid var(--border);border-radius:6px;padding:14px;margin-top:16px}.decision p{font-size:13px;margin:6px 0 12px}button{font:inherit;cursor:pointer;border:1px solid var(--border);background:var(--secondary);color:var(--secondary-foreground);border-radius:5px;padding:5px 10px;font-size:12px}button:hover{background:var(--muted)}button:focus-visible{outline:2px solid var(--ring);outline-offset:2px}label{display:flex;align-items:start;gap:8px;font-size:12px;margin:10px 0;cursor:pointer}input{accent-color:var(--primary);margin-top:4px}label:has(input:checked) span{text-decoration:line-through;color:var(--muted-foreground)}.note{font-size:11px;color:var(--muted-foreground);margin-top:20px}footer{margin-top:20px;color:var(--muted-foreground);font-size:10px}.hidden{display:none}@media(max-width:600px){main{padding:16px}.grid{grid-template-columns:1fr}header{display:block}}
</style>
</head>
<body><main>
<header><div><small>Overview</small><h1>${escapeText(area.name)}</h1><p>${escapeText(area.goal || "Make space for the bigger picture.")}</p></div></header>
<div class="grid"><div><section><h2>Where we are</h2><p class="context">${escapeText(area.brief || "Write the story of this work here. Use any layout, diagram, or interactive tool that helps.")}</p></section><div class="decision"><small>Next decision</small><p>What would make this work need less of your attention?</p><button id="reveal" type="button">Explore a direction</button><div id="direction" class="hidden"><p style="font:12px/1.7 var(--font-sans);margin:14px 0 0">Give each workstream a clear outcome and a next step. Bring decisions here; keep execution details in the threads.</p></div></div></div>
<div><section><h2>A useful next session</h2><label><input type="checkbox"><span>Make the outcome concrete</span></label><label><input type="checkbox"><span>Choose the next decision</span></label><label><input type="checkbox"><span>Hand an outcome to a workstream</span></label></section><div class="note">Edit the HTML to replace this overview with any document, diagram, or interactive tool.</div></div></div>
<footer>Sample interactions reset when the artifact reloads.</footer>
</main><script>document.getElementById('reveal').addEventListener('click',function(){var panel=document.getElementById('direction');panel.classList.toggle('hidden');this.textContent=panel.classList.contains('hidden')?'Explore a direction':'Hide direction';});</script></body></html>`;
}
