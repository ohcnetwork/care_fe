import { t } from "i18next";
import { BedSingle, CircleCheck, CircleDashed, Clock } from "lucide-react";
import { Link } from "raviger";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";

import { formatDateTime } from "@/Utils/utils";
import { Encounter, completedEncounterStatus } from "@/types/emr/encounter";

import { buttonVariants } from "../ui/button";

interface EncounterCardProps {
  encounter: Encounter;
}

export const EncounterCard = (props: EncounterCardProps) => {
  const { encounter } = props;
  return (
    <>
      <div className="pb-16 block relative border-l-2 px-4 border-l-secondary-300 hover:border-primary-500 transition-all before:absolute before:-left-[7px] before:top-0 before:w-3 before:aspect-square before:bg-secondary-400 before:rounded-full hover:before:bg-primary-500 before:transition-all">
        <Badge
          variant={
            completedEncounterStatus.includes(encounter.status)
              ? "outline"
              : "secondary"
          }
          className="inline-flex items-center gap-2 -translate-y-2"
        >
          {completedEncounterStatus.includes(encounter.status) ? (
            <CircleCheck className="w-4 h-4 text-green-300" />
          ) : (
            <CircleDashed className="w-4 h-4 text-yellow-500" />
          )}
          {t(`encounter_status__${encounter.status}`)}
        </Badge>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {[
            {
              label: t("facility"),
              value: (
                <div className="flex items-center gap-2">
                  {encounter.facility.name}
                </div>
              ),
            },
            {
              label: t("encounter_class"),
              value: (
                <div className="flex items-center gap-2">
                  <BedSingle className="w-4 h-4 text-blue-400" />
                  {t(`encounter_class__${encounter.encounter_class}`)}
                </div>
              ),
            },
            {
              label: t("priority"),
              value: (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  {t(`encounter_priority__${encounter.priority.toLowerCase()}`)}
                </div>
              ),
            },
            {
              label: t("start_date"),
              value: encounter.period.start
                ? formatDateTime(encounter.period.start)
                : t("not_started"),
            },
            {
              label: t("end_date"),
              hide: !encounter.period.end,
              value: formatDateTime(encounter.period.end),
            },
            {
              label: t("external_id"),
              hide: !encounter.external_identifier,
              value: encounter.external_identifier,
            },
          ]
            .filter((f) => !f.hide)
            .map((field, i) => (
              <div key={i}>
                <div className="text-sm text-gray-600">{field.label}</div>
                <div className="font-bold">{field.value}</div>
              </div>
            ))}
        </div>

        <Link
          href={`/facility/${encounter.facility.id}/encounter/${encounter.id}/updates`}
          className={cn(
            buttonVariants({ variant: "secondary" }),
            "mt-2 shadow-none border border-secondary-300",
            !encounter.period.start && "pointer-events-none opacity-50",
          )}
        >
          <CareIcon icon="l-plus-circle" />
          {t("View Encounter")}
        </Link>
      </div>
    </>
  );
};
