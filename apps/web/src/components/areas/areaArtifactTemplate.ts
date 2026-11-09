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
*{box-sizing:border-box}body{margin:0;background:#f5f3ed;color:#292d29;font:14px/1.65 system-ui,sans-serif}main{max-width:1000px;margin:auto;padding:32px}small{font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:#687164}header{display:flex;justify-content:space-between;gap:20px;align-items:start}h1{font:500 32px/1.15 Georgia,serif;letter-spacing:-.04em;margin:12px 0 16px}p{margin:0 0 16px}header p{max-width:530px;color:#62695f}.stamp{background:#e4e8da;padding:7px 12px;border-radius:30px;font-size:10px;white-space:nowrap}.grid{display:grid;grid-template-columns:1.3fr 1fr;gap:24px;margin-top:20px}section{border-top:1px solid #d3d7cb;padding-top:18px}h2{font-size:13px;margin:0 0 12px}.context{font-size:12px;white-space:pre-wrap;color:#62695f}.decision{background:#e9ecdf;border-radius:6px;padding:18px;margin-top:22px}.decision p{font:20px/1.4 Georgia,serif;margin-bottom:14px}button{font:inherit;cursor:pointer;border:1px solid #bfc7b5;background:transparent;color:#35472d;border-radius:5px;padding:7px 12px;font-size:11px}button:hover{background:#dbe2d0}button:focus-visible{outline:2px solid #536946;outline-offset:3px}label{display:flex;align-items:start;gap:10px;font-size:12px;margin:12px 0;cursor:pointer}input{accent-color:#536946;margin-top:5px}label:has(input:checked) span{text-decoration:line-through;color:#7f8979}.note{padding:14px;border-left:2px solid #a7b697;font-size:12px;color:#62695f;margin-top:22px}footer{margin-top:28px;color:#7a8174;font-size:10px}.hidden{display:none}@media(max-width:600px){main{padding:24px}.grid{grid-template-columns:1fr}header{display:block}.stamp{display:inline-block;margin-bottom:10px}h1{font-size:28px}}
</style>
</head>
<body><main>
<header><div><small>The bigger picture / living canvas</small><h1>${escapeText(area.name)}</h1><p>${escapeText(area.goal || "Make space for the bigger picture.")}</p></div><span class="stamp">Your canvas</span></header>
<div class="grid"><div><section><h2>Where we are</h2><p class="context">${escapeText(area.brief || "Write the story of this work here. Use any layout, diagram, or interactive tool that helps.")}</p></section><div class="decision"><small>A question to carry forward</small><p>What would make this work need less of your attention?</p><button id="reveal" type="button">Explore a direction</button><div id="direction" class="hidden"><p style="font:12px/1.7 system-ui;margin:14px 0 0">Give each workstream a clear outcome and a next step. Bring decisions here; keep execution details in the threads.</p></div></div></div>
<div><section><h2>A useful next session</h2><label><input type="checkbox"><span>Make the outcome concrete</span></label><label><input type="checkbox"><span>Choose the next decision</span></label><label><input type="checkbox"><span>Hand an outcome to a workstream</span></label></section><div class="note">This is just a starting point. Replace the entire canvas with your own HTML: a launch plan, live diagram, research wall, dashboard, or something we haven’t thought of.</div></div></div>
<footer>HTML + CSS + JavaScript. No prescribed sections. Demo interactions reset when the canvas reloads.</footer>
</main><script>document.getElementById('reveal').addEventListener('click',function(){var panel=document.getElementById('direction');panel.classList.toggle('hidden');this.textContent=panel.classList.contains('hidden')?'Explore a direction':'Hide direction';});</script></body></html>`;
}
