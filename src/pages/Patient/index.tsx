import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Link, navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Loading from "@/components/Common/Loading";

import { usePatientContext } from "@/hooks/usePatientUser";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { formatName, formatPatientAge } from "@/Utils/utils";
import { formatAppointmentSlotTime } from "@/pages/Appointments/utils";
import PublicAppointmentApi from "@/types/scheduling/PublicAppointmentApi";
import { Appointment } from "@/types/scheduling/schedule";

function PatientIndex() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

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

  const { mutate: cancelAppointment, isPending } = useMutation({
    mutationFn: mutate(PublicAppointmentApi.cancelAppointment, {
      headers: {
        Authorization: `Bearer ${tokenData?.token}`,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["appointment", tokenData?.phoneNumber],
      });
    },
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

  if (isLoading) {
    return <Loading />;
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

  function AppointmentDialog(props: {
    appointment: Appointment | undefined;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) {
    const { appointment, open, onOpenChange } = props;
    if (!appointment) return <></>;
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="p-0">
          <DialogHeader className="p-3">
            <DialogDescription className="mb-4">
              {t("appointment_details")}
            </DialogDescription>
            <div className="flex flex-row justify-between">
              <div className="space-y-1">
                <Label className="text-xs">{t("practitioner")}</Label>
                <p className="text-base font-semibold">
                  {formatName(appointment.user)}
                </p>
                <p className="text-sm font-semibold text-gray-600">
                  {formatAppointmentSlotTime(appointment)}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("patient_name")}</Label>
                <p className="font-semibold text-base">
                  {appointment.patient.name}
                </p>
                <p className="text-sm text-gray-600 font-medium">
                  {formatPatientAge(appointment.patient as any, true)},{" "}
                  {t(`GENDER__${appointment.patient.gender}`)}
                </p>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="flex flex-row sm:justify-between items-center bg-blue-200 m-0 w-full p-3 rounded-b-lg">
            <span className="text-sm font-semibold text-blue-700">
              {t(appointment.status)}
            </span>
            <span className="flex flex-row gap-2">
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={() =>
                  cancelAppointment({
                    appointment: appointment.id,
                    patient: appointment.patient.id,
                  })
                }
              >
                <span>{t("cancel")}</span>
              </Button>
              <Button variant="secondary">
                <span>{t("reschedule")}</span>
              </Button>
            </span>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const getAppointmentCard = (appointment: Appointment) => {
    const appointmentTime = dayjs(appointment.token_slot.start_datetime);
    const appointmentDate = appointmentTime.format("DD MMMM YYYY");
    const appointmentTimeSlot = appointmentTime.format("hh:mm a");
    return (
      <Card key={appointment.id} className="shadow overflow-hidden">
        <CardHeader className="px-6 pb-3 bg-secondary-200 flex flex-col md:flex-row justify-between">
          <CardTitle>
            <div className="flex flex-col">
              <span className="text-xs font-medium">{t("practitioner")}: </span>
              <span className="text-sm">
                {appointment?.user
                  ? formatName(appointment.user)
                  : "Resource from BE"}
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
            <span className="bg-gradient-to-b from-white/15 to-transparent"></span>
            <span>{t("view_details")}</span>
          </Button>
        </CardHeader>
        <CardContent className="mt-2 pt-2 px-6 pb-3">
          <div className="flex flex-col md:flex-row gap-2 justify-between">
            <div className="flex flex-row md:flex-col gap-2 md:gap-0">
              <span className="text-xs font-medium">
                {t("appointment_type")}:{" "}
              </span>
              <span className="text-sm">{"Currently doesn't exist"}</span>
            </div>
            <div className="flex flex-row md:flex-col gap-2 md:gap-0">
              <span className="text-xs font-medium">{t("location")}: </span>
              <span className="text-sm">{"Facility Location"}</span>
            </div>
            <div className="flex flex-row md:flex-col gap-2 md:gap-0 items-center md:items-start">
              <span className="text-xs font-medium">{t("status")}: </span>
              <span>{getStatusChip(appointment.status)}</span>
            </div>
            <div className="flex flex-row gap-3 justify-between">
              <div className="flex flex-row md:flex-col gap-2 md:gap-0">
                <span className="text-xs font-medium">{t("date")}: </span>
                <span className="text-sm">{appointmentDate}</span>
              </div>
              <div className="flex flex-row md:flex-col gap-2 md:gap-0">
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
          <div className="col-span-full text-center bg-white shadow rounded p-4 font-medium">
            {t("no_appointments")}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <AppointmentDialog
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
              <span className="bg-gradient-to-b from-white/15 to-transparent"></span>
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
