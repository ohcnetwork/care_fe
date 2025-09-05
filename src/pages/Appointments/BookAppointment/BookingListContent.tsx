import { useQuery } from "@tanstack/react-query";
import { isToday } from "date-fns";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import query from "@/Utils/request/query";
import { Appointment, AppointmentStatus } from "@/types/scheduling/schedule";
import scheduleApi from "@/types/scheduling/scheduleApi";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { AppointmentCard, AppointmentTable } from "./BookingsList";

export const BookingListContent = ({
  patientId,
  facilityId,
  date_from,
  date_to,
  status,
  isUpcoming = false,
}: {
  patientId: string;
  facilityId: string;
  date_from?: string;
  date_to?: string;
  status?: AppointmentStatus[];
  isUpcoming?: boolean;
}) => {
  const { t } = useTranslation();
  const { data: appointments, isLoading } = useQuery({
    queryKey: ["book-appointment"],
    queryFn: query(scheduleApi.appointments.getAppointments, {
      pathParams: { patientId },
      queryParams: {
        limit: 100,
        date_after: date_from,
        date_before: date_to,
        status: status?.join(","),
      },
    }),
  });

  const filteredAppointments: Appointment[] = useMemo(() => {
    if (!appointments?.results) return [];

    return appointments.results.filter((appointment) => {
      const appointmentDate = new Date(appointment.token_slot.start_datetime);

      if (date_from) {
        const fromDate = new Date(date_from);
        if (appointmentDate < fromDate) {
          return false;
        }
      }

      if (date_to) {
        const toDate = new Date(date_to);
        if (appointmentDate >= toDate) {
          return false;
        }
      }

      if (status && status.length > 0) {
        if (!status.includes(appointment.status)) {
          return false;
        }
      }
      return true;
    });
  }, [appointments?.results, date_from, date_to, status]);

  const { todayAppointments, nextAppointments } = useMemo(() => {
    if (!isUpcoming) {
      return { todayAppointments: [], nextAppointments: filteredAppointments };
    }

    const today: Appointment[] = [];
    const next: Appointment[] = [];

    filteredAppointments.forEach((appointment) => {
      const appointmentDate = new Date(appointment.token_slot.start_datetime);
      if (isToday(appointmentDate)) {
        today.push(appointment);
      } else {
        next.push(appointment);
      }
    });

    return { todayAppointments: today, nextAppointments: next };
  }, [filteredAppointments, isUpcoming]);

  if (isLoading) {
    return <TableSkeleton count={10} />;
  }

  if (todayAppointments.length === 0 && nextAppointments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{t("no_appointments")}</p>
      </div>
    );
  }

  if (!isUpcoming) {
    return (
      <>
        <AppointmentTable
          appointments={filteredAppointments}
          facilityId={facilityId}
          patientId={patientId}
        />
        {filteredAppointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            patientId={patientId}
            facilityId={facilityId}
            appointmentId={appointment.id}
          />
        ))}
      </>
    );
  }

  return (
    <div className="space-y-6">
      {todayAppointments.length > 0 && (
        <div>
          <span className="font-semibold text-gray-950 mb-4">{t("today")}</span>
          <AppointmentTable
            appointments={todayAppointments}
            facilityId={facilityId}
            patientId={patientId}
          />
          {todayAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              patientId={patientId}
              facilityId={facilityId}
              appointmentId={appointment.id}
            />
          ))}
        </div>
      )}

      {nextAppointments.length > 0 && (
        <div>
          <span className="font-semibold text-gray-950 mb-4">{t("next")}</span>
          <AppointmentTable
            appointments={nextAppointments}
            facilityId={facilityId}
            patientId={patientId}
          />
          {nextAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              patientId={patientId}
              facilityId={facilityId}
              appointmentId={appointment.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};
