import { Trans, useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PatientHoverCard } from "@/pages/Facility/services/serviceRequests/PatientHoverCard";
import { PatientRead } from "@/types/emr/patient/patient";
import { getTagHierarchyDisplay } from "@/types/emr/tagConfig/tagConfig";
import dayjs from "dayjs";
import { Link } from "raviger";

export function PatientHeader({
  patient,
  facilityId,
  actions,
  className,
  isPatientPage = false,
  locationId,
  showViewPrescriptionsButton = false,
  showViewDispenseButton = false,
}: {
  patient: PatientRead;
  facilityId?: string;
  actions?: React.ReactNode;
  className?: string;
  isPatientPage?: boolean;
  locationId?: string;
  showViewPrescriptionsButton?: boolean;
  showViewDispenseButton?: boolean;
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
          {patient.instance_identifiers?.map((identifier) => (
            <div
              key={identifier.config.id}
              className="flex flex-col gap-1 items-start md:hidden xl:flex"
            >
              <span className="text-xs text-gray-700 md:w-auto">
                {identifier.config.config.display}:{" "}
              </span>
              <span className="text-sm font-semibold">{identifier.value}</span>
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
        {locationId && (
          <div className="flex md:flex-row flex-col items-center gap-2">
            {showViewPrescriptionsButton && (
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link
                  href={`/facility/${facilityId}/locations/${locationId}/medication_requests/patient/${patient.id}/pending`}
                  basePath="/"
                >
                  <div className="text-gray-500 text-xs flex items-center gap-1">
                    {t("view_prescriptions")}
                  </div>
                </Link>
              </Button>
            )}
            {showViewDispenseButton && (
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link
                  href={`/facility/${facilityId}/locations/${locationId}/medication_dispense/patient/${patient.id}/preparation`}
                  basePath="/"
                >
                  <div className="text-gray-500 text-xs flex items-center gap-1">
                    {t("view_dispenses")}
                  </div>
                </Link>
              </Button>
            )}
          </div>
        )}
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
