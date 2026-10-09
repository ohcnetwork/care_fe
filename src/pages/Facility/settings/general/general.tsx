import { useTranslation } from "react-i18next";

import PageHeadTitle from "@/components/Common/PageHeadTitle";
import { FacilityHome } from "@/components/Facility/FacilityHome";

import { useShortcutSubContext } from "@/context/ShortcutContext";

import { FacilityOverviewActions } from "./FacilityOverviewActions";

interface GeneralSettingsProps {
  facilityId: string;
}

export function GeneralSettings({ facilityId }: GeneralSettingsProps) {
  const { t } = useTranslation();
  useShortcutSubContext(undefined);

  return (
    <div className="space-y-6 text-neutral-950" data-cy="facility-general-page">
      <PageHeadTitle title={t("general")} />
      <h1 className="text-3xl leading-9 font-bold tracking-tight">
        {t("general")}
      </h1>
      <FacilityHome
        facilityId={facilityId}
        appearance="settings"
        renderSettingsActions={(disabled) => (
          <FacilityOverviewActions
            facilityId={facilityId}
            disabled={disabled}
          />
        )}
      />
    </div>
  );
}
