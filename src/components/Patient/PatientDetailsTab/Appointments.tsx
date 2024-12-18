import { navigate } from "raviger";
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

import routes from "@/Utils/request/api";
import useTanStackQueryInstead from "@/Utils/request/useQuery";
import { formatDateTime, formatName } from "@/Utils/utils";

import { PatientProps } from ".";

export const Appointments = (props: PatientProps) => {
  const { patientData, facilityId, id } = props;
  const { t } = useTranslation();

  const { data: appointments, loading } = useTanStackQueryInstead(
    routes.getFacilityAppointments,
    {
      pathParams: { facility_id: facilityId },
      query: {
        patient: id,
      },
      prefetch: !!id && !!facilityId,
    },
  );

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      booked: "bg-yellow-100 text-yellow-800",
      checked_in: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const isPatientInactive = (facilityId: string) => {
    return (
      !patientData.is_active ||
      !(patientData?.last_consultation?.facility === facilityId)
    );
  };

  return (
    <div className="mt-4 px-3 md:px-0">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold leading-tight">
          {t("appointments")}
        </h2>
        <Button
          disabled={isPatientInactive(facilityId)}
          onClick={() =>
            navigate(
              `/facility/${facilityId}/appointments/new?patient_id=${patientData.id}`,
            )
          }
        >
          <CareIcon icon="l-plus" className="mr-2" />
          {t("create_appointment")}
        </Button>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("appointment_type")}</TableHead>
              <TableHead>{t("date_and_time")}</TableHead>
              <TableHead>{t("booked_by")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  {t("loading")}
                </TableCell>
              </TableRow>
            ) : appointments?.results?.length ? (
              appointments.results.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell className="font-medium">
                    {appointment.token_slot.availability.name}
                  </TableCell>
                  <TableCell>
                    {formatDateTime(appointment.token_slot.start_datetime)}
                  </TableCell>
                  <TableCell>
                    {appointment.booked_by
                      ? formatName(appointment.booked_by)
                      : "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/appointment/${appointment.id}`)}
                    >
                      <CareIcon icon="l-eye" className="mr-2" />
                      {t("view")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  {t("no_appointments_found")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
