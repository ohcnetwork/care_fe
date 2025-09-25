import { useMutation, useQueryClient } from "@tanstack/react-query";
import { navigate } from "raviger";
import { Dispatch, SetStateAction, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { formatPatientAge } from "@/Utils/utils";
import { formatAppointmentSlotTime } from "@/pages/Appointments/utils";
import PublicAppointmentApi from "@/types/scheduling/PublicAppointmentApi";
import {
  Appointment,
  AppointmentFinalStatuses,
  formatScheduleResourceName,
} from "@/types/scheduling/schedule";

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
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const handleRescheduleAppointment = (appointment: Appointment) => {
    // TODO: I am pretty sure this is not correct
    navigate(
      `/facility/${appointment.facility.id}/appointments/${appointment.resource.id}/reschedule/${appointment.id}`,
    );
  };
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
      toast.success(t("appointment_cancelled"));
      setAppointmentDialogOpen(false);
    },
  });

  if (!appointment) return <></>;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="p-0">
          <DialogHeader className="p-3">
            <DialogDescription className="mb-4">
              {t("appointment_details")}
            </DialogDescription>
            <div className="flex flex-row justify-between">
              <div className="space-y-1">
                <Label className="text-xs">
                  {t(`schedulable_resource__${appointment.resource_type}`)}
                </Label>
                <p className="text-base font-semibold">
                  {formatScheduleResourceName(appointment)}
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
                  {formatPatientAge(appointment.patient, true)},{" "}
                  {t(`GENDER__${appointment.patient.gender}`)}
                </p>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="flex flex-row sm:justify-between items-center bg-blue-200 m-0 w-full p-3 rounded-b-lg">
            <span className="text-sm font-semibold text-blue-700">
              {t(appointment.status)}
            </span>
            {!AppointmentFinalStatuses.includes(appointment.status) && (
              <span className="flex flex-row gap-2">
                <AlertDialog
                  open={isCancelDialogOpen}
                  onOpenChange={(open) => setIsCancelDialogOpen(open)}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      type="button"
                      disabled={isPending}
                      onClick={() => setIsCancelDialogOpen(true)}
                    >
                      <span>{t("cancel")}</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("are_you_sure")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        <Alert variant="destructive" className="mt-4">
                          <AlertTitle>{t("warning")}</AlertTitle>
                          <AlertDescription>
                            {t(
                              "this_will_permanently_cancel_the_appointment_and_cannot_be_undone",
                              {
                                date: formatAppointmentSlotTime(appointment),
                                resource:
                                  formatScheduleResourceName(appointment),
                                facility: appointment.facility.name,
                              },
                            )}
                          </AlertDescription>
                        </Alert>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        onClick={() => setIsCancelDialogOpen(false)}
                      >
                        {t("cancel")}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className={cn(
                          buttonVariants({ variant: "destructive" }),
                        )}
                        onClick={() => {
                          cancelAppointment({
                            appointment: appointment.id,
                            patient: appointment.patient.id,
                          });
                          setIsCancelDialogOpen(false);
                        }}
                      >
                        {t("confirm")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                {appointment.status !== "in_consultation" && (
                  <Button
                    variant="secondary"
                    onClick={() => handleRescheduleAppointment(appointment)}
                  >
                    <span>{t("reschedule")}</span>
                  </Button>
                )}
              </span>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AppointmentDialog;
