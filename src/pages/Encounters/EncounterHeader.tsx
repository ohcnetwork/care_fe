import { ChevronDown, ExternalLink } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar } from "@/components/Common/Avatar";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import EncounterActions from "@/components/Encounter/EncounterActions";

import { PLUGIN_Component } from "@/PluginEngine";
import { formatDateTime, formatPatientAge } from "@/Utils/utils";
import EncounterProperties from "@/pages/Encounters/EncounterProperties";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { inactiveEncounterStatus } from "@/types/emr/encounter/encounter";

export function EncounterHeader() {
  const { t } = useTranslation();
  const {
    currentEncounter: encounter,
    selectedEncounterId,
    currentEncounterId,
  } = useEncounter();

  if (!encounter) {
    return <CardListSkeleton count={1} />;
  }

  const readOnly = selectedEncounterId !== currentEncounterId;

  const { patient, facility } = encounter;
  const tags = [...patient.instance_tags, ...patient.facility_tags];

  return (
    <Card className="p-2 md:p-4 flex flex-col md:flex-row md:justify-between gap-6">
      <div className="flex flex-col md:flex-row gap-4 md:gap-8 md:items-end">
        <div className="flex gap-3 items-center">
          <div className="size-12">
            <Avatar name={patient.name} />
          </div>
          <Link
            href={`/facility/${facility.id}/patient/${patient.id}`}
            className="flex flex-col"
          >
            <div className="flex gap-2 items-center">
              <h5 className="text-lg font-semibold">{patient.name}</h5>
              <ExternalLink className="size-4" />
            </div>
            <span className="text-gray-700">
              {formatPatientAge(patient, true)},{" "}
              {t(`GENDER__${patient.gender}`)}
            </span>
          </Link>
        </div>
        <div className="flex flex-col md:flex-row gap-1 md:gap-8 items-start">
          <div className="md:hidden flex md:flex-col gap-0.5 items-center md:items-start">
            <span className="text-xs text-gray-600 w-32 md:w-auto">
              {t("start_date")}:{" "}
            </span>
            <span className="text-sm font-semibold">
              {encounter.period.start
                ? formatDateTime(encounter.period.start)
                : "--"}
            </span>
          </div>
          <div className="md:hidden flex md:flex-col gap-0.5 items-center md:items-start">
            <span className="text-xs text-gray-600 w-32 md:w-auto">
              {t("end_date")}:{" "}
            </span>
            <span className="text-sm font-semibold">
              {encounter.period.end
                ? formatDateTime(encounter.period.end)
                : t("ongoing")}
            </span>
          </div>
          {patient.instance_identifiers.map((identifier) => (
            <div
              key={identifier.config.id}
              className="flex md:flex-col gap-0.5 items-center md:items-start"
            >
              <span className="text-xs text-gray-600 w-32 md:w-auto">
                {identifier.config.config.display}:{" "}
              </span>
              <span className="text-sm font-semibold">{identifier.value}</span>
            </div>
          ))}
          <div className="flex md:flex-col gap-0.5 items-center md:items-start">
            <span className="text-xs text-gray-600 w-32 md:w-auto">
              {t("tags")}:{" "}
            </span>
            {tags.length ? (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary" size="sm">
                    {tag.display}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-sm font-semibold">--</span>
            )}
          </div>
        </div>
        <div className="md:hidden">
          <EncounterProperties encounter={encounter} canEdit={false} />
        </div>
      </div>

      {!readOnly && (
        <div className="flex flex-col items-end justify-center gap-4">
          <PLUGIN_Component
            __name="PatientInfoCardQuickActions"
            encounter={encounter}
            className="w-full lg:w-auto bg-primary-700 text-white hover:bg-primary-600"
          />

          {!inactiveEncounterStatus.includes(encounter.status) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="primary_gradient">
                  {t("update")}
                  <ChevronDown className="ml-2 size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-(--radix-dropdown-menu-trigger-width) sm:w-auto"
              >
                <EncounterActions encounter={encounter} layout="dropdown" />
                <PLUGIN_Component
                  __name="PatientInfoCardActions"
                  encounter={encounter}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
    </Card>
  );
}
