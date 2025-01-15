import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { usePatientContext } from "@/hooks/usePatientUser";

import mutate from "@/Utils/request/mutate";
import { formatName, formatPatientAge } from "@/Utils/utils";
import { formatAppointmentSlotTime } from "@/pages/Appointments/utils";
import PublicAppointmentApi from "@/types/scheduling/PublicAppointmentApi";
import { Appointment } from "@/types/scheduling/schedule";

function AppointmentDialog({
  appointment,
  open,
  onOpenChange,
  setAppointmentDialogOpen,
}: {
  appointment: Appointment | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setAppointmentDialogOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const patient = usePatientContext();
  const tokenData = patient?.tokenData;
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
      setAppointmentDialogOpen(false);
    },
  });

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
              onClick={() => {
                cancelAppointment({
                  appointment: appointment.id,
                  patient: appointment.patient.id,
                });
              }}
            >
              <span>{t("cancel")}</span>
            </Button>
            {/* TODO: wire this */}
            {/* <Button variant="secondary">
              <span>{t("reschedule")}</span>
            </Button> */}
          </span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AppointmentDialog;
