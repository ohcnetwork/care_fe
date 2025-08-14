import dayjs from "dayjs";
import { ExternalLink } from "lucide-react";
import { Link } from "raviger";
import { Trans, useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import { Avatar } from "@/components/Common/Avatar";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import { PLUGIN_Component } from "@/PluginEngine";
import { formatPatientAge } from "@/Utils/utils";
import { EncounterRead } from "@/types/emr/encounter/encounter";
import { getTagHierarchyDisplay } from "@/types/emr/tagConfig/tagConfig";

export function EncounterHeader({
  encounter,
  canWriteSelectedEncounter,
}: {
  encounter?: EncounterRead;
  canWriteSelectedEncounter: boolean;
}) {
  const { t } = useTranslation();

  const readOnly = !canWriteSelectedEncounter;

  if (!encounter) {
    return <CardListSkeleton count={1} />;
  }

  const { patient, facility } = encounter;

  return (
    <>
      <Card className="p-2 rounded-sm shadow-sm border-none md:p-4 flex flex-col md:flex-row md:justify-between gap-6">
        <div className="flex flex-col md:flex-row gap-4 xl:gap-8 xl:items-end">
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
          <div className="flex flex-wrap xl:gap-8 gap-2">
            {patient.instance_identifiers?.map((identifier) => (
              <div
                key={identifier.config.id}
                className="flex flex-col gap-1 items-start md:hidden xl:flex"
              >
                <span className="text-xs text-gray-700 md:w-auto">
                  {identifier.config.config.display}:{" "}
                </span>
                <span className="text-sm font-semibold">
                  {identifier.value}
                </span>
              </div>
            ))}
            <div className="flex flex-col gap-1 items-start">
              <span className="text-xs text-gray-700">
                {t("encounter_tags")}:
              </span>
              <div className="flex flex-wrap gap-2 text-sm">
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
        </div>

        {!readOnly && (
          <div className="flex flex-col items-end justify-center gap-4">
            <PLUGIN_Component
              __name="PatientInfoCardQuickActions"
              encounter={encounter}
              className="w-full lg:w-auto bg-primary-700 text-white hover:bg-primary-600"
            />
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
