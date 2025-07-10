import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import { cn } from "@/lib/utils";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Loading from "@/components/Common/Loading";
import PrintTable from "@/components/Common/PrintTable";

import query from "@/Utils/request/query";
import {
  formatPatientAge,
  getWeeklyIntervalsFromTodayTill,
} from "@/Utils/utils";
import encounterApi from "@/types/emr/encounter/encounterApi";
import { MedicationAdministrationRead } from "@/types/emr/medicationAdministration/medicationAdministration";
import medicationAdministrationApi from "@/types/emr/medicationAdministration/medicationAdministrationApi";

export const PrintMedicationAdministration = (props: {
  facilityId: string;
  encounterId: string;
  patientId: string;
}) => {
  const { facilityId, encounterId, patientId } = props;
  const { t } = useTranslation();

  const { data: encounter } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: query(encounterApi.getEncounter, {
      pathParams: { id: encounterId },
      queryParams: { facility: facilityId },
    }),
  });

  const { data: medicationAdministrations, isLoading } = useQuery({
    queryKey: ["medication_administrations", patientId],
    queryFn: query.paginated(medicationAdministrationApi.list, {
      pathParams: { patientId: patientId },
      queryParams: {
        encounter: encounterId,
        status: "completed",
      },
      pageSize: 1000,
    }),
    enabled: !!patientId,
  });

  const administrationsByAdministrator = useMemo(
    () =>
      (medicationAdministrations?.results ?? []).reduce<
        Record<string, MedicationAdministrationRead[]>
      >((acc, administration) => {
        const administraterId = administration.created_by.id.toString();
        if (!acc[administraterId]) {
          acc[administraterId] = [];
        }
        acc[administraterId].push(administration);
        return acc;
      }, {}),
    [medicationAdministrations],
  );

  const hourRanges = [
    { start: "00:00", end: "06:00" },
    { start: "06:00", end: "12:00" },
    { start: "12:00", end: "18:00" },
    { start: "18:00", end: "24:00" },
  ];
  const filterAdministartionsByMedicineOccurenceAndHourRange = (
    administrations: MedicationAdministrationRead[],
    hourRanges: { start: string; end: string }[],
    dateRange?: { start?: string; end?: string },
  ) => {
    const adminstrationsHourRangeMap = {} as {
      [medicineRequestId: string]: {
        [occurenceStartDate: string]: {
          [hourRangeKey: string]: MedicationAdministrationRead[];
        };
      };
    };

    administrations
      ?.filter((administration) => {
        const startDate =
          dateRange?.start &&
          new Date(dateRange.start).toISOString().slice(0, 10);
        const endDate =
          dateRange?.end && new Date(dateRange.end).toISOString().slice(0, 10);
        const date = new Date(administration.occurrence_period_start)
          .toISOString()
          .slice(0, 10);

        if (startDate && endDate) {
          return date >= startDate && date <= endDate;
        }

        if (startDate) {
          return date >= startDate;
        }

        if (endDate) {
          return date <= endDate;
        }

        return true;
      })
      .forEach((administration) => {
        const medicineRequestId = administration.request;
        const occurenceStartDate = new Date(
          administration.occurrence_period_start,
        )
          .toISOString()
          .slice(0, 10);

        const hourRange = hourRanges.find((range) => {
          const startDate = new Date(administration.occurrence_period_start);
          const startHour = startDate.getHours();
          return (
            startHour >= parseInt(range.start.split(":")[0]) &&
            startHour < parseInt(range.end.split(":")[0])
          );
        });

        if (!hourRange) return;

        if (!adminstrationsHourRangeMap[medicineRequestId]) {
          adminstrationsHourRangeMap[medicineRequestId] = {};
        }

        if (
          !adminstrationsHourRangeMap[medicineRequestId][occurenceStartDate]
        ) {
          adminstrationsHourRangeMap[medicineRequestId][occurenceStartDate] =
            {};
        }

        const hourRangeKey = `${hourRange.start}-${hourRange.end}`;
        if (
          !adminstrationsHourRangeMap[medicineRequestId][occurenceStartDate][
            hourRangeKey
          ]
        ) {
          adminstrationsHourRangeMap[medicineRequestId][occurenceStartDate][
            hourRangeKey
          ] = [];
        }

        adminstrationsHourRangeMap[medicineRequestId][occurenceStartDate][
          hourRangeKey
        ].push(administration);
      });

    return adminstrationsHourRangeMap;
  };

  if (isLoading) return <Loading />;

  if (!medicationAdministrations?.results?.length) {
    return (
      <div className="flex h-52 items-center justify-center rounded-lg border-2 border-gray-200 border-dashed p-4 text-gray-500">
        {t("no_medications_found_for_this_encounter")}
      </div>
    );
  }

  return (
    <PrintPreview
      title={`${t("medicine_administration")} - ${encounter?.patient.name}`}
      disabled={!medicationAdministrations?.results?.length}
    >
      <div className="min-h-screen md:p-2 max-w-4xl mx-auto">
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start mb-4 pb-2 border-b border-gray-200">
            <img
              src={careConfig.mainLogo?.dark}
              alt="Care Logo"
              className="h-10 w-auto object-contain mb-2 sm:mb-0 sm:order-2"
            />
            <div className="text-center sm:text-left sm:order-1">
              <h1 className="text-3xl font-semibold">
                {encounter?.facility?.name}
              </h1>
              <h2 className="text-gray-500 uppercase text-sm tracking-wide mt-1 font-semibold">
                {t("medicine_administration")}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-8">
            <div className="space-y-3">
              <DetailRow
                label={t("patient")}
                value={encounter?.patient.name}
                isStrong
              />
              <DetailRow
                label={`${t("age")} / ${t("sex")}`}
                value={
                  encounter?.patient
                    ? `${formatPatientAge(encounter.patient, true)}, ${t(`GENDER__${encounter.patient.gender}`)}`
                    : undefined
                }
                isStrong
              />
            </div>
            <div className="space-y-3">
              <DetailRow
                label={t("encounter_date")}
                value={
                  encounter?.period?.start &&
                  format(new Date(encounter.period.start), "dd MMM yyyy, EEEE")
                }
                isStrong
              />
              <DetailRow
                label={t("mobile_number")}
                value={
                  encounter &&
                  formatPhoneNumberIntl(encounter.patient.phone_number)
                }
                isStrong
              />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {getWeeklyIntervalsFromTodayTill(encounter?.period.start).map(
              ({ start: weekStartDate, end: weekEndDate }) => (
                <MedicationAdministrationTable
                  key={weekStartDate.toISOString()}
                  administrations={filterAdministartionsByMedicineOccurenceAndHourRange(
                    medicationAdministrations.results,
                    hourRanges,
                    {
                      start: weekStartDate.toISOString(),
                      end: weekEndDate.toISOString(),
                    },
                  )}
                  dateRange={{
                    start: weekStartDate,
                    end: weekEndDate,
                  }}
                  hourRanges={hourRanges}
                />
              ),
            )}
          </div>

          <div className="mt-6">
            <PrintTable
              headers={[
                { key: "medicine" },
                { key: "administered_at" },
                { key: "administered_by" },
                { key: "notes" },
              ]}
              rows={medicationAdministrations?.results
                .sort(
                  (a, b) =>
                    Number(new Date(a.occurrence_period_start)) -
                    Number(new Date(b.occurrence_period_start)),
                )
                .map((administration) => {
                  return {
                    medicine: administration.medication?.code
                      ? (administration.medication.display ??
                        administration.medication.code)
                      : administration.administered_product?.name,
                    administered_at: format(
                      new Date(administration.occurrence_period_start),
                      "dd MMM yyyy, hh:mm a",
                    ),
                    administered_by: `Dr. ${administration.created_by.first_name} ${administration.created_by.last_name}`,
                    notes: administration.note,
                  };
                })}
            />
          </div>

          <div className="mt-6 flex justify-end gap-8">
            {Object.entries(administrationsByAdministrator).map(
              ([administraterId, administrations]) => {
                const administrater = administrations[0].created_by;
                return (
                  <div key={administraterId} className="text-center">
                    <p className="text-sm text-gray-600 font-semibold">
                      Dr. {administrater.first_name} {administrater.last_name}
                    </p>
                  </div>
                );
              },
            )}
          </div>

          <div className="mt-8 pt-2 text-[10px] text-gray-500 flex justify-between flex-wrap">
            <p>
              {t("generated_on")} {format(new Date(), "PPP 'at' p")}
            </p>
            <p>{t("computer_generated_medication_administration")}</p>
          </div>
        </div>
      </div>
    </PrintPreview>
  );
};

