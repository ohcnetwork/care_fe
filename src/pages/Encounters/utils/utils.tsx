import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

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

export const buildEncounterUrl = (
  patientId: string,
  subPath: string,
  facilityId?: string,
) => {
  if (facilityId) {
    return `/facility/${facilityId}/patient/${patientId}${subPath}`;
  }
  return `/organization/organizationId/patient/${patientId}${subPath}`;
};

type CompleteEncounterVariables = {
  requests: BatchRequestBody<
    AppointmentUpdateRequest | TokenUpdate | EncounterEdit
  >["requests"];
  encounter?: EncounterRead;
};

export function useEncounterProgressController() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { mutate: batchRequest, isPending: isBatchRequestPending } =
    useMutation({
      mutationFn: (variables: CompleteEncounterVariables) =>
        mutate(batchApi.batchRequest)({ requests: variables.requests }),
      onSuccess: (
        results: BatchRequestResponse,
        variables: CompleteEncounterVariables,
      ) => {
        const encounter = variables.encounter;
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
          results.results.some(
            (result) => result.reference_id === "encounter-closed",
          )
        ) {
          toast.success(t("encounter_marked_as_complete"));
          return;
        }
        if (
          results.results.some(
            (result) => result.reference_id === "appointment-closed",
          )
        ) {
          toast.success(t("appointment_closed_successfully"));
        }
      },
    });

  const endEncounter = (
    encounter: EncounterRead,
    completeEncounter: boolean,
  ) => {
    const appointment = encounter?.appointment;
    const requests: BatchRequestBody<
      AppointmentUpdateRequest | TokenUpdate | EncounterEdit
    >["requests"] = [];

    if (completeEncounter) {
      requests.push({
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
      });
    }

    // Close appointment if it exists and is not already in a final status
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

    // Close token if it exists and is still active
    if (
      appointment?.token &&
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

    batchRequest({ requests, encounter });
  };

  return {
    endEncounter,
    isPending: isBatchRequestPending,
  };
}
