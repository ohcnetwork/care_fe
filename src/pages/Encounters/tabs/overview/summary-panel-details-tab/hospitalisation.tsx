import { SquarePen } from "lucide-react";
import { Link, useFullPath } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

interface HospitalizationDetailsProps {
  title?: string;
}

export const HospitalizationDetails = ({
  title,
}: HospitalizationDetailsProps = {}) => {
  const { t } = useTranslation();
  const returnPage = useFullPath().split("/").pop() ?? "updates";
  const {
    selectedEncounter: encounter,
    selectedEncounterId: encounterId,
    patientId,
    facilityId,
    canWriteSelectedEncounter,
  } = useEncounter();

  if (!encounter) return <CardListSkeleton count={1} />;

  const hasHospitalization =
    encounter.hospitalization?.admit_source ||
    encounter.hospitalization?.diet_preference ||
    encounter.hospitalization?.re_admission;

  if (!hasHospitalization) return null;

  return (
    <section
      aria-label={title ?? t("hospitalisation_details")}
      className="min-w-0 w-full rounded-xl border border-gray-200 bg-white"
    >
      <div className="flex min-h-11 items-center justify-between gap-2 border-b border-gray-200 px-3 py-1">
        <span className="min-w-0 [overflow-wrap:anywhere] text-sm font-bold uppercase tracking-wide text-gray-600">
          {title ?? t("hospitalisation_details")}
        </span>
        {canWriteSelectedEncounter && (
          <Button variant="ghost" size="sm" className="shrink-0" asChild>
            <Link
              href={`/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/encounter?${new URLSearchParams({ return_page: returnPage })}`}
              aria-label={t("edit")}
            >
              <SquarePen className="size-4 cursor-pointer" strokeWidth={1.5} />
            </Link>
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-3 p-3">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <span className="text-gray-950 font-semibold">
            {t("hospitalisation")}
          </span>
          {encounter.hospitalization?.re_admission && (
            <Badge variant="blue">{t("re_admission")}</Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-white [overflow-wrap:anywhere]">
          <div className="flex min-w-0 flex-1 flex-col p-2">
            <span className="text-sm">{t("admission_source")}</span>
            <span className="text-sm text-black font-semibold">
              {t(
                encounter.hospitalization?.admit_source
                  ? `encounter_admit_sources__${encounter.hospitalization?.admit_source}`
                  : "--",
              )}
            </span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col p-2">
            <span className="text-sm">{t("diet_preference")}</span>
            <span className="text-sm text-black font-semibold">
              {t(
                encounter.hospitalization?.diet_preference
                  ? `encounter_diet_preference__${encounter.hospitalization?.diet_preference}`
                  : "--",
              )}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
