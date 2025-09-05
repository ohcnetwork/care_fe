import { differenceInMinutes, format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

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

import { dateQueryString, formatName } from "@/Utils/utils";
import {
  Appointment,
  AppointmentNonCancelledStatuses,
  AppointmentStatus,
} from "@/types/scheduling/schedule";

import { BookingListContent } from "./BookingListContent";

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
            <BookingListContent
              patientId={patientId}
              facilityId={facilityId}
              date_from={dateQueryString(new Date())}
              isUpcoming={true}
            />
          </TabsContent>
          <TabsContent value="past" className="space-y-4 overflow-x-scroll">
            <BookingListContent
              patientId={patientId}
              facilityId={facilityId}
              date_to={dateQueryString(new Date())}
              status={
                AppointmentNonCancelledStatuses as unknown as AppointmentStatus[]
              }
            />
          </TabsContent>
          <TabsContent
            value="cancelled"
            className="space-y-4 overflow-x-scroll"
          >
            <BookingListContent
              patientId={patientId}
              facilityId={facilityId}
              status={["cancelled", "entered_in_error", "rescheduled"]}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export const AppointmentCard = ({
  appointment,
  patientId,
  facilityId,
  appointmentId,
}: {
  appointment: Appointment | undefined;
  patientId: string;
  facilityId: string;
  appointmentId: string;
}) => {
  const { t } = useTranslation();

  return (
    <div className="p-3 shadow rounded-lg bg-white sm:hidden mt-1">
      <div className="flex flex-col gap-3">
        <div className="flex flex-row gap-6">
          <div className="flex flex-col">
            <span className="font-medium text-gray-950">
              {format(
                new Date(appointment?.token_slot?.start_datetime ?? ""),
                "EEE, dd MMM",
              )}
            </span>
            <span className="text-sm text-gray-600 font-medium">
              {appointment?.token_slot.availability.name}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-gray-950">
              {format(
                new Date(appointment?.token_slot?.start_datetime ?? ""),
                "hh:mm a",
              )}{" "}
              -{" "}
              {format(
                new Date(appointment?.token_slot?.end_datetime ?? ""),
                "hh:mm a",
              )}
            </span>
            <span className="text-sm text-gray-600 font-medium">
              {t("duration")}:{" "}
              {differenceInMinutes(
                new Date(appointment?.token_slot.end_datetime ?? ""),
                new Date(appointment?.token_slot.start_datetime ?? ""),
              )}{" "}
              {t("minutes")}
            </span>
          </div>
        </div>
        <div className="px-2 py-1 rounded-sm bg-gray-50">
          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-2">
              <Avatar
                className="size-8 rounded-full border border-white shadow-sm"
                name={
                  appointment?.booked_by
                    ? formatName(appointment?.booked_by)
                    : "N/A"
                }
              />
              <div className="flex flex-row items-center justify-center gap-2">
                <span className="text-sm font-medium text-gray-950">
                  {appointment?.booked_by
                    ? formatName(appointment?.booked_by)
                    : ""}
                </span>
                <div className="size-1 bg-gray-600 rounded-full" />
                <span className="text-sm text-gray-700 font-medium capitalize">
                  {appointment?.booked_by?.user_type ?? t("na")}
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

export const AppointmentTable = ({
  appointments,
  facilityId,
  patientId,
}: {
  appointments: Appointment[] | undefined;
  facilityId: string;
  patientId: string;
}) => {
  const { t } = useTranslation();

  return (
    <Table className="hidden sm:table border-separate border-spacing-y-2 border-spacing-x-0">
      <TableHeader className="bg-gray-100 border border-gray-200  border-y border-l rounded-tl-md align-middle">
        <TableRow className="divide-x">
          <TableHead className="border-y bg-gray-100 text-gray-700 text-sm">
            {t("date")}
          </TableHead>
          <TableHead className="border-y bg-gray-100 text-gray-700 text-sm">
            {t("time")}
          </TableHead>
          <TableHead className="border-y bg-gray-100 text-gray-700 text-sm w-30">
            {t("practitioner")}
          </TableHead>
          <TableHead className="border-y bg-gray-100 hidden xl:table-cell text-gray-700 text-sm">
            {t("status")}
          </TableHead>
          <TableHead className="border-y bg-gray-100 text-gray-700 text-sm">
            {t("actions")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="bg-white">
        {appointments &&
          appointments.map((appointment) => (
            <TableRow
              key={appointment?.id} // added key for React
              className="shadow bg-white space-y-3 rounded-lg"
            >
              <TableCell className="p-4">
                <div className="flex gap-2 items-start justify-start">
                  <CalendarDays size={16} className="mt-1" />
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-950">
                      {format(
                        new Date(appointment?.token_slot?.start_datetime ?? ""),
                        "EEE, dd MMM",
                      )}
                    </span>
                    <span className="text-sm text-gray-600 font-medium">
                      {appointment?.token_slot?.availability?.name}
                    </span>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-950">
                    {format(
                      new Date(appointment?.token_slot?.start_datetime ?? ""),
                      "hh:mm a",
                    )}{" "}
                    -{" "}
                    {format(
                      new Date(appointment?.token_slot?.end_datetime ?? ""),
                      "hh:mm a",
                    )}
                  </span>
                  <span className="text-sm text-gray-600 font-medium">
                    {t("duration")}:{" "}
                    {differenceInMinutes(
                      new Date(appointment?.token_slot?.end_datetime ?? ""),
                      new Date(appointment?.token_slot?.start_datetime ?? ""),
                    )}{" "}
                    {t("minutes")}
                  </span>
                </div>
              </TableCell>

              <TableCell>
                <div className="px-2 py-1">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-row gap-2">
                      <Avatar
                        className="size-8 rounded-full border border-white shadow-sm"
                        name={
                          appointment?.booked_by
                            ? formatName(appointment?.booked_by)
                            : "N/A"
                        }
                      />
                      <div className="flex flex-row items-center justify-center gap-2">
                        <span className="text-sm font-medium text-gray-950">
                          {appointment?.booked_by
                            ? formatName(appointment?.booked_by)
                            : "N/A"}
                        </span>
                        <div className="size-1 bg-gray-600 rounded-full" />
                        <span className="text-sm text-gray-700 font-medium capitalize">
                          {appointment?.booked_by?.user_type ?? t("na")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </TableCell>

              <TableCell className="hidden xl:table-cell">
                <div className="flex flex-row items-start justify-start">
                  <Badge variant="green" className="text-gray-700">
                    {t(appointment?.status)}
                  </Badge>
                </div>
              </TableCell>

              <TableCell>
                <Button variant="outline" className="text-gray-950">
                  <Link
                    href={`/facility/${facilityId}/patient/${patientId}/appointments/${appointment?.id}`}
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
