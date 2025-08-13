import { SquarePen } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

export const HospitalizationDetails = () => {
  const { t } = useTranslation();
  const {
    selectedEncounter: encounter,
    selectedEncounterId: encounterId,
    patientId,
    facilityId,
  } = useEncounter();

  if (!encounter) return null;

  return (
    <div className="bg-gray-100 rounded-md w-full border border-gray-200 pt-2">
      <div className="flex justify-between items-center px-3 pt-1 text-gray-950 pb-2 pr-2">
        <span className="font-semibold">{t("hospitalisation")}</span>
        <Button variant="ghost" size="xs" asChild>
          <Link
            href={`/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/encounter`}
          >
            <SquarePen className="size-4 cursor-pointer" strokeWidth={1.5} />
          </Link>
        </Button>
      </div>
      <div className="flex flex-col gap-2 bg-white rounded-md shadow mx-1 mb-1">
        <div className="flex justify-between items-center p-2">
          <span className="text-gray-950 font-semibold">
            {t("hospitalisation")}
          </span>
          <Badge variant="blue">
            {encounter.hospitalization?.re_admission
              ? t("re_admission")
              : t("new_admission")}
          </Badge>
        </div>
        <div className="flex flex-row gap-2 bg-gray-100 rounded-md mx-3 mb-3 border border-gray-200">
          <div className="flex flex-col p-2">
            <span className="text-sm">{t("admission_source")}</span>
            <span className="text-sm text-black font-semibold">
              {t(
                encounter.hospitalization?.admit_source
                  ? `encounter_admit_sources__${encounter.hospitalization?.admit_source}`
                  : "encounter_admit_sources__other",
              )}
            </span>
          </div>
          <div className="flex flex-col p-2">
            <span className="text-sm">{t("diet_preference")}</span>
            <span className="text-sm text-black font-semibold">
              {t(
                encounter.hospitalization?.diet_preference
                  ? `encounter_diet_preference__${encounter.hospitalization?.diet_preference}`
                  : "encounter_diet_preference__none",
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
