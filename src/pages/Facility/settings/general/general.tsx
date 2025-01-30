import { useTranslation } from "react-i18next";

interface GeneralSettingsProps {
  facilityId: string;
}

export function GeneralSettings({ facilityId }: GeneralSettingsProps) {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-2xl font-bold">{t("facility.settings.general")}</h2>
      <div className="mt-4">{facilityId}</div>
      {/* Add general settings form here */}
    </div>
  );
}
