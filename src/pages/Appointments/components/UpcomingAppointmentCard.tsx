import { format } from "date-fns";
import { ChevronRight } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { ScheduleResourceIcon } from "@/components/Schedule/ScheduleResourceIcon";
import { Badge } from "@/components/ui/badge";
import {
  Appointment,
  APPOINTMENT_STATUS_COLORS,
  formatScheduleResourceName,
  UpcomingAppointmentStatuses,
} from "@/types/scheduling/schedule";
import scheduleApi from "@/types/scheduling/scheduleApi";
import query from "@/Utils/request/query";
import { dateQueryString } from "@/Utils/utils";
import { useQuery } from "@tanstack/react-query";

interface UpcomingAppointmentCardProps {
  patientId: string;
  facilityId: string;
  onViewAllAppointments?: () => void;
}

export const UpcomingAppointmentCard = ({
  patientId,
  facilityId,
  onViewAllAppointments,
}: UpcomingAppointmentCardProps) => {
  const { t } = useTranslation();
  const today = new Date();

  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: [
      "upcoming-appointment",
      patientId,
      facilityId,
      UpcomingAppointmentStatuses,
    ],
    queryFn: query(scheduleApi.appointments.getAppointments, {
      pathParams: { patientId },
      queryParams: {
        facility: facilityId,
        date_after: dateQueryString(today),
        date_before: dateQueryString(today),
        status: UpcomingAppointmentStatuses.join(","),
      },
    }),
  });

  const length = appointmentsData?.results?.length ?? 1;
  const appointment = appointmentsData?.results?.[length - 1];
  const totalCount = appointmentsData?.count ?? 0;

  if (isLoading || !appointment) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h5 className="font-semibold text-gray-900">
        {t("upcoming_appointment")}
      </h5>
      <AppointmentRow appointment={appointment} patientId={patientId} />
      {totalCount > 1 && onViewAllAppointments && (
        <button
          type="button"
          onClick={onViewAllAppointments}
          className="text-sm font-medium text-gray-700 hover:text-gray-900 underline"
        >
          {t("view_all_appointments", { count: totalCount })}
        </button>
      )}
    </div>
  );
};

const AppointmentRow = ({
  appointment,
  patientId,
}: {
  appointment: Appointment;
  patientId: string;
}) => {
  const { t } = useTranslation();

  return (
    <Link
      href={`/facility/${appointment.facility.id}/patient/${patientId}/appointments/${appointment.id}`}
      className="flex items-center justify-between gap-4 p-3 border-1 border-blue-500 rounded-lg bg-white hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <ScheduleResourceIcon resource={appointment} className="size-5" />
          <span className="font-medium text-gray-900 truncate text-sm">
            {formatScheduleResourceName(appointment)}
          </span>
        </div>
        <div className="hidden sm:block h-5 w-px bg-gray-300" />
        <span className="text-sm text-gray-700 whitespace-nowrap">
          {format(appointment.token_slot.start_datetime, "hh:mm a")}
          {"; "}
          {format(appointment.token_slot.start_datetime, "dd/MM/yyyy")}
        </span>
        <div className="hidden sm:block h-5 w-px bg-gray-300" />
        <span className="hidden sm:block text-sm text-gray-600 truncate">
          {appointment.token_slot.availability.name}
        </span>
        <Badge variant={APPOINTMENT_STATUS_COLORS[appointment.status]}>
          {t(appointment.status)}
        </Badge>
      </div>
      <ChevronRight className="size-5 text-gray-400 flex-shrink-0" />
    </Link>
  );
};
