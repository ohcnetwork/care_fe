import { useTranslation } from "react-i18next";

interface UsersSettingsProps {
  facilityId: string;
}

export function UsersSettings({ facilityId }: UsersSettingsProps) {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-2xl font-bold">{t("facility.settings.users")}</h2>
      <div className="mt-4">{facilityId}</div>
      {/* Add users settings form here */}
    </div>
  );
}
