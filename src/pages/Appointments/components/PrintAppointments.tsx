import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Loading from "@/components/Common/Loading";
import PrintFooter from "@/components/Common/PrintFooter";

import query from "@/Utils/request/query";
import {
  dateQueryString,
  formatDateTime,
  formatPatientAge,
} from "@/Utils/utils";
import { PatientRead } from "@/types/emr/patient/patient";
import patientApi from "@/types/emr/patient/patientApi";
import {
  PatientIdentifier,
  PatientIdentifierUse,
} from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import {
  formatScheduleResourceName,
  SchedulableResourceType,
} from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApi";
import { renderTokenNumber } from "@/types/tokens/token/token";
import { useEffect, useState } from "react";

type PrintAppointmentsProps = {
  facilityId: string;
  resourceType: SchedulableResourceType;
  resourceId?: string;
};

export function PrintAppointments({
  facilityId,
  resourceType,
  resourceId,
}: PrintAppointmentsProps) {
  const { t } = useTranslation();
  const [qParams] = useQueryParams();
  const [selectedPatient, setSelectedPatient] = useState<PatientRead | null>(
    null,
  );

  const practitioners = qParams.practitioners
    ? qParams.practitioners.split(",")
    : [];
  const [sortByTokenNo, setSortByTokenNo] = useState(false);
  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: [
      "print-appointments",
      facilityId,
      qParams.practitioners,
      qParams.slot,
      qParams.date_from,
      qParams.date_to,
      qParams.status,
      qParams.tags,
      qParams.patient,
      resourceType,
    ],
    queryFn: query.paginated(scheduleApis.appointments.list, {
      pathParams: { facilityId },
      queryParams: {
        status: qParams.status ?? "booked",
        slot: qParams.slot,
        user: qParams.practitioners ?? undefined,
        date_after: qParams.date_from,
        date_before: qParams.date_to ?? dateQueryString(new Date()),
        tags: qParams.tags,
        resource_type: resourceType,
        resource_ids: qParams.practitioners ?? resourceId,
        patient: qParams.patient,
      },
    }),
  });

  const { data: patientDetails } = useQuery({
    queryKey: ["patient-details", qParams.patient],
    queryFn: query(patientApi.get, {
      pathParams: { id: qParams.patient! },
    }),
    enabled: !!qParams.patient,
  });

  useEffect(() => {
    if (patientDetails) {
      setSelectedPatient(patientDetails);
    }
  }, [patientDetails]);

  if (isLoading) {
    return <Loading />;
  }

  const appointments = sortByTokenNo
    ? [...(appointmentsData?.results ?? [])].sort((a, b) => {
        if (!a.token && !b.token) return 0;
        if (!a.token) return 1;
        if (!b.token) return -1;
        return a.token.number - b.token.number;
      })
    : (appointmentsData?.results ?? []);
  const totalCount = appointmentsData?.count ?? 0;

  return (
    <div>
      <div className="max-w-4xl mx-auto no-print mb-4 flex flex-wrap justify-start items-center gap-4 p-4 bg-gray-50 border rounded-md border-gray-200">
        <div className="gap-2 flex items-center">
          <Switch
            id="sort-by-token"
            checked={sortByTokenNo}
            onCheckedChange={setSortByTokenNo}
          />
          <label htmlFor="sort-by-token" className="cursor-pointer text-sm">
            {t("sort_by_token_no")}
          </label>
        </div>
      </div>
      <PrintPreview title={t("appointments")}>
        <div className="py-8 max-w-4xl mx-auto">
          {/* Header with Facility Name and Logo */}
          <div className="flex justify-between items-start pb-6 border-b border-gray-200">
            <div className="space-y-4 break-all">
              <h1 className="text-3xl font-semibold">{t("appointments")}</h1>
            </div>
            <img
              src={careConfig.mainLogo?.dark}
              alt="Care Logo"
              className="h-10 w-auto object-contain ml-6"
            />
          </div>

          {/* Filter Summary */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1 text-sm">
              {qParams.date_from && qParams.date_to && (
                <p className="text-gray-600">
                  {t("date_range")}:{" "}
                  {format(new Date(qParams.date_from), "dd MMM yyyy")} -{" "}
                  {format(new Date(qParams.date_to), "dd MMM yyyy")}
                </p>
              )}
              {qParams.patient && (
                <p className="text-gray-600">
                  {t("patient")}: {selectedPatient?.name}
                </p>
              )}
              {practitioners.length === 1 && (
                <p className="text-gray-600">
                  {t("practitioner", { count: 1 })}:{" "}
                  {formatScheduleResourceName(appointments[0])}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">{t("generated_on")}</span>
                <span>{format(new Date(), "dd MMM, yyyy h:mm a")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">
                  {t("total_appointments")}:
                </span>
                <span>{totalCount}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            {/* Appointments Table */}
            <div className="overflow-x-auto">
              <Table className="w-full border">
                <TableHeader>
                  <TableRow className="divide-x">
                    <TableHead className="p-2 font-medium text-gray-500">
                      {t("patient")}
                    </TableHead>
                    {practitioners.length > 1 && (
                      <TableHead className="p-2 font-medium text-gray-500">
                        {t("practitioner", { count: 1 })}
                      </TableHead>
                    )}
                    <TableHead className="p-2 font-medium text-gray-500">
                      {t("appointment_time")}
                    </TableHead>
                    <TableHead className="p-2 font-medium text-gray-500">
                      {t("token_no")}
                    </TableHead>
                    <TableHead className="p-2 font-medium text-gray-500">
                      {t("status")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appointment) => (
                    <TableRow
                      key={appointment.id}
                      className="border-b divide-x"
                    >
                      <TableCell className="p-2 align-top break-words whitespace-normal">
                        <div>
                          <p className="font-medium">
                            {appointment.patient.name}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            {formatPatientAge(appointment.patient, true)},{" "}
                            {t(`GENDER__${appointment.patient.gender}`)}
                            {"instance_identifiers" in appointment.patient &&
                              (
                                appointment.patient
                                  .instance_identifiers as PatientIdentifier[]
                              )
                                ?.filter(
                                  ({ config }: PatientIdentifier) =>
                                    config.config.use ===
                                      PatientIdentifierUse.official &&
                                    !config.config.auto_maintained,
                                )
                                .map((identifier: PatientIdentifier) => (
                                  <p
                                    key={identifier.config.id}
                                    className="text-xs text-gray-600"
                                  >
                                    ({identifier.config.config.display}:{" "}
                                    {identifier.value}){" "}
                                  </p>
                                ))}
                          </p>
                        </div>
                      </TableCell>
                      {practitioners.length > 1 && (
                        <TableCell className="p-2 align-top break-words whitespace-normal">
                          {formatScheduleResourceName(appointment)}
                        </TableCell>
                      )}
                      <TableCell className="p-2 align-top flex flex-col gap-1">
                        {formatDateTime(
                          appointment.token_slot.start_datetime,
                          "ddd, DD MMM YYYY",
                        )}
                        <span>
                          {formatDateTime(
                            appointment.token_slot.start_datetime,
                            "hh:mm a",
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="p-2 align-top">
                        {appointment.token
                          ? renderTokenNumber(appointment.token)
                          : "--"}
                      </TableCell>
                      <TableCell className="p-2 align-top">
                        {t(appointment.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Footer */}
          <PrintFooter className="mt-12 pt-4 border-t" />
        </div>
      </PrintPreview>
    </div>
  );
}

export default PrintAppointments;
