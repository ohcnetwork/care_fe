import { SquarePen } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

export const HospitalizationDetails = () => {
  const { t } = useTranslation();
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
    <div className="bg-gray-100 rounded-md w-full border border-gray-200 pt-2 p-1 space-y-1">
      <div className="flex justify-between items-center text-gray-950 pl-2">
        <span className="font-semibold">{t("hospitalisation_details")}</span>
        {canWriteSelectedEncounter && (
          <Button variant="ghost" size="sm" asChild>
            <Link
              href={`/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/encounter`}
            >
              <SquarePen className="size-4 cursor-pointer" strokeWidth={1.5} />
            </Link>
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-2 bg-white rounded-md shadow p-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-950 font-semibold">
            {t("hospitalisation")}
          </span>
          {encounter.hospitalization?.re_admission && (
            <Badge variant="blue">{t("re_admission")}</Badge>
          )}
        </div>
        <div className="flex flex-row gap-2 bg-gray-100 rounded-md border border-gray-200">
          <div className="flex flex-col p-2">
            <span className="text-sm">{t("admission_source")}</span>
            <span className="text-sm text-black font-semibold">
              {t(
                encounter.hospitalization?.admit_source
                  ? `encounter_admit_sources__${encounter.hospitalization?.admit_source}`
                  : "--",
              )}
            </span>
          </div>
          <div className="flex flex-col p-2">
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
    </div>
  );
};
