import { useTranslation } from "react-i18next";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import { formatDateTime, formatName } from "@/Utils/utils";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

interface AuditLogsProps {
  title?: string;
}

export const AuditLogs = ({ title }: AuditLogsProps = {}) => {
  const { t } = useTranslation();
  const { selectedEncounter: encounter } = useEncounter();

  if (!encounter) return <CardListSkeleton count={1} />;

  return (
    <section
      aria-label={title ?? t("audit_information")}
      className="min-w-0 rounded-xl border border-gray-200 bg-white p-3 [overflow-wrap:anywhere]"
    >
      {title && (
        <h3 className="mb-3 border-b border-gray-200 pb-3 text-sm font-bold uppercase tracking-wide text-gray-600">
          {title}
        </h3>
      )}
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
    </section>
  );
};
