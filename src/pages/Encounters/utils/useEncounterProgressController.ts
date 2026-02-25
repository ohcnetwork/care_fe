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
  const request: BatchRequestBody["requests"] = [];
  request.push({
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
  });
  return request;
};

const buildAppointmentRequests = (encounter: EncounterRead) => {
  const requests: BatchRequestBody["requests"] = [];

  const appt = encounter.appointment;

  if (appt?.id && !AppointmentFinalStatuses.includes(appt.status)) {
    requests.push({
      url: scheduleApi.appointments.update.path
        .replace("{facilityId}", encounter.facility.id)
        .replace("{id}", appt.id),
      method: scheduleApi.appointments.update.method,
      reference_id: "appointment-closed",
      body: {
        status: AppointmentStatus.FULFILLED,
        note: appt.note,
      },
    });
  }

  if (appt?.token?.id && TokenActiveStatuses.includes(appt.token.status)) {
    requests.push({
      url: tokenApi.update.path
        .replace("{facility_id}", encounter.facility.id)
        .replace("{queue_id}", appt.token.queue.id)
        .replace("{id}", appt.token.id),
      method: tokenApi.update.method,
      reference_id: "token-closed",
      body: {
        ...appt.token,
        note: appt.token.note,
        sub_queue: appt.token.sub_queue?.id || null,
        status: TokenStatus.FULFILLED,
      },
    });
  }

  return requests;
};

const useBatchRequest = (encounterId: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (requests: BatchRequestBody["requests"]) =>
      mutate(batchApi.batchRequest)({ requests }),

    onSuccess: ({ results }) => {
      if (results.some((r) => r.reference_id === "encounter-closed")) {
        queryClient.invalidateQueries({ queryKey: ["encounter", encounterId] });
        toast.success(t("encounter_marked_as_complete"));
      }

      if (results.some((r) => r.reference_id === "appointment-closed")) {
        queryClient.invalidateQueries({ queryKey: ["appointment"] });
        queryClient.invalidateQueries({ queryKey: ["tokens"] });
        toast.success(t("appointment_closed_successfully"));
      }
    },
  });
};

export function useCompleteEncounter({
  encounter,
  onDischargeRequired,
}: {
  encounter: EncounterRead;
  onDischargeRequired?: () => void;
}) {
  const batch = useBatchRequest(encounter.id);

  const completeEncounter = () => {
    if (encounterRequiresDischarge(encounter)) {
      onDischargeRequired?.();
      return;
    }

    batch.mutate(buildEncounterCompletionRequest(encounter));
  };

  return { completeEncounter, isPending: batch.isPending };
}

export function useCompleteAppointment({
  encounter,
}: {
  encounter: EncounterRead;
}) {
  const batch = useBatchRequest(encounter.id);

  const completeAppointment = () => {
    const requests = buildAppointmentRequests(encounter);
    if (requests.length) batch.mutate(requests);
  };

  return { completeAppointment, isPending: batch.isPending };
}

export function useCompleteEverything({
  encounter,
  onDischargeRequired,
}: {
  encounter: EncounterRead;
  onDischargeRequired?: () => void;
}) {
  const batch = useBatchRequest(encounter.id);

  const completeEverything = () => {
    if (encounterRequiresDischarge(encounter)) {
      onDischargeRequired?.();
      return;
    }

    const requests: BatchRequestBody["requests"] = [];

    if (encounter.status !== EncounterStatus.COMPLETED) {
      requests.push(...buildEncounterCompletionRequest(encounter));
    }

    requests.push(...buildAppointmentRequests(encounter));

    if (requests.length) batch.mutate(requests);
  };

  return { completeEverything, isPending: batch.isPending };
}
