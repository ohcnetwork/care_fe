import dayjs from "dayjs";
import { ChevronDown, ExternalLink } from "lucide-react";
import { Link } from "raviger";
import { Trans, useTranslation } from "react-i18next";

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
import { formatPatientAge } from "@/Utils/utils";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { inactiveEncounterStatus } from "@/types/emr/encounter/encounter";
import { getTagHierarchyDisplay } from "@/types/emr/tagConfig/tagConfig";

export function EncounterHeader() {
  const { t } = useTranslation();
  const { primaryEncounter: encounter, canWriteSelectedEncounter } =
    useEncounter();
  const readOnly = !canWriteSelectedEncounter;

  if (!encounter) {
    return <CardListSkeleton count={1} />;
  }

  const { patient, facility } = encounter;

  return (
    <>
      <Card className="p-2 rounded-sm shadow-sm border-none md:p-4 flex flex-col md:flex-row md:justify-between gap-6">
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
          <div className="flex flex-row gap-10 ml-3">
            <div>
              <span className="text-sm font-medium text-gray-700">
                {t("patient_id_abha")}:
              </span>
              <div className="text-sm text-gray-950 font-semibold">"--"</div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">
                {t("hospital_identifier")}:
              </span>
              <div className="text-sm text-gray-950 font-semibold">
                {encounter.external_identifier || "--"}
              </div>
            </div>
          </div>
          <div className="ml-3">
            <span className="text-sm font-medium text-gray-700">
              {t("encounter_tags")}:
            </span>
            <div className="flex flex-wrap gap-2">
              {encounter.tags.length > 0 ? (
                <>
                  {encounter.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="capitalize"
                      title={tag.description}
                    >
                      {getTagHierarchyDisplay(tag)}
                    </Badge>
                  ))}
                </>
              ) : (
                <p className="text-sm text-gray-500">{t("no_tags")}</p>
              )}
            </div>
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
                  <Button variant="primary_gradient" className="w-full">
                    {t("encounter_actions")}
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

      {patient.deceased_datetime && (
        <div className="mt-2">
          <Card className="p-2 items-center rounded-sm shadow-sm border-red-400 bg-red-100 md:p-4 flex flex-wrap justify-center gap-4">
            <Badge variant="danger" className="rounded-sm items-center px-1.5">
              {t("deceased")}
            </Badge>
            <div className="text-sm font-semibold text-red-950">
              <Trans
                i18nKey="passed_away_on"
                values={{
                  date: dayjs(patient.deceased_datetime).format(
                    "MMMM DD, YYYY",
                  ),
                  time: dayjs(patient.deceased_datetime).format("hh:mm A"),
                }}
              ></Trans>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
