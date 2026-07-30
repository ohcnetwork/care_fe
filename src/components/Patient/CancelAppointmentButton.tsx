import { useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { usePatientContext } from "@/hooks/usePatientUser";

import mutate from "@/Utils/request/mutate";
import PublicAppointmentApi from "@/types/scheduling/PublicAppointmentApi";
import {
  AppointmentFinalStatuses,
  PublicAppointment,
  formatScheduleResourceName,
} from "@/types/scheduling/schedule";

/** Cancelling only makes sense while the appointment is still live. */
export function isAppointmentCancellable(
  appointment: PublicAppointment,
): boolean {
  return !AppointmentFinalStatuses.includes(appointment.status);
}

interface CancelAppointmentButtonProps {
  appointment: PublicAppointment;
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
  /** Called after a successful cancellation, e.g. to navigate away. */
  onCancelled?: () => void;
}

export function CancelAppointmentButton({
  appointment,
  size,
  className,
  onCancelled,
}: CancelAppointmentButtonProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { tokenData } = usePatientContext();
  const [open, setOpen] = useState(false);

  const { mutate: cancelAppointment, isPending } = useMutation({
    mutationFn: mutate(PublicAppointmentApi.cancelAppointment, {
      headers: { Authorization: `Bearer ${tokenData?.token}` },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["appointment", tokenData?.phoneNumber],
      });
      toast.success(t("appointment_cancelled"));
      setOpen(false);
      onCancelled?.();
    },
  });

  const start = dayjs(appointment.token_slot.start_datetime);

  return (
    <>
      <Button
        variant="outline"
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        {t("cancel_appointment")}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-w-[440px]">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cancel_appointment")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("patient_visits__cancel_confirmation", {
                name: formatScheduleResourceName(appointment),
                datetime: start.format("ddd, D MMM YYYY · h:mm A"),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              {t("patient_visits__keep_appointment")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(event) => {
                // Keep the dialog up until the request resolves.
                event.preventDefault();
                cancelAppointment({
                  appointment: appointment.id,
                  patient: appointment.patient.id,
                });
              }}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {t("cancel_appointment")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
