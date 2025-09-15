import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Link, navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import { usePatientContext } from "@/hooks/usePatientUser";

import query from "@/Utils/request/query";
import PublicAppointmentApi from "@/types/scheduling/PublicAppointmentApi";
import {
  APPOINTMENT_STATUS_COLORS,
  Appointment,
  nameFromAppointment,
} from "@/types/scheduling/schedule";

import AppointmentDialog from "./components/AppointmentDialog";

function PatientIndex() {
  const { t } = useTranslation();

  const [selectedAppointment, setSelectedAppointment] = useState<
    Appointment | undefined
  >();
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);

  const patient = usePatientContext();
  const selectedPatient = patient?.selectedPatient;
  const tokenData = patient?.tokenData;

  if (!tokenData) {
    navigate("/login");
  }

  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ["appointment", tokenData?.phoneNumber],
    queryFn: query(PublicAppointmentApi.getAppointments, {
      headers: {
        Authorization: `Bearer ${tokenData?.token}`,
      },
    }),
    enabled: !!tokenData?.token,
  });

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between w-full mb-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 mt-4">
          <CardListSkeleton count={6} />
        </div>
      </div>
    );
  }

  const appointments = appointmentsData?.results
    .filter((appointment) => appointment?.patient.id == selectedPatient?.id)
    .sort(
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

  const getAppointmentCard = (appointment: Appointment) => {
    const appointmentTime = dayjs(appointment.token_slot.start_datetime);
    const appointmentDate = appointmentTime.format("DD MMMM YYYY");
    const appointmentTimeSlot = appointmentTime.format("hh:mm a");
    return (
      <Card key={appointment.id} className="shadow-sm overflow-hidden">
        <CardHeader className="px-6 pb-3 bg-secondary-200 flex flex-col md:flex-row justify-between">
          <CardTitle>
            <div className="flex flex-col">
              <span className="text-xs font-medium">
                {t(appointment.resource_type, { count: 1 })}:{" "}
              </span>
              <span className="text-sm">
                {nameFromAppointment(appointment)}
              </span>
            </div>
          </CardTitle>
          <Button
            variant="secondary"
            className="border border-secondary-400"
            onClick={() => {
              setSelectedAppointment(appointment);
              setAppointmentDialogOpen(true);
            }}
          >
            <span>{t("view_details")}</span>
          </Button>
        </CardHeader>

        <CardContent className="mt-2 pt-2 px-6 pb-3">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-row gap-3 justify-between md:flex-row md:flex-grow md:mr-6">
              <div className="flex flex-col gap-0 items-start md:flex-grow md:mr-4">
                <span className="text-xs font-medium">{t("location")}: </span>
                <span className="text-sm">
                  <Link href={`/facility/${appointment.facility.id}`}>
                    <span className="text-sm underline underline-offset-2 hover:cursor-pointer">
                      {appointment.facility?.name}
                    </span>
                  </Link>
                </span>
              </div>
              <div className="flex flex-col gap-0 items-start md:flex-none">
                <span className="text-xs font-medium">{t("status")}: </span>
                <span>
                  <Badge
                    variant={APPOINTMENT_STATUS_COLORS[appointment.status]}
                  >
                    {t(appointment.status)}
                  </Badge>
                </span>
              </div>
            </div>
            <div className="flex flex-row gap-3 justify-between md:flex-none">
              <div className="flex flex-col gap-0 items-start">
                <span className="text-xs font-medium">{t("date")}: </span>
                <span className="text-sm">{appointmentDate}</span>
              </div>
              <div className="flex flex-col gap-0 items-start">
                <span className="text-xs font-medium">{t("time_slot")}: </span>
                <span className="text-sm">{appointmentTimeSlot}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const getAppointmentCardContent = (
    appointments: Appointment[] | undefined,
  ) => {
    return (
      <div className="grid gap-4 mb-2">
        {appointments && appointments.length > 0 ? (
          appointments.map((appointment) => getAppointmentCard(appointment))
        ) : (
          <div className="col-span-full text-center bg-white shadow-sm rounded p-4 font-medium">
            {t("no_appointments")}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <AppointmentDialog
        setAppointmentDialogOpen={setAppointmentDialogOpen}
        appointment={selectedAppointment}
        open={appointmentDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAppointment(undefined);
          }
          setAppointmentDialogOpen(open);
        }}
      />
      <div className="container mx-auto mt-2">
        <div className="flex justify-between w-full">
          <span className="text-xl font-bold">{t("appointments")}</span>
          <Button variant="primary_gradient" className="sticky right-0" asChild>
            <Link href="/facilities">
              <span>{t("book_appointment")}</span>
            </Link>
          </Button>
        </div>
        <Tabs defaultValue="scheduled" className="mt-4">
          <TabsList>
            <TabsTrigger value="scheduled">{t("scheduled")}</TabsTrigger>
            <TabsTrigger value="history">{t("history")}</TabsTrigger>
          </TabsList>
          <TabsContent value="scheduled">
            {getAppointmentCardContent(scheduledAppointments)}
          </TabsContent>
          <TabsContent value="history">
            {getAppointmentCardContent(pastAppointments)}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

export default PatientIndex;
