import { useTranslation } from "react-i18next";

interface NotificationsSettingsProps {
  facilityId: string;
}

export function NotificationsSettings({
  facilityId,
}: NotificationsSettingsProps) {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-2xl font-bold">
        {t("facility.settings.notifications")}
        <div className="mt-4">{facilityId}</div>
      </h2>
      {/* Add notifications settings form here */}
    </div>
  );
}
