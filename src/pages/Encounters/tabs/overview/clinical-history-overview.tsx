import { useQuery } from "@tanstack/react-query";
import { DropletIcon } from "lucide-react";
import { Link, usePath } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { AllergyIcon } from "@/CAREUI/icons/CustomIcons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import query from "@/Utils/request/query";
import { formatTruncatedList } from "@/Utils/utils";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import allergyIntoleranceApi from "@/types/emr/allergyIntolerance/allergyIntoleranceApi";
import { completedEncounterStatus } from "@/types/emr/encounter/encounter";

export const ClinicalHistoryOverview = (props: React.ComponentProps<"div">) => {
  const { t } = useTranslation();
  const { facilityId, patientId, patient, primaryEncounter } = useEncounter();

  const { data: allergies } = useQuery({
    queryKey: ["allergies", patientId, "confirmed"],
    queryFn: query(allergyIntoleranceApi.getAllergy, {
      pathParams: { patientId },
      queryParams: {
        verification_status: "confirmed",
      },
    }),
    // Voluntarily doing as this is available only if permitted.
    enabled:
      primaryEncounter &&
      !completedEncounterStatus.includes(primaryEncounter.status),
  });

  const sourceUrl = usePath();
  return (
    <div
      {...props}
      className={cn(
        "bg-white rounded-lg p-4 border border-gray-200",
        props.className,
      )}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-row gap-3">
          <div className="flex flex-col items-start gap-1 whitespace-nowrap">
            <span className="text-sm font-medium text-gray-600">
              {t("blood_group")}:
            </span>
            <Badge variant="destructive">
              <DropletIcon className="size-4" />
              <span>
                {t(`BLOOD_GROUP_LONG__${patient?.blood_group || "unknown"}`)}
              </span>
            </Badge>
          </div>
          {!!allergies?.results.length && (
            <div className="flex flex-col items-start gap-1">
              <span className="text-sm font-medium text-gray-600">
                {t("allergies")}:
              </span>
              <Badge variant="yellow">
                <div>
                  <AllergyIcon className="size-4" />
                </div>
                <span>
                  {formatTruncatedList(
                    allergies?.results || [],
                    2,
                    (allergy) => allergy.code.display,
                  )}
                </span>
              </Badge>
            </div>
          )}
        </div>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="md:w-auto w-full"
        >
          <Link
            href={
              facilityId
                ? `/facility/${facilityId}/patient/${patientId}/history/symptoms?sourceUrl=${encodeURIComponent(sourceUrl ?? "")}`
                : `/patient/${patientId}/history/symptoms?sourceUrl=${encodeURIComponent(sourceUrl ?? "")}`
            }
          >
            <img
              src="/images/icons/clinical_history.svg"
              alt="Clinical History"
              className="size-4"
            />
            {t("see_clinical_history")}
          </Link>
        </Button>
      </div>
    </div>
  );
};
