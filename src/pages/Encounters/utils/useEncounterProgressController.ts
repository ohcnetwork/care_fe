import { BatchRequestBody } from "@/types/base/batch/batch";
import batchApi from "@/types/base/batch/batchApi";
import {
  EncounterRead,
  EncounterStatus,
} from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";
import {
  AppointmentFinalStatuses,
  AppointmentStatus,
} from "@/types/scheduling/schedule";
import scheduleApi from "@/types/scheduling/scheduleApi";
import { TokenActiveStatuses, TokenStatus } from "@/types/tokens/token/token";
import tokenApi from "@/types/tokens/token/tokenApi";
import mutate from "@/Utils/request/mutate";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const encounterRequiresDischarge = (encounter: EncounterRead) =>
  encounter.encounter_class === "imp" &&
  encounter.status !== EncounterStatus.DISCHARGED;

const buildEncounterCompletionRequest = (encounter: EncounterRead) => {
  if (encounter.status === EncounterStatus.COMPLETED) return [];
  return [
    {
      url: encounterApi.update.path.replace("{id}", encounter.id),
      method: encounterApi.update.method,
      reference_id: "encounter-closed",
      body: {
        ...encounter,
        status: EncounterStatus.COMPLETED,
        period: {
          start: encounter.period.start,
          end: encounter.period.end || new Date().toISOString(),
        },
      },
    },
  ];
};

const buildAppointmentRequests = (encounter: EncounterRead) => {
  const requests = [];

  const appointment = encounter.appointment;

  if (
    appointment?.id &&
    !AppointmentFinalStatuses.includes(appointment.status)
  ) {
    requests.push({
      url: scheduleApi.appointments.update.path
        .replace("{facilityId}", encounter.facility.id)
        .replace("{id}", appointment.id),
      method: scheduleApi.appointments.update.method,
      reference_id: "appointment-closed",
      body: {
        status: AppointmentStatus.FULFILLED,
        note: appointment.note,
      },
    });
  }

  if (
    appointment?.token?.id &&
    TokenActiveStatuses.includes(appointment.token.status)
  ) {
    requests.push({
      url: tokenApi.update.path
        .replace("{facility_id}", encounter.facility.id)
        .replace("{queue_id}", appointment.token.queue.id)
        .replace("{id}", appointment.token.id),
      method: tokenApi.update.method,
      reference_id: "token-closed",
      body: {
        ...appointment.token,
        note: appointment.token.note,
        sub_queue: appointment.token.sub_queue?.id || null,
        status: TokenStatus.FULFILLED,
      },
    });
  }

  return requests;
};

export function useEncounterProgressController({
  encounter,
  onDischargeRequired,
}: {
  encounter: EncounterRead;
  onDischargeRequired?: () => void;
}) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { mutate: batch, isPending } = useMutation({
    mutationFn: (requests: BatchRequestBody["requests"]) =>
      mutate(batchApi.batchRequest)({ requests }),

    onSuccess: ({ results }) => {
      if (results.some((r) => r.reference_id === "encounter-closed")) {
        queryClient.invalidateQueries({
          queryKey: ["encounter", encounter.id],
        });
        toast.success(t("encounter_marked_as_complete"));
      }

      if (results.some((r) => r.reference_id === "appointment-closed")) {
        queryClient.invalidateQueries({ queryKey: ["appointment"] });
        queryClient.invalidateQueries({ queryKey: ["tokens"] });
        toast.success(t("appointment_closed_successfully"));
      }
    },
  });

  const completeEverything = () => {
    if (onDischargeRequired && encounterRequiresDischarge(encounter)) {
      onDischargeRequired();
      return;
    }
    batch([
      ...buildEncounterCompletionRequest(encounter),
      ...buildAppointmentRequests(encounter),
    ]);
  };

  const completeEncounter = () => {
    if (onDischargeRequired && encounterRequiresDischarge(encounter)) {
      onDischargeRequired();
      return;
    }
    batch(buildEncounterCompletionRequest(encounter));
  };

  const completeAppointment = () => {
    batch(buildAppointmentRequests(encounter));
  };

  return {
    completeEverything,
    completeAppointment,
    completeEncounter,
    isPending,
  };
}
