import { Trans, useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import { cn } from "@/lib/utils";
import { PatientHoverCard } from "@/pages/Facility/services/serviceRequests/PatientHoverCard";
import { PatientRead } from "@/types/emr/patient/patient";
import { getTagHierarchyDisplay } from "@/types/emr/tagConfig/tagConfig";
import dayjs from "dayjs";

export function PatientHeader({
  patient,
  facilityId,
  actions,
  className,
  isPatientPage = false,
}: {
  patient: PatientRead;
  facilityId?: string;
  actions?: React.ReactNode;
  className?: string;
  isPatientPage?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <Card
      className={cn(
        "p-2 rounded-none shadow-none border-none md:p-4 flex flex-col md:flex-row md:justify-between bg-transparent gap-6",
        className,
      )}
    >
      <div className="flex flex-col md:flex-row gap-4 xl:gap-8 xl:items-center">
        <PatientHoverCard
          patient={patient}
          facilityId={facilityId}
          disabled={isPatientPage}
        />
        <div className="flex flex-wrap xl:gap-5 gap-2">
          {patient.instance_identifiers
            ?.filter(({ config }) => !config.config.auto_maintained)
            .map((identifier) => (
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
          {patient.instance_tags?.length > 0 && (
            <div className="flex flex-col gap-1 items-start">
              <span className="text-xs text-gray-700">
                {t("patient_tags")}:
              </span>
              <div className="flex flex-wrap gap-2 text-sm whitespace-nowrap">
                <>
                  {patient.instance_tags.map((tag) => (
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
              </div>
            </div>
          )}
        </div>
      </div>
      {actions}
    </Card>
  );
}

export const PatientDeceasedInfo = ({ patient }: { patient: PatientRead }) => {
  const { t } = useTranslation();

  if (!patient.deceased_datetime) return null;

  return (
    <Card className="p-2 items-center rounded-sm shadow-sm border-red-400 bg-red-100 md:p-4 flex flex-wrap justify-center gap-4">
      <Badge variant="danger" className="rounded-sm items-center px-1.5">
        {t("deceased")}
      </Badge>
      <div className="text-sm font-semibold text-red-950">
        <Trans
          i18nKey="passed_away_on"
          values={{
            date: dayjs(patient.deceased_datetime).format("MMMM DD, YYYY"),
            time: dayjs(patient.deceased_datetime).format("hh:mm A"),
          }}
        ></Trans>
      </div>
    </Card>
  );
};
