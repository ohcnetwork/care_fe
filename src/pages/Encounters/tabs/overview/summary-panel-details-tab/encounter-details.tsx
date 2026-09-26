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
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";

export const EncounterDetails = () => {
  const { t } = useTranslation();
  const {
    selectedEncounter: encounter,
    selectedEncounterId: encounterId,
    patientId,
    facilityId,
    canWriteSelectedEncounter,
    actions: { markAsCompleted, dispense },
  } = useEncounter();
  if (!encounter) return <CardListSkeleton count={1} />;

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white">
      <div className="flex min-h-11 items-center justify-between gap-2 border-b border-gray-200 px-3 py-1">
        <span className="text-sm font-bold uppercase tracking-wide text-gray-600">
          {t("encounter_details")}
        </span>
        {canWriteSelectedEncounter && (
          <Button variant="ghost" size="sm" asChild>
            <Link
              href={`/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/encounter`}
            >
              <SquarePen className="text-gray-950" strokeWidth={1.5} />
            </Link>
          </Button>
        )}
      </div>
      <div className="flex w-full flex-wrap justify-between gap-3 p-3">
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
            <span className="text-sm font-medium text-gray-700">
              {t("start_date")}:
            </span>
            <div className="text-sm text-gray-950 font-semibold">
              {encounter.period.start ? (
                <>
                  {format(encounter.period.start, "dd MMM yyyy")}
                  <div className="text-gray-600">
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
            <span className="text-sm font-medium text-gray-700">
              {t("end_date")}:
            </span>
            <div className="text-sm text-gray-950 font-semibold">
              {encounter.period.end ? (
                <>
                  {format(encounter.period.end, "dd MMM yyyy")},
                  <div className="text-gray-600">
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
        <>
          <Button
            variant="outline"
            className="mx-3 mb-3 w-[calc(100%-1.5rem)] shadow-none"
            asChild
          >
            <Link
              href={`/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/encounter`}
            >
              <SquarePen className="size-3 text-gray-950" strokeWidth={1.5} />
              <span className="text-gray-950">{t("update_encounter")}</span>
              <ShortcutBadge actionId="update-encounter" />
            </Link>
          </Button>
          <Button className="hidden" onClick={() => markAsCompleted(true)}>
            <ShortcutBadge actionId="mark-as-completed" />
          </Button>
          <Button className="hidden" onClick={dispense}>
            <ShortcutBadge actionId="dispense" />
          </Button>
        </>
      )}
    </div>
  );
};
