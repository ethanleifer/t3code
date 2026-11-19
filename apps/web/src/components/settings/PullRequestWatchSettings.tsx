import { useGT } from "gt-react";

import { Switch } from "../ui/switch";
import { SettingsRow, SettingsSection } from "./settingsLayout";
import { useSearchableSetting } from "./settingsSearch";
import {
  useScopedSettings,
  useScopedSettingsMixed,
  useUpdateScopedSettings,
} from "./useScopedSettings";

export function PullRequestWatchSettingsSection() {
  const ignoreBots = useScopedSettings((settings) => settings.pullRequestWatchIgnoreBots);
  const updateSettings = useUpdateScopedSettings();
  const mixed = useScopedSettingsMixed(["pullRequestWatchIgnoreBots"]);
  const gt = useGT();
  const setting = useSearchableSetting();

  return (
    <SettingsSection title={gt("Pull request watching")}>
      <SettingsRow
        serverScoped
        settingKeys={["pullRequestWatchIgnoreBots"]}
        mixed={mixed}
        {...setting("pull-request-watch-ignore-bots")}
        description={gt(
          "Comments from bot accounts, such as CI, deploy, and review bots, do not wake an agent watching its pull request. Failed checks, conflicts, and comments from people still do.",
        )}
        control={
          <Switch
            mixed={mixed}
            checked={mixed ? false : ignoreBots}
            onCheckedChange={(checked) =>
              updateSettings({ pullRequestWatchIgnoreBots: Boolean(checked) })
            }
            aria-label={gt("Ignore bot comments")}
          />
        }
      />
    </SettingsSection>
  );
}
