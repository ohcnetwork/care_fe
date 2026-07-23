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
import { BatchRequestObject, useBatchRequest } from "@/Utils/request/batch";
import { useQueryClient } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export const encounterRequiresDischarge = (encounter: EncounterRead) =>
  encounter.encounter_class === "imp" &&
  encounter.status !== EncounterStatus.DISCHARGED;

export function useEncounterProgressController({
  encounter,
}: {
  encounter: EncounterRead;
}) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { mutate: executeBatch, isPending } = useBatchRequest({
    onSuccess: ({ results }) => {
      if (results.some((r) => r.reference_id === "encounter-closed")) {
        queryClient.invalidateQueries({
          queryKey: ["encounter", encounter.id],
        });
        toast.success(t("encounter_marked_as_complete"));
      }

      if (results.some((r) => r.reference_id === "appointment-closed")) {
        queryClient.invalidateQueries({
          queryKey: ["encounter", encounter.id],
        });
        queryClient.invalidateQueries({ queryKey: ["appointment"] });
        queryClient.invalidateQueries({ queryKey: ["tokens"] });
        toast.success(t("appointment_closed_successfully"));
      }
    },
  });

  const addEncounterCloseRequestToBatch = () => {
    return {
      api: encounterApi.update,
      referenceId: "encounter-closed",
      pathParams: { id: encounter.id },
      body: {
        ...encounter,
        status: EncounterStatus.COMPLETED,
        period: {
          start: encounter.period.start,
          end: encounter.period.end || new Date().toISOString(),
        },
      },
    };
  };

  const addAppointmentCloseRequestsToBatch = () => {
    const appointment = encounter.appointment;

    if (
      appointment?.id &&
      !AppointmentFinalStatuses.includes(appointment.status)
    ) {
      return {
        api: scheduleApi.appointments.update,
        referenceId: "appointment-closed",
        pathParams: {
          facilityId: encounter.facility.id,
          id: appointment.id,
        },
        body: {
          status: AppointmentStatus.FULFILLED,
          note: appointment.note,
        },
      };
    }
  };

  const addTokenCloseRequestToBatch = () => {
    const appointment = encounter.appointment;
    if (
      appointment?.token?.id &&
      TokenActiveStatuses.includes(appointment.token.status)
    ) {
      return {
        api: tokenApi.update,
        referenceId: "token-closed",
        pathParams: {
          facility_id: encounter.facility.id,
          queue_id: appointment.token.queue.id,
          id: appointment.token.id,
        },
        body: {
          ...appointment.token,
          note: appointment.token.note,
          sub_queue: appointment.token.sub_queue?.id || null,
          status: TokenStatus.FULFILLED,
        },
      };
    }
  };

  const completeEverything = () => {
    if (encounterRequiresDischarge(encounter)) {
      navigate(
        `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/questionnaire/encounter?toDischarge=true`,
      );
      return;
    }
    let requests: BatchRequestObject[] = [];
    requests.push(addEncounterCloseRequestToBatch());
    const appointmentRequest = addAppointmentCloseRequestsToBatch();
    if (appointmentRequest) {
      requests.push(appointmentRequest);
    }
    const tokenRequest = addTokenCloseRequestToBatch();
    if (tokenRequest) {
      requests.push(tokenRequest);
    }
    executeBatch(requests);
  };

  const completeEncounter = () => {
    if (encounterRequiresDischarge(encounter)) {
      navigate(
        `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/questionnaire/encounter?toDischarge=true`,
      );
      return;
    }
    executeBatch([addEncounterCloseRequestToBatch()]);
  };

  const completeAppointment = () => {
    let requests: BatchRequestObject[] = [];
    const appointmentRequest = addAppointmentCloseRequestsToBatch();
    if (appointmentRequest) {
      requests.push(appointmentRequest);
    }
    const tokenRequest = addTokenCloseRequestToBatch();
    if (tokenRequest) {
      requests.push(tokenRequest);
    }
    executeBatch(requests);
  };

  return {
    completeEverything,
    completeAppointment,
    completeEncounter,
    isPending,
  };
}
