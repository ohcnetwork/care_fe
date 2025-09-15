import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Loading from "@/components/Common/Loading";

import query from "@/Utils/request/query";
import { formatDateTime, formatPatientAge } from "@/Utils/utils";
import { PatientRead } from "@/types/emr/patient/patient";
import patientApi from "@/types/emr/patient/patientApi";
import {
  APPOINTMENT_STATUS_COLORS,
  nameFromAppointment,
  SchedulableResourceType,
} from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApi";
import { useEffect, useState } from "react";

type PrintAppointmentsProps = {
  facilityId: string;
  resourceType: SchedulableResourceType;
};

export function PrintAppointments({
  facilityId,
  resourceType,
}: PrintAppointmentsProps) {
  const { t } = useTranslation();
  const [qParams] = useQueryParams();
  const [selectedPatient, setSelectedPatient] = useState<PatientRead | null>(
    null,
  );
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
        date_before: qParams.date_to,
        tags: qParams.tags,
        resource_type: resourceType,
        resource_ids: qParams.practitioners ?? undefined,
        ordering: "token_slot__start_datetime",
        patient: qParams.patient,
      },
    }),
  });

  const { data: patientDetails } = useQuery({
    queryKey: ["patient-details", qParams.patient],
    queryFn: query(patientApi.getPatient, {
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

  const appointments = appointmentsData?.results ?? [];
  const totalCount = appointmentsData?.count ?? 0;

  return (
    <PrintPreview title={t("appointments")}>
      <div className="min-h-screen py-8 max-w-4xl mx-auto">
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
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">{t("generated_on")}</span>
              <span>{format(new Date(), "dd MMM, yyyy h:mm a")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t("total_appointments")}:</span>
              <span>{totalCount}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-200 pt-6">
          {/* Appointments Table */}
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="p-2 font-medium text-gray-500">
                    {t("patient")}
                  </TableHead>
                  <TableHead className="p-2 font-medium text-gray-500">
                    {t("practitioner", { count: 1 })}
                  </TableHead>
                  <TableHead className="p-2 font-medium text-gray-500">
                    {t("appointment_time")}
                  </TableHead>
                  <TableHead className="p-2 font-medium text-gray-500">
                    {t("token_no")}
                  </TableHead>
                  <TableHead className="p-2 font-medium text-gray-500">
                    {t("status")}
                  </TableHead>
                  <TableHead className="p-2 font-medium text-gray-500">
                    {t("tags")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow key={appointment.id} className="border-b">
                    <TableCell className="p-2 align-top">
                      <div>
                        <p className="font-medium">
                          {appointment.patient.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatPatientAge(appointment.patient, true)},{" "}
                          {t(`GENDER__${appointment.patient.gender}`)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="p-2 align-top">
                      {nameFromAppointment(appointment)}
                    </TableCell>
                    <TableCell className="p-2 align-top">
                      {formatDateTime(
                        appointment.token_slot.start_datetime,
                        "ddd, DD MMM YYYY, HH:mm",
                      )}
                    </TableCell>
                    <TableCell className="p-2 align-top">
                      {appointment.token?.number ?? "--"}
                    </TableCell>
                    <TableCell className="p-2 align-top">
                      <Badge
                        variant={APPOINTMENT_STATUS_COLORS[appointment.status]}
                      >
                        {t(appointment.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-2 align-top">
                      <div className="flex flex-wrap gap-1">
                        {appointment.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag.display}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-4 border-t text-[10px] text-gray-500 flex justify-between">
          <p>
            {t("generated_on")} {format(new Date(), "PPP 'at' p")}
          </p>
        </div>
      </div>
    </PrintPreview>
  );
}

export default PrintAppointments;
