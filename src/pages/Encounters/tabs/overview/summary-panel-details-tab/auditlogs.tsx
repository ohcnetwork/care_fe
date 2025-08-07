import { useTranslation } from "react-i18next";

import { formatDateTime, formatName } from "@/Utils/utils";
import { EncounterRead } from "@/types/emr/encounter/encounter";

export const AuditLogs = ({ encounter }: { encounter: EncounterRead }) => {
  const { t } = useTranslation();

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
