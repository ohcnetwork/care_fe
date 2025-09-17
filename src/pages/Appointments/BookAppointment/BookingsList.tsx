import { useQuery } from "@tanstack/react-query";
import {
  addDays,
  compareAsc,
  differenceInMinutes,
  endOfDay,
  format,
  isAfter,
  isBefore,
  startOfDay,
  subDays,
} from "date-fns";
import { CalendarDays } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import query from "@/Utils/request/query";
import {
  Appointment,
  AppointmentCancelledStatuses,
  AppointmentStatus,
  formatScheduleResourceName,
} from "@/types/scheduling/schedule";
import scheduleApi from "@/types/scheduling/scheduleApi";

import {
  CardGridSkeleton,
  TableSkeleton,
} from "@/components/Common/SkeletonLoading";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { dateQueryString } from "@/Utils/utils";
import { ScheduleResourceIcon } from "@/components/Schedule/ScheduleResourceIcon";
import { AppointmentNonCancelledStatuses } from "@/types/scheduling/schedule";

interface BookingsListProps {
  patientId: string;
  facilityId: string;
}

export const BookingsList = ({ patientId, facilityId }: BookingsListProps) => {
  const { t } = useTranslation();

  return (
    <div className="mt-2">
      <Tabs defaultValue="upcoming">
        <div className="flex sm:flex-row flex-col gap-2">
          <TabsList className="sm:flex sm:flex-col sm:w-52 h-fit sm:bg-gray-50 items-center justify-center w-full bg-gray-100">
            <TabsTrigger
              value="upcoming"
              className="w-full sm:justify-start data-[state=active]:bg-white data-[state=active]:shadow-sm sm:data-[state=active]:text-primary-800 py-2 px-3"
            >
              {t("upcoming")}
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="w-full sm:justify-start data-[state=active]:bg-white data-[state=active]:shadow-sm sm:data-[state=active]:text-primary-800 py-2 px-3"
            >
              {t("past")}
            </TabsTrigger>
            <TabsTrigger
              value="cancelled"
              className="w-full sm:justify-start data-[state=active]:bg-white data-[state=active]:shadow-sm sm:data-[state=active]:text-primary-800 py-2 px-3"
            >
              {t("cancelled")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="space-y-4 overflow-x-scroll">
            <span className="text-lg font-semibold text-gray-950 mb-4">
              {t("today")}
            </span>
            <BookingListContent
              patientId={patientId}
              facilityId={facilityId}
              dateFrom={dateQueryString(new Date())}
              dateTo={dateQueryString(new Date())}
            />
            <span className="text-lg font-semibold text-gray-950 mb-4">
              {t("next")}
            </span>
            <BookingListContent
              patientId={patientId}
              facilityId={facilityId}
              dateFrom={dateQueryString(addDays(new Date(), 1))}
            />
          </TabsContent>
          <TabsContent value="past" className="space-y-4 overflow-x-scroll">
            <BookingListContent
              patientId={patientId}
              facilityId={facilityId}
              dateTo={dateQueryString(subDays(new Date(), 1))}
              status={AppointmentNonCancelledStatuses}
            />
          </TabsContent>
          <TabsContent
            value="cancelled"
            className="space-y-4 overflow-x-scroll"
          >
            <BookingListContent
              patientId={patientId}
              facilityId={facilityId}
              status={AppointmentCancelledStatuses}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

const AppointmentCard = ({
  appointment,
  patientId,
  facilityId,
  appointmentId,
}: {
  appointment: Appointment;
  patientId: string;
  facilityId: string;
  appointmentId: string;
}) => {
  const { t } = useTranslation();

  return (
    <div className="p-3 shadow rounded-lg bg-white mt-1">
      <div className="flex flex-col gap-3">
        <div className="flex flex-row gap-6">
          <div className="flex flex-col">
            <span className="font-medium text-gray-950">
              {format(appointment.token_slot.start_datetime, "EEE, dd MMM")}
            </span>
            <span className="text-sm text-gray-600 font-medium">
              {appointment.token_slot.availability.name}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-gray-950">
              {format(appointment.token_slot.start_datetime, "hh:mm a")} -{" "}
              {format(appointment.token_slot.end_datetime, "hh:mm a")}
            </span>
            <span className="text-sm text-gray-600 font-medium">
              {t("duration")}:{" "}
              {differenceInMinutes(
                appointment.token_slot.end_datetime,
                appointment.token_slot.start_datetime,
              )}{" "}
              {t("minutes")}
            </span>
          </div>
        </div>
        <div className="px-2 py-1 rounded-sm bg-gray-50">
          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-2">
              <ScheduleResourceIcon resource={appointment} />
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-medium text-gray-950">
                  {formatScheduleResourceName(appointment)}
                </span>
              </div>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full border borde-gray-400 text-gray-950 font-semibold"
          asChild
        >
          <Link
            href={`/facility/${facilityId}/patient/${patientId}/appointments/${appointmentId}`}
          >
            {t("see_details")}
          </Link>
        </Button>
      </div>
    </div>
  );
};

const AppointmentTable = ({
  appointments,
  facilityId,
  patientId,
}: {
  appointments: Appointment[];
  facilityId: string;
  patientId: string;
}) => {
  const { t } = useTranslation();

  return (
    <Table className="border-separate border-spacing-y-2 border-spacing-x-0">
      <TableHeader className="bg-gray-100 border border-gray-200  border-y border-l rounded-tl-md align-middle">
        <TableRow className="divide-x">
          <TableHead className="w-14 border-y bg-gray-100 text-gray-700 text-sm">
            {t("date")}
          </TableHead>
          <TableHead className="w-14 border-y bg-gray-100 text-gray-700 text-sm">
            {t("time")}
          </TableHead>
          <TableHead className="w-30 border-y bg-gray-100 text-gray-700 text-sm">
            {t("resource")}
          </TableHead>
          <TableHead className="w-14 border-y bg-gray-100 hidden xl:table-cell text-gray-700 text-sm">
            {t("status")}
          </TableHead>
          <TableHead className="w-14 border-y bg-gray-100 text-gray-700 text-sm">
            {t("actions")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="bg-white">
        {appointments.map((appointment) => (
          <TableRow
            key={appointment.id} // added key for React
            className="shadow bg-white space-y-3 rounded-lg"
          >
            <TableCell className="p-4">
              <div className="flex gap-2 items-start justify-start">
                <CalendarDays size={16} className="mt-1" />
                <div className="flex flex-col">
                  <span className="font-medium text-gray-950">
                    {format(
                      appointment.token_slot.start_datetime,
                      "EEE, dd MMM",
                    )}
                  </span>
                  <span className="text-sm text-gray-600 font-medium">
                    {appointment.token_slot.availability.name}
                  </span>
                </div>
              </div>
            </TableCell>

            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium text-gray-950">
                  {format(appointment.token_slot.start_datetime, "hh:mm a")} -{" "}
                  {format(appointment.token_slot.end_datetime, "hh:mm a")}
                </span>
                <span className="text-sm text-gray-600 font-medium">
                  {t("duration")}:{" "}
                  {differenceInMinutes(
                    appointment.token_slot.end_datetime,
                    appointment.token_slot.start_datetime,
                  )}{" "}
                  {t("minutes")}
                </span>
              </div>
            </TableCell>

            <TableCell>
              <div className="px-2 py-1">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-row gap-2">
                    <ScheduleResourceIcon resource={appointment} />
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm font-medium text-gray-950">
                        {formatScheduleResourceName(appointment)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TableCell>

            <TableCell className="hidden xl:table-cell">
              <div className="flex flex-row items-start justify-start">
                <Badge variant="green" className="text-gray-700">
                  {t(appointment.status)}
                </Badge>
              </div>
            </TableCell>

            <TableCell>
              <Button variant="outline" className="text-gray-950">
                <Link
                  href={`/facility/${facilityId}/patient/${patientId}/appointments/${appointment.id}`}
                >
                  {t("see_details")}
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const BookingListContent = ({
  patientId,
  facilityId,
  dateFrom,
  dateTo,
  status,
}: {
  patientId: string;
  facilityId: string;
  dateFrom?: string;
  dateTo?: string;
  status?: readonly AppointmentStatus[];
}) => {
  const { t } = useTranslation();
  const { data: appointments, isLoading } = useQuery({
    queryKey: ["patient-appointments", patientId, dateFrom, dateTo, facilityId],
    queryFn: query(scheduleApi.appointments.getAppointments, {
      pathParams: { patientId },
      queryParams: {
        limit: 100,
        date_after: dateFrom,
        facility: facilityId,
        date_before: dateTo,
        status: status?.join(","),
      },
    }),
  });

  const filteredAppointments =
    appointments?.results
      .filter((appointment) => status?.includes(appointment.status) ?? true)
      .filter((appointment) =>
        dateFrom
          ? isAfter(appointment.token_slot.start_datetime, startOfDay(dateFrom))
          : true,
      )
      .filter((appointment) =>
        dateTo
          ? isBefore(appointment.token_slot.start_datetime, endOfDay(dateTo))
          : true,
      )
      .sort((a, b) =>
        compareAsc(a.token_slot.start_datetime, b.token_slot.start_datetime),
      ) ?? [];

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="hidden sm:block">
          <TableSkeleton count={10} />
        </div>
        <div className="sm:hidden">
          <CardGridSkeleton count={10} />
        </div>
      </div>
    );
  }

  if (filteredAppointments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{t("no_appointments")}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="hidden sm:block">
        <AppointmentTable
          appointments={filteredAppointments}
          facilityId={facilityId}
          patientId={patientId}
        />
      </div>
      <div className="sm:hidden">
        {filteredAppointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            patientId={patientId}
            facilityId={facilityId}
            appointmentId={appointment.id}
          />
        ))}
      </div>
    </div>
  );
};
