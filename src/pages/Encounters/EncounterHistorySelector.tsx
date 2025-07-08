import { format } from "date-fns";
import React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { ENCOUNTER_STATUS_COLORS, Encounter } from "@/types/emr/encounter";

interface EncounterCardProps {
  encounter: Encounter;
  isSelected: boolean;
  onSelect: (encounterId: string) => void;
}

function EncounterCard({
  encounter,
  isSelected,
  onSelect,
}: EncounterCardProps) {
  const { t } = useTranslation();

  return (
    <Card
      className={cn(
        "rounded-md relative cursor-pointer transition-colors mb-2 w-full md:w-80",
        isSelected
          ? "bg-white border-emerald-600"
          : "bg-gray-100 hover:bg-gray-100 shadow-none",
      )}
      onClick={() => onSelect(encounter.id)}
    >
      {isSelected && (
        <div className="absolute right-0 inset-y-5 w-1 bg-emerald-600 rounded-l" />
      )}
      <CardContent className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-xs font-semibold">
                {t(`encounter_class__${encounter.encounter_class}`)}
              </div>
              <Badge
                variant={ENCOUNTER_STATUS_COLORS[encounter.status]}
                className="text-xs px-1.5"
              >
                {t(`encounter_status__${encounter.status}`)}
              </Badge>
            </div>
            <div className="text-xs text-gray-500 flex flex-wrap text-end justify-end">
              {encounter.period.start && (
                <span className="whitespace-nowrap">
                  {format(new Date(encounter.period.start!), "dd MMM")}
                </span>
              )}
              {encounter.period.end && encounter.period.start && (
                <span>{" - "}</span>
              )}
              {encounter.period.end ? (
                <span>{format(new Date(encounter.period.end), "dd MMM")}</span>
              ) : (
                <span>
                  {" - "}
                  {t("ongoing")}
                </span>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-500">{encounter.facility.name}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EncounterHistorySelector() {
  const { t } = useTranslation();

  const {
    currentEncounter,
    currentEncounterId,
    selectedEncounterId,
    setSelectedEncounter,
    pastEncounters,
  } = useEncounter();

  return (
    <div className="space-y-4 pt-2">
      {!currentEncounter ? (
        <CardListSkeleton count={1} />
      ) : (
        <div>
          <h2 className="px-4 mb-2 text-xs font-medium text-gray-600 uppercase">
            {t("current_encounter")}
          </h2>
          <div className="space-y-2">
            <EncounterCard
              encounter={currentEncounter}
              isSelected={currentEncounterId === selectedEncounterId}
              onSelect={() => setSelectedEncounter(null)}
            />
          </div>
        </div>
      )}

      <Separator className="my-4" />

      {!pastEncounters ? (
        <CardListSkeleton count={5} />
      ) : pastEncounters.results.length > 0 ? (
        <div>
          <h2 className="px-4 mb-2 text-xs font-medium text-gray-600 uppercase">
            {t("past_encounters")}
          </h2>
          <div>
            {pastEncounters.results.reduce<React.ReactNode[]>(
              (acc, encounter, index) => {
                const currentYear = new Date(
                  encounter.period.start!,
                ).getFullYear();
                const prevYear =
                  index > 0
                    ? new Date(
                        pastEncounters.results[index - 1].period.start!,
                      ).getFullYear()
                    : null;

                if (currentYear !== prevYear) {
                  acc.push(
                    <div
                      key={`year-${currentYear}`}
                      className="px-4 mb-2 text-sm font-medium text-indigo-700"
                    >
                      {currentYear}
                    </div>,
                  );
                }

                acc.push(
                  <EncounterCard
                    key={encounter.id}
                    encounter={encounter}
                    isSelected={encounter.id === selectedEncounterId}
                    onSelect={setSelectedEncounter}
                  />,
                );
                return acc;
              },
              [],
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
