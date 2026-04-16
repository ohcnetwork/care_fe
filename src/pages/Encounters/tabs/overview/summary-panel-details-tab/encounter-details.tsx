import { format } from "date-fns";
import { SquarePen } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import {
  EncounterClassBadge,
  StatusBadge,
} from "@/pages/Encounters/EncounterProperties";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { ENCOUNTER_PRIORITY_COLORS } from "@/types/emr/encounter/encounter";

export const EncounterDetails = () => {
  const { t } = useTranslation();
  const {
    selectedEncounter: encounter,
    selectedEncounterId: encounterId,
    patientId,
    facilityId,
    canWriteSelectedEncounter,
  } = useEncounter();
  if (!encounter) return <CardListSkeleton count={1} />;

  return (
    <div className="flex flex-wrap gap-2 border bg-muted-background border-border rounded-md pt-2 px-1 pb-1">
      <div className="flex items-center justify-between w-full text-foreground pl-2">
        <span className="font-semibold ">{t("encounter_details")}</span>
        {canWriteSelectedEncounter && (
          <Button variant="ghost" size="sm" asChild>
            <Link
              href={`/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/encounter`}
            >
              <SquarePen className="text-foreground" strokeWidth={1.5} />
            </Link>
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2 justify-between bg-background w-full p-2 rounded-md shadow">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t("status")}: </span>
          <div>
            <StatusBadge encounter={encounter} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t("encounter_class")}: </span>
          <div>
            <EncounterClassBadge encounter={encounter} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t("priority")}: </span>
          <div>
            <Badge
              variant={ENCOUNTER_PRIORITY_COLORS[encounter.priority]}
              size="sm"
            >
              <span className="whitespace-nowrap">
                {t(`encounter_priority__${encounter.priority}`)}
              </span>
            </Badge>
          </div>
        </div>
        <Separator className="mt-2" />
        <div className="md:flex flex-col gap-1">
          <div>
            <span className="text-sm font-medium text-muted-foreground">
              {t("start_date")}:
            </span>
            <div className="text-sm text-foreground font-semibold">
              {encounter.period.start ? (
                <>
                  {format(encounter.period.start, "dd MMM yyyy")}
                  <div className="text-soft-foreground">
                    {format(encounter.period.start, "hh:mma")}
                  </div>
                </>
              ) : (
                <span>--</span>
              )}
            </div>
          </div>
        </div>

        <div className=" md:flex flex-col gap-1">
          <div>
            <span className="text-sm font-medium text-muted-foreground">
              {t("end_date")}:
            </span>
            <div className="text-sm text-foreground font-semibold">
              {encounter.period.end ? (
                <>
                  {format(encounter.period.end, "dd MMM yyyy")},
                  <div className="text-soft-foreground">
                    {format(encounter.period.end, "hh:mma")}
                  </div>
                </>
              ) : (
                <span>--({t("ongoing")})</span>
              )}
            </div>
          </div>
        </div>
      </div>
      {canWriteSelectedEncounter && (
        <Button variant="outline" className="w-full" asChild>
          <Link
            href={`/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/encounter`}
          >
            <SquarePen className="size-3 text-foreground" strokeWidth={1.5} />
            <span className="text-foreground">{t("update_encounter")}</span>
          </Link>
        </Button>
      )}
    </div>
  );
};
