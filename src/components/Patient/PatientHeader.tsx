import { Trans, useTranslation } from "react-i18next";

import { BLOOD_GROUP_CHOICES } from "@/common/constants";
import { Avatar } from "@/components/Common/Avatar";
import { PatientAge } from "@/components/Patient/PatientAge";
import { PatientTagsDisplay } from "@/components/Patient/PatientTagsDisplay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";
import { PatientHoverCard } from "@/pages/Facility/services/serviceRequests/PatientHoverCard";
import {
  BloodGroupChoices,
  getPatientIdentifiers,
  PatientListRead,
  PatientRead,
  PublicPatientRead,
} from "@/types/emr/patient/patient";
import dayjs from "dayjs";

interface PatientHeaderProps {
  patient: PatientRead | PublicPatientRead | PatientListRead;
  facilityId?: string;
  className?: string;
  isPatientPage?: boolean;
  variant?: "default" | "encounter";
}

export function PatientHeader({
  patient,
  facilityId,
  className,
  isPatientPage = false,
  variant = "default",
}: PatientHeaderProps) {
  const { t } = useTranslation();

  if (variant === "encounter") {
    const identifiers = getPatientIdentifiers(patient);
    const additionalIdentifiers = identifiers.slice(2);
    const bloodGroup = patient.blood_group ?? BloodGroupChoices.Unknown;
    const hasBloodGroup =
      bloodGroup !== BloodGroupChoices.Unknown &&
      BLOOD_GROUP_CHOICES.some((choice) => choice.id === bloodGroup);
    const bloodGroupDescription = t(`BLOOD_GROUP_LONG__${bloodGroup}`);
    const bloodGroupLabel = `${t("blood_group")}: ${bloodGroupDescription}`;

    return (
      <div className={cn("min-w-0", className)}>
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Avatar
            name={patient.name}
            aria-hidden="true"
            colors={["#def7ec", "#014737"]}
            className="flex size-10 shrink-0 items-center justify-center"
          />
          <div className="min-w-0 flex-1">
            <PatientHoverCard
              patient={patient}
              facilityId={facilityId}
              disabled={isPatientPage}
              presentation="encounter"
            />
            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
              <PatientAge patient={patient} />
              <span aria-hidden="true" className="text-gray-300">
                ·
              </span>
              <span>{t(`GENDER__${patient.gender}`)}</span>
              <span aria-hidden="true" className="text-gray-300">
                ·
              </span>
              <Badge
                variant={hasBloodGroup ? "danger" : "secondary"}
                title={bloodGroupLabel}
                className="rounded-xs border-0 px-0.5 py-0 font-mono font-normal leading-4 whitespace-nowrap"
              >
                <span aria-hidden="true">
                  {hasBloodGroup
                    ? t(`BLOOD_GROUP_SHORT__${bloodGroup}`)
                    : bloodGroupDescription}
                </span>
                <span className="sr-only">{bloodGroupLabel}</span>
              </Badge>
              <dl className="contents">
                {identifiers.slice(0, 2).map((identifier) => (
                  <div
                    key={identifier.config.id}
                    className="flex min-w-0 flex-wrap items-baseline gap-x-1 text-xs"
                  >
                    <dt className="text-gray-500">
                      <span aria-hidden="true" className="mr-2 text-gray-300">
                        ·
                      </span>
                      {identifier.config.config.display}:
                    </dt>
                    <dd className="font-medium wrap-anywhere text-gray-700">
                      {identifier.value}
                    </dd>
                  </div>
                ))}
              </dl>
              {additionalIdentifiers.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="h-5 px-1 text-xs text-gray-600 underline underline-offset-2"
                      title={t("patient_identifiers")}
                      aria-label={`${t("patient_identifiers")}: ${t("count_more", { count: additionalIdentifiers.length })}`}
                    >
                      {t("count_more", { count: additionalIdentifiers.length })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    aria-label={t("patient_identifiers")}
                    className="max-h-80 w-80 max-w-[calc(100vw-2rem)] overflow-y-auto"
                  >
                    <h3 className="mb-3 text-sm font-semibold">
                      {t("patient_identifiers")}
                    </h3>
                    <dl className="space-y-3 text-sm">
                      {additionalIdentifiers.map((identifier) => (
                        <div key={identifier.config.id}>
                          <dt className="text-gray-500">
                            {identifier.config.config.display}
                          </dt>
                          <dd className="font-medium wrap-anywhere text-gray-900">
                            {identifier.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-2 rounded-none shadow-none border-none flex flex-col md:flex-row md:justify-between bg-transparent gap-6",
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
          {getPatientIdentifiers(patient).map((identifier) => (
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
          <PatientTagsDisplay patient={patient} className="text-xs flex-1" />
        </div>
      </div>
    </div>
  );
}

export const PatientDeceasedInfo = ({
  patient,
}: {
  patient: PatientRead | PatientListRead;
}) => {
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
