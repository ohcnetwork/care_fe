import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

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

import useAppHistory from "@/hooks/useAppHistory";

import { getPermissions } from "@/common/Permissions";

import query from "@/Utils/request/query";
import { formatDateTime, formatName } from "@/Utils/utils";
import { usePermissions } from "@/context/PermissionContext";
import scheduleApis from "@/types/scheduling/scheduleApi";

export const Appointments = (props: PatientProps) => {
  const { patientData, facilityId } = props;
  const patientId = patientData.id;
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const { canViewAppointments, canCreateAppointment } = getPermissions(
    hasPermission,
    patientData.permissions,
  );
  const { goBack } = useAppHistory();

  const { data, isLoading } = useQuery({
    queryKey: ["patient-appointments", patientId],
    queryFn: query(
      facilityId
        ? scheduleApis.appointments.list
        : scheduleApis.appointments.getAppointments,
      {
        pathParams: {
          facility_id: facilityId ?? "",
          patient_id: patientId,
        },
        queryParams: { patient: patientId, limit: 100 },
      },
    ),
  });

  useEffect(() => {
    if (!canViewAppointments) {
      toast.error(t("no_permission_to_view_page"));
      goBack(`/facility/${facilityId}/patient/${patientId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewAppointments]);

  const appointments = data?.results;

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      booked:
        "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:text-yellow-900",
      checked_in:
        "bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900",
      cancelled: "bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900",
    };

    return (
      <Badge
        className={
          statusColors[status] ||
          "bg-gray-100 text-gray-800 hover:bg-gray-200 hover:text-gray-900"
        }
      >
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="mt-4 px-3 md:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
        <h2 className="text-2xl font-semibold leading-tight text-center sm:text-left">
          {t("appointments")}
        </h2>
        {canCreateAppointment && facilityId && (
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
                  <TableCell>{getStatusBadge(appointment.status)}</TableCell>
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
      </div>
    </div>
  );
};
