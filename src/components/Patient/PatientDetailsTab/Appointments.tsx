import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Avatar } from "@/components/Common/Avatar";
import { PatientProps } from "@/components/Patient/PatientDetailsTab";

import query from "@/Utils/request/query";
import { formatDateTime, formatName } from "@/Utils/utils";
import useFilters from "@/hooks/useFilters";
import { APPOINTMENT_STATUS_COLORS } from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApi";

export const Appointments = (props: PatientProps) => {
  const { patientData, facilityId } = props;
  const patientId = patientData.id;
  const { t } = useTranslation();

  const { qParams, Pagination, resultsPerPage } = useFilters({
    disableCache: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["patient-appointments", patientId, qParams],
    queryFn: query(scheduleApis.appointments.getAppointments, {
      pathParams: { patientId },
      queryParams: {
        facility: facilityId,
        patient: patientId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        ordering: "-token_slot__start_datetime",
      },
    }),
  });

  const appointments = data?.results;

  return (
    <div className="mt-4 px-3 md:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
        <h2 className="text-2xl font-semibold leading-tight text-center sm:text-left">
          {t("appointments")}
        </h2>
        {facilityId && (
          <Button variant="outline_primary" asChild>
            <Link
              href={`/facility/${facilityId}/patient/${patientId}/book-appointment`}
              className="flex items-center justify-center w-full sm:w-auto"
            >
              <CareIcon icon="l-plus" className="mr-2" />
              {t("schedule_appointment")}
            </Link>
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("appointment_type")}</TableHead>
              <TableHead>{t("date_and_time")}</TableHead>
              <TableHead>{t("booked_by")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              {facilityId && (
                <TableHead className="text-right">{t("actions")}</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  {t("loading")}
                </TableCell>
              </TableRow>
            ) : appointments && appointments.length ? (
              appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell className="font-medium">
                    {appointment.token_slot.availability.name}
                  </TableCell>
                  <TableCell>
                    {formatDateTime(appointment.token_slot.start_datetime)}
                  </TableCell>
                  <TableCell>
                    {appointment.booked_by ? (
                      <div className="flex items-center gap-2">
                        <Avatar
                          imageUrl={appointment.booked_by?.profile_picture_url}
                          name={formatName(appointment.booked_by, true)}
                          className="size-6 rounded-full"
                        />
                        <span>{formatName(appointment.booked_by)}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500">{t("self_booked")}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={APPOINTMENT_STATUS_COLORS[appointment.status]}
                    >
                      {t(appointment.status)}
                    </Badge>
                  </TableCell>
                  {facilityId && (
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/facility/${facilityId}/patient/${patientData.id}/appointments/${appointment.id}`}
                        >
                          <CareIcon icon="l-eye" className="mr-1" />
                          {t("view")}
                        </Link>
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  {t("no_appointments")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {/* add pagination */}

        <Pagination totalCount={data?.count ?? 0} />
      </div>
    </div>
  );
};
