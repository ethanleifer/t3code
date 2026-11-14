import type { Area, ThreadId } from "@t3tools/contracts";

export function areaTurnContext(area: Area, threadId: ThreadId, text: string): string {
  if (text.trimStart().startsWith("/")) return "";
  const lead = area.leadThreadId === threadId;
  const role = lead
    ? "You are the Area lead. Answer quick questions here. Delegate concrete work as background T3 workstreams with delegate_task, and bring results and decisions back here. Reuse relevant workstreams for follow-ups. Keep the shared brief and HTML overview current with area_context. Do not create work the user did not request."
    : "You are a workstream in this Area. Complete your assigned task and report the result to your delegating lead. Use area_context to read the latest brief and overview before revising either. Do not start additional agents unless your task explicitly asks for them.";
  return `<t3_area_context>\n${JSON.stringify({
    id: area.id,
    name: area.name,
    goal: area.goal,
    brief: area.brief,
    revision: area.revision,
    role: lead ? "lead" : "workstream",
  })}\n${role}\n</t3_area_context>`;
}
