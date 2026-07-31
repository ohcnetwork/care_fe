import { useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
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
  /** Lets a call site quieten the trigger where other actions lead. */
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
  /** Called after a successful cancellation, e.g. to navigate away. */
  onCancelled?: () => void;
}

export function CancelAppointmentButton({
  appointment,
  size,
  variant = "outline",
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
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        {t("cancel_appointment")}
      </Button>

      <ConfirmActionDialog
        open={open}
        onOpenChange={setOpen}
        title={t("cancel_appointment")}
        description={t("patient_visits__cancel_confirmation", {
          name: formatScheduleResourceName(appointment),
          datetime: start.format("ddd, D MMM YYYY · h:mm A"),
        })}
        cancelText={t("patient_visits__keep_appointment")}
        confirmText={t("cancel_appointment")}
        variant="destructive"
        disabled={isPending}
        onConfirm={() =>
          cancelAppointment({
            appointment: appointment.id,
            patient: appointment.patient.id,
          })
        }
      />
    </>
  );
}
