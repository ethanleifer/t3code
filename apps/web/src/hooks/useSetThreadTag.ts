import { CommandId, type ScopedThreadRef, type ThreadTag } from "@t3tools/contracts";
import { randomUUID } from "../lib/utils";
import { threadEnvironment } from "../state/threads";
import { useAtomCommand } from "../state/use-atom-command";

export function useSetThreadTag() {
  const run = useAtomCommand(threadEnvironment.setTag);
  return (target: ScopedThreadRef, input: { tag: ThreadTag; tagged: boolean }) =>
    run({
      environmentId: target.environmentId,
      input: {
        type: "thread.tag.set",
        commandId: CommandId.make(randomUUID()),
        threadId: target.threadId,
        ...input,
      },
    });
}
