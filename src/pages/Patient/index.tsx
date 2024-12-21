import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { navigate } from "raviger";
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

import Loading from "@/components/Common/Loading";
import { Appointment } from "@/components/Schedule/types";

import { CarePatientTokenKey } from "@/common/constants";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import { TokenData } from "@/types/auth/otpToken";

function OTPPatientHome() {
  const { t } = useTranslation();
  const tokenData: TokenData = JSON.parse(
    localStorage.getItem(CarePatientTokenKey) || "{}",
  );

  if (!tokenData) {
    navigate("/login");
  }

  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ["appointment", tokenData.phoneNumber],
    queryFn: query(routes.otp.getAppointments, {
      headers: {
        Authorization: `Bearer ${tokenData.token}`,
      },
    }),
    enabled: !!tokenData.token,
  });

  const getStatusChip = (status: string) => {
    return (
      <Badge
        variant={
          status === "checked_in"
            ? "secondary"
            : status === "booked"
              ? "primary"
              : "default"
        }
      >
        {t(status)}
      </Badge>
    );
  };

  const getTableRow = (appointment: Appointment) => {
    const appointmentTime = dayjs(appointment.token_slot.start_datetime);
    const appointmentDate = appointmentTime.format("DD MMMM YYYY");
    const appointmentTimeSlot = appointmentTime.format("hh:mm a");
    return (
      <TableRow key={appointment.id}>
        <td colSpan={7}>
          <div className="flex bg-white rounded-md shadow items-center p-3">
            <TableCell className="ml-2 border-0 first:rounded-l-md w-[14.28%]">
              {appointment?.resource
                ? formatName(appointment.resource)
                : "Resource from BE"}
            </TableCell>
            <TableCell className="border-0 w-[14.28%]">
              {"Currently doesn't exist"}
            </TableCell>
            <TableCell className="border-0 w-[14.28%]">
              {appointmentDate}
            </TableCell>
            <TableCell className="border-0 w-[14.28%]">
              {appointmentTimeSlot}
            </TableCell>
            <TableCell className="border-0 w-[14.28%]">
              {"Facility Location"}
            </TableCell>
            <TableCell className="border-0 w-[14.28%]">
              {getStatusChip(appointment.status)}
            </TableCell>
            <TableCell className="border-0 last:rounded-r-md w-[14.28%]">
              <Button
                variant="secondary"
                className="border border-secondary-600 shadow"
              >
                {t("view_details")}
              </Button>
            </TableCell>
          </div>
        </td>
      </TableRow>
    );
  };

  const getTableHeader = () => {
    return (
      <TableHeader>
        <TableRow>
          <th colSpan={7}>
            <div className="flex rounded-md shadow">
              <TableHead className="ml-2 bg-secondary-200 border-0 first:rounded-l-md w-[14.28%] content-center">
                {t("practitioner")}
              </TableHead>
              <TableHead className="bg-secondary-200 border-0 w-[14.28%] content-center">
                {t("appointment_type")}
              </TableHead>
              <TableHead className="bg-secondary-200 border-0 w-[14.28%] content-center">
                {t("date")}
              </TableHead>
              <TableHead className="bg-secondary-200 border-0 w-[14.28%] content-center">
                {t("time_slot")}
              </TableHead>
              <TableHead className="bg-secondary-200 border-0 w-[14.28%] content-center">
                {t("location")}
              </TableHead>
              <TableHead className="bg-secondary-200 border-0 w-[14.28%] content-center">
                {t("status")}
              </TableHead>
              <TableHead className="bg-secondary-200 border-0 last:rounded-r-md w-[14.28%] content-center">
                {t("action")}
              </TableHead>
            </div>
          </th>
        </TableRow>
      </TableHeader>
    );
  };

  if (isLoading) {
    return <Loading />;
  }

  const appointments = appointmentsData?.results.sort(
    (a, b) =>
      new Date(a.token_slot.start_datetime).getTime() -
      new Date(b.token_slot.start_datetime).getTime(),
  );

  const pastAppointments = appointments?.filter((appointment) =>
    dayjs().isAfter(dayjs(appointment.token_slot.start_datetime)),
  );

  const scheduledAppointments = appointments?.filter((appointment) =>
    dayjs().isBefore(dayjs(appointment.token_slot.start_datetime)),
  );

  const getAppointmentsTable = (appointments: Appointment[] | undefined) => {
    return (
      <Table className="[border-spacing:0_0.5rem] border-separate">
        {getTableHeader()}
        <TableBody>
          {appointments?.map((appointment) => getTableRow(appointment))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="container mx-auto mt-2">
      <div className="flex justify-between">
        <span className="text-xl font-bold">{t("appointments")}</span>
        <Button variant="primary_gradient">
          <span className="bg-gradient-to-b from-white/15 to-transparent"></span>
          <span>{t("book_appointment")}</span>
        </Button>
      </div>
      <Tabs defaultValue="scheduled" className="mt-4">
        <TabsList>
          <TabsTrigger value="scheduled">{t("scheduled")}</TabsTrigger>
          <TabsTrigger value="history">{t("history")}</TabsTrigger>
        </TabsList>
        <TabsContent value="scheduled">
          {getAppointmentsTable(scheduledAppointments)}
        </TabsContent>
        <TabsContent value="history">
          {getAppointmentsTable(pastAppointments)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default OTPPatientHome;