const DetailRow = ({
  label,
  value,
  isStrong = false,
}: {
  label: string;
  value?: string | null;
  isStrong?: boolean;
}) => {
  return (
    <div className="flex">
      <span className="text-gray-600 w-32">{label}</span>
      <span className="text-gray-600">: </span>
      <span className={`ml-1 ${isStrong ? "font-semibold" : ""}`}>
        {value || "-"}
      </span>
    </div>
  );
};

type MedicationAdministrationTableProps = {
  administrations: {
    [medicineRequestId: string]: {
      [occurenceStartDate: string]: {
        [hourRangeKey: string]: MedicationAdministrationRead[];
      };
    };
  };
  dateRange: { start: Date; end: Date };
  hourRanges: { start: string; end: string }[];
};

const MedicationAdministrationTable = ({
  administrations,
  dateRange,
  hourRanges,
}: MedicationAdministrationTableProps) => {
  const { t } = useTranslation();

  const dates = useMemo(() => {
    const dates = [];
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    while (startDate <= endDate) {
      dates.push(new Date(startDate));
      startDate.setDate(startDate.getDate() + 1);
    }

    return dates;
  }, [dateRange]);

  const isMedicationAdministeredWithinDateRange = useMemo(() => {
    for (const date of dates) {
      if (
        Object.values(administrations).some(
          (dateWiseAdministrations) =>
            !!dateWiseAdministrations[format(date, "yyyy-MM-dd")],
        )
      ) {
        return true;
      }
    }

    return false;
  }, [administrations, dates]);

  if (!isMedicationAdministeredWithinDateRange) return null;

  const renderMedication = (
    dateWiseAdministrations: MedicationAdministrationTableProps["administrations"][string],
  ) => {
    const hourWiseAdministrations =
      dateWiseAdministrations[Object.keys(dateWiseAdministrations)[0]];
    const hourRange = Object.keys(hourWiseAdministrations)[0];
    const administration = hourWiseAdministrations[hourRange][0];

    return (
      <div className="flex flex-col items-center gap-2">
        <h5>
          {administration.medication?.code
            ? (administration.medication.display ??
              administration.medication.code)
            : administration.administered_product?.name}
        </h5>
        <p className="text-sm flex items-center justify-center gap-1 flex-wrap">
          <span>
            {administration.dosage?.dose?.value}{" "}
            {administration.dosage?.dose?.unit.display ??
              administration.dosage?.dose?.unit.code}
          </span>
          {administration.dosage?.route && (
            <span>
              {t("administered_through_route", {
                route:
                  administration.dosage?.route?.display ??
                  administration.dosage?.route?.code,
              })}
            </span>
          )}
          {administration.dosage?.method && (
            <span>
              {t("administered_via_method", {
                method:
                  administration.dosage?.method?.display ??
                  administration.dosage?.method?.code,
              })}
            </span>
          )}
          {administration.dosage?.site && (
            <span>
              {t("administered_at_site", {
                site:
                  administration.dosage?.site?.display ??
                  administration.dosage?.site?.code,
              })}
            </span>
          )}
          <span>{administration.dosage?.text}</span>
        </p>
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-lg border-2 border-black">
      <div>
        <h3 className="font-semibold text-lg text-center bg-gray-200 p-2">
          {t("date_range_from_till", {
            from: format(dates[0], "dd MMM yyyy"),
            till: format(dates[dates.length - 1], "dd MMM yyyy"),
          })}
        </h3>
      </div>
      <Table className="w-full">
        <TableHeader>
          <TableRow className="bg-transparent hover:bg-transparent divide-x divide-gray border-b-gray-200">
            <TableHead className="first:rounded-l-md h-auto py-1 pl-2 pr-2 text-black text-center capitalize">
              {t("medication")}
            </TableHead>

            <TableHead className="first:rounded-l-md h-auto py-1 pl-2 pr-2 text-black text-center capitalize">
              {t("hour")}
            </TableHead>

            {dates.map((header, index) => (
              <TableHead
                key={index}
                className="first:rounded-l-md h-auto py-1 pl-2 pr-2 text-black text-center"
              >
                {format(header, "dd MMM")}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.values(administrations).map((dateWiseAdministrations) =>
            hourRanges.map((hourRange, index) => (
              <TableRow
                key={hourRange.start + hourRange.end}
                className={cn(
                  "bg-transparent hover:bg-transparent divide-x",
                  index === 0 && "border-t-2 border-t-black",
                )}
              >
                {index === 0 && (
                  <TableCell
                    className="break-words whitespace-normal text-center"
                    rowSpan={hourRanges.length}
                  >
                    {renderMedication(dateWiseAdministrations)}
                  </TableCell>
                )}
                <TableCell className="whitespace-nowrap text-center border-x border-gray-200">
                  {hourRange.start} - {hourRange.end}
                </TableCell>
                {dates.map((date) => (
                  <TableCell
                    key={date.toISOString()}
                    className="break-words whitespace-normal text-center"
                  >
                    {dateWiseAdministrations[format(date, "yyyy-MM-dd")]?.[
                      `${hourRange.start}-${hourRange.end}`
                    ]?.length || "-"}
                  </TableCell>
                ))}
              </TableRow>
            )),
          )}
        </TableBody>
      </Table>
    </div>
  );
};
