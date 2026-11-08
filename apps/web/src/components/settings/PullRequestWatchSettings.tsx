import { Switch } from "../ui/switch";
import { SettingsRow, SettingsSection } from "./settingsLayout";
import { searchableSetting } from "./settingsSearch";
import {
  useScopedSettings,
  useScopedSettingsMixed,
  useUpdateScopedSettings,
} from "./useScopedSettings";

export function PullRequestWatchSettingsSection() {
  const ignoreBots = useScopedSettings((settings) => settings.pullRequestWatchIgnoreBots);
  const updateSettings = useUpdateScopedSettings();
  const mixed = useScopedSettingsMixed(["pullRequestWatchIgnoreBots"]);

  return (
    <SettingsSection title="Pull request watching">
      <SettingsRow
        serverScoped
        settingKeys={["pullRequestWatchIgnoreBots"]}
        mixed={mixed}
        {...searchableSetting("pull-request-watch-ignore-bots")}
        description="Comments from bot accounts, such as CI, deploy, and review bots, do not wake an agent watching its pull request. Failed checks, conflicts, and comments from people still do."
        control={
          <Switch
            mixed={mixed}
            checked={mixed ? false : ignoreBots}
            onCheckedChange={(checked) =>
              updateSettings({ pullRequestWatchIgnoreBots: Boolean(checked) })
            }
            aria-label="Ignore bot comments"
          />
        }
      />
    </SettingsSection>
  );
}
