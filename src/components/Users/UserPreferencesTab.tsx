import { Muted, SectionTitle } from "@/components/ui/typography";
import { useAtom } from "jotai";
import { Code2, Globe2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { developerModeAtom } from "@/atoms/developerMode";
import LanguageSelector from "@/components/Common/LanguageSelector";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { UserProfileSection } from "@/components/Users/UserProfileSection";

export default function UserPreferencesTab() {
  const { t } = useTranslation();
  const [developerMode, setDeveloperMode] = useAtom(developerModeAtom);
  return (
    <div className="max-w-3xl space-y-8 py-6">
      <div className="space-y-1.5">
        <SectionTitle>{t("USERMANAGEMENT_TAB__PREFERENCES")}</SectionTitle>
        <Muted>{t("profile_preferences_description")}</Muted>
      </div>
      <UserProfileSection
        title={t("language_selection")}
        icon={Globe2}
        description={t("set_your_local_language")}
      >
        <div className="max-w-xs">
          <LanguageSelector />
        </div>
      </UserProfileSection>
      <UserProfileSection title={t("developer_mode")} icon={Code2}>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="developer-mode" className="sr-only">
              {t("developer_mode")}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t("production_environment_warning_description")}
            </p>
          </div>
          <Switch
            id="developer-mode"
            checked={developerMode}
            onCheckedChange={setDeveloperMode}
          />
        </div>
      </UserProfileSection>
    </div>
  );
}
