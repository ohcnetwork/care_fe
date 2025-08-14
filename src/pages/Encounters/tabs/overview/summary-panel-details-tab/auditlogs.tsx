import { useTranslation } from "react-i18next";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import { formatDateTime, formatName } from "@/Utils/utils";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

export const AuditLogs = () => {
  const { t } = useTranslation();
  const { selectedEncounter: encounter } = useEncounter();

  if (!encounter) return <CardListSkeleton count={1} />;

  return (
    <div className="p-2">
      <div className="space-y-2">
        <div>
          <p className="text-sm text-gray-500">{t("last_modified_by")}</p>
          <p className="text-sm font-semibold">
            {formatName(encounter.updated_by)}
          </p>
          <p className="text-xs text-gray-500">
            {formatDateTime(encounter.modified_date)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">{t("created_by")}</p>
          <p className="text-sm font-semibold">
            {formatName(encounter.created_by)}
          </p>
          <p className="text-xs text-gray-500">
            {formatDateTime(encounter.created_date)}
          </p>
        </div>
      </div>
    </div>
  );
};
