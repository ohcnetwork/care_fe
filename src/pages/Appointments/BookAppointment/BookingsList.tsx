import { differenceInMinutes, format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Link, navigate } from "raviger";
import { useTranslation } from "react-i18next";

import query from "@/Utils/request/query";
import {
  Appointment,
  APPOINTMENT_STATUS_COLORS,
  AppointmentStatus,
  CancelledAppointmentStatuses,
  formatScheduleResourceName,
  PastAppointmentStatuses,
  UpcomingAppointmentStatuses,
} from "@/types/scheduling/schedule";
import scheduleApi from "@/types/scheduling/scheduleApi";

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

import { Avatar } from "@/components/Common/Avatar";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import { ScheduleResourceIcon } from "@/components/Schedule/ScheduleResourceIcon";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

interface BookingsListProps {
  patientId: string;
  facilityId?: string;
}

export const BookingsList = ({ patientId, facilityId }: BookingsListProps) => {
  const { t } = useTranslation();

  return (
    <div className="mt-2">
      <Tabs defaultValue="upcoming">
        <div className="flex flex-col gap-2">
          <TabsList className="grid grid-cols-3 bg-gray-100 h-10 w-full sm:w-fit">
            <TabsTrigger
              value="upcoming"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary-800"
            >
              {t("upcoming")}
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary-800"
            >
              {t("past")}
            </TabsTrigger>
            <TabsTrigger
              value="cancelled"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary-800"
            >
              {t("cancelled")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="space-y-4 overflow-x-scroll">
            <BookingListContent
              patientId={patientId}
              facilityId={facilityId}
              statuses={UpcomingAppointmentStatuses}
            />
          </TabsContent>
          <TabsContent value="past" className="space-y-4 overflow-x-scroll">
            <BookingListContent
              patientId={patientId}
              facilityId={facilityId}
              statuses={PastAppointmentStatuses}
            />
          </TabsContent>
          <TabsContent
            value="cancelled"
            className="space-y-4 overflow-x-scroll"
          >
            <BookingListContent
              patientId={patientId}
              facilityId={facilityId}
              statuses={CancelledAppointmentStatuses}
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
  appointmentId,
}: {
  appointment: Appointment;
  patientId: string;
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
            href={`/facility/${appointment.facility.id}/patient/${patientId}/appointments/${appointmentId}`}
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
  patientId,
  showFacilityInfo,
}: {
  appointments: Appointment[];
  patientId: string;
  showFacilityInfo: boolean;
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
          {showFacilityInfo && (
            <TableHead className="w-14 border-y bg-gray-100 text-gray-700 text-sm">
              {t("facility")}
            </TableHead>
          )}
          <TableHead className="w-14 border-y bg-gray-100 text-gray-700 text-sm">
            {t("status")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="bg-white">
        {appointments.map((appointment) => (
          <TableRow
            key={appointment.id}
            className="shadow bg-white space-y-3 rounded-lg cursor-pointer"
            onClick={() =>
              navigate(
                `/facility/${appointment.facility.id}/patient/${patientId}/appointments/${appointment.id}`,
              )
            }
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
                    <ScheduleResourceIcon
                      resource={appointment}
                      className="border border-white shadow-sm rounded-full"
                    />
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm font-medium text-gray-950">
                        {formatScheduleResourceName(appointment)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TableCell>

            {showFacilityInfo && (
              <TableCell>
                <div className="flex gap-2 items-center">
                  <Avatar
                    name={appointment.facility.name}
                    className="size-8 border border-white shadow-sm"
                  />
                  <span className="text-sm font-medium text-gray-950">
                    {appointment.facility.name}
                  </span>
                </div>
              </TableCell>
            )}

            <TableCell className="hidden xl:table-cell">
              <div className="flex flex-row items-start justify-start">
                <Badge variant={APPOINTMENT_STATUS_COLORS[appointment.status]}>
                  {t(appointment.status)}
                </Badge>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export const BookingListContent = ({
  patientId,
  facilityId,
  statuses,
}: {
  patientId: string;
  facilityId?: string;
  statuses?: readonly AppointmentStatus[];
}) => {
  const { t } = useTranslation();
  const { ref, inView } = useInView();

  const {
    data: appointmentsData,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["infinite-appointments", patientId, facilityId, statuses],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await query(scheduleApi.appointments.getAppointments, {
        pathParams: { patientId },
        queryParams: {
          offset: pageParam,
          limit: 15,
          facility: facilityId,
          status: statuses?.join(","),
        },
      })({ signal });
      return response;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const currentOffset = allPages.length * 15;
      return currentOffset < lastPage.count ? currentOffset : null;
    },
  });

  const appointments =
    appointmentsData?.pages.flatMap((page) => page.results) ?? [];

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  if (isLoading) {
    return <CardListSkeleton count={15} />;
  }

  if (appointments.length === 0) {
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
          appointments={appointments}
          patientId={patientId}
          showFacilityInfo={!facilityId}
        />
      </div>
      <div className="sm:hidden space-y-4">
        {appointments.map((appointment) => (
          <AppointmentCard
            key={`card-${appointment.id}`}
            appointment={appointment}
            patientId={patientId}
            appointmentId={appointment.id}
          />
        ))}
      </div>
      <div ref={ref} />
      {isFetchingNextPage && <CardListSkeleton count={2} />}
      {!hasNextPage && !isFetchingNextPage && (
        <div className="border-b border-gray-300 pb-2" />
      )}
    </div>
  );
};
