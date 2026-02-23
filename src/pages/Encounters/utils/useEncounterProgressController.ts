import {
  BatchRequestBody,
  BatchRequestResponse,
} from "@/types/base/batch/batch";
import batchApi from "@/types/base/batch/batchApi";
import {
  EncounterEdit,
  EncounterRead,
  EncounterStatus,
} from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";
import {
  AppointmentFinalStatuses,
  AppointmentStatus,
  AppointmentUpdateRequest,
} from "@/types/scheduling/schedule";
import scheduleApi from "@/types/scheduling/scheduleApi";
import {
  TokenActiveStatuses,
  TokenStatus,
  TokenUpdate,
} from "@/types/tokens/token/token";
import tokenApi from "@/types/tokens/token/tokenApi";
import mutate from "@/Utils/request/mutate";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

type CompleteEncounterVariables = {
  requests: BatchRequestBody<
    AppointmentUpdateRequest | TokenUpdate | EncounterEdit
  >["requests"];
  encounter?: EncounterRead;
};

interface EncounterProgressControllerReturnType {
  isPending: boolean;
  completeEncounter: (opts: {
    encounter: EncounterRead;
    onDischargeRequired?: () => void;
  }) => void;
  completeAppointment: (opts: { encounter: EncounterRead }) => void;
  completeEverything: (opts: {
    encounter: EncounterRead;
    onDischargeRequired?: () => void;
  }) => void;
}

const getCompleteEncounterRequest = (encounter: EncounterRead) => {
  return {
    url: encounterApi.update.path.replace("{id}", encounter.id),
    method: encounterApi.update.method,
    reference_id: "encounter-closed",
    body: {
      ...encounter,
      status: EncounterStatus.COMPLETED,
      period: {
        start: encounter.period.start,
        end: encounter.period.end
          ? encounter.period.end
          : new Date().toISOString(),
      },
    },
  };
};

const getCompleteAppointmentRequest = (encounter: EncounterRead) => {
  return {
    url: scheduleApi.appointments.update.path
      .replace("{facilityId}", encounter.facility.id)
      .replace("{id}", encounter.appointment!.id),
    method: scheduleApi.appointments.update.method,
    reference_id: "appointment-closed",
    body: {
      status: AppointmentStatus.FULFILLED,
      note: encounter.appointment!.note,
    },
  };
};

const getCompleteTokenRequest = (encounter: EncounterRead) => {
  return {
    url: tokenApi.update.path
      .replace("{facility_id}", encounter.facility.id)
      .replace("{queue_id}", encounter.appointment!.token!.queue.id)
      .replace("{id}", encounter.appointment!.token!.id),
    method: tokenApi.update.method,
    reference_id: "token-closed",
    body: {
      ...encounter.appointment!.token!,
      note: encounter.appointment!.token!.note,
      sub_queue: encounter.appointment!.token!.sub_queue?.id || null,
      status: TokenStatus.FULFILLED,
    },
  };
};

const encounterRequiresDischarge = (encounter: EncounterRead) => {
  return (
    encounter.encounter_class === "imp" &&
    encounter.status !== EncounterStatus.DISCHARGED
  );
};

const canCompleteEncounter = (encounter: EncounterRead) => {
  return (
    encounterRequiresDischarge(encounter) === false &&
    encounter.status !== EncounterStatus.COMPLETED
  );
};

const canCompleteBooking = ({ appointment }: EncounterRead) => {
  if (!appointment?.id) {
    return false;
  }
  return !AppointmentFinalStatuses.includes(appointment.status);
};

const canCompleteToken = ({ appointment }: EncounterRead) => {
  if (!appointment?.token?.id) {
    return false;
  }
  return TokenActiveStatuses.includes(appointment.token.status);
};

const buildEncounterRequests = (
  encounter: EncounterRead,
): BatchRequestBody["requests"] => {
  const requests: BatchRequestBody["requests"] = [];
  if (canCompleteEncounter(encounter)) {
    requests.push(getCompleteEncounterRequest(encounter));
  }
  return requests;
};

const buildAppointmentRequests = (
  encounter: EncounterRead,
): BatchRequestBody["requests"] => {
  const requests: BatchRequestBody["requests"] = [];
  if (canCompleteBooking(encounter)) {
    requests.push(getCompleteAppointmentRequest(encounter));
  }
  if (canCompleteToken(encounter)) {
    requests.push(getCompleteTokenRequest(encounter));
  }
  return requests;
};

export function useEncounterProgressController(): EncounterProgressControllerReturnType {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { mutate: batchRequest, isPending: isBatchRequestPending } =
    useMutation({
      mutationFn: mutate(batchApi.batchRequest),
      onSuccess: (
        { results }: BatchRequestResponse,
        { encounter }: CompleteEncounterVariables,
      ) => {
        queryClient.invalidateQueries({
          queryKey: ["encounter", encounter?.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["appointment", encounter?.appointment?.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["tokens", encounter?.appointment?.token?.id],
        });

        if (
          results.some((result) => result.reference_id === "encounter-closed")
        ) {
          toast.success(t("encounter_marked_as_complete"));
        }

        if (
          results.some((result) => result.reference_id === "appointment-closed")
        ) {
          toast.success(t("appointment_closed_successfully"));
        }
      },
    });

  return {
    isPending: isBatchRequestPending,

    completeEncounter: ({ encounter, onDischargeRequired }) => {
      if (encounterRequiresDischarge(encounter)) {
        onDischargeRequired?.();
        return;
      }
      batchRequest({
        requests: buildEncounterRequests(encounter),
        encounter,
      });
    },

    completeAppointment: ({ encounter }) => {
      batchRequest({
        requests: buildAppointmentRequests(encounter),
        encounter,
      });
    },

    completeEverything: ({ encounter, onDischargeRequired }) => {
      if (encounterRequiresDischarge(encounter)) {
        onDischargeRequired?.();
        return;
      }
      batchRequest({
        requests: [
          ...buildEncounterRequests(encounter),
          ...buildAppointmentRequests(encounter),
        ],
        encounter,
      });
    },
  };
}
