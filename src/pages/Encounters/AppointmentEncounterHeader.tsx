import { Button } from "@/components/ui/button";
import {
  SelectActionButton,
  SelectActionOption,
} from "@/components/ui/selectActionButton";
import { BatchRequestResponse } from "@/types/base/batch/batch";
import batchApi from "@/types/base/batch/batchApi";
import { EncounterRead } from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";
import { AppointmentRead } from "@/types/scheduling/schedule";
import scheduleApi from "@/types/scheduling/scheduleApi";
import { renderTokenNumber, TokenStatus } from "@/types/tokens/token/token";
import tokenApi from "@/types/tokens/token/tokenApi";
import mutate from "@/Utils/request/mutate";
import { NonEmptyArray } from "@/Utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TFunction } from "i18next";
import { ExternalLinkIcon, PlayIcon } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export const AppointmentEncounterHeader = ({
  appointment,
  encounter,
}: {
  appointment: AppointmentRead;
  encounter: EncounterRead;
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { mutate: startEncounter, isPending } = useMutation({
    mutationFn: mutate(encounterApi.update, {
      pathParams: { id: encounter.id },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["encounter", encounter.id],
      });
    },
  });

  const { mutate: updateToken, isPending: isUpdateTokenPending } = useMutation({
    mutationFn: mutate(tokenApi.update, {
      pathParams: {
        facility_id: encounter.facility.id || "",
        queue_id: appointment?.token?.queue.id || "",
        id: appointment?.token?.id || "",
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["encounter", encounter.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["tokens", appointment?.token?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["appointments", appointment?.id],
      });
      toast.success(t("token_closed_successfully"));
    },
  });

  const { mutate: batchRequest, isPending: isBatchRequestPending } =
    useMutation({
      mutationFn: mutate(batchApi.batchRequest),
      onSuccess: (results: BatchRequestResponse) => {
        queryClient.invalidateQueries({
          queryKey: ["encounter", encounter.id],
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

  const handleStartEncounter = () => {
    startEncounter({
      ...encounter,
      status: "in_progress",
      patient: encounter.patient.id,
      facility: encounter.facility.id,
    });
  };

  const handleCloseToken = () => {
    if (!appointment?.token) return;
    updateToken({
      note: appointment.token.note,
      sub_queue: appointment.token.sub_queue?.id || undefined,
      status: TokenStatus.FULFILLED,
    });
  };

  const handleCloseAppointment = () => {
    if (!encounter || !appointment) return;

    const requests = [
      {
        url: scheduleApi.appointments.update.path
          .replace("{facilityId}", encounter.facility.id)
          .replace("{id}", appointment.id),
        method: scheduleApi.appointments.update.method,
        reference_id: "appointment-closed",
        body: {
          status: "fulfilled",
          note: appointment.note,
        },
      },
    ];

    if (appointment.token) {
      requests.push({
        url: tokenApi.update.path
          .replace("{facility_id}", encounter.facility.id)
          .replace("{queue_id}", appointment.token.queue.id)
          .replace("{id}", appointment.token.id),
        method: tokenApi.update.method,
        reference_id: "token-closed",
        body: {
          ...appointment.token,
          status: "FULFILLED",
        },
      });
    }

    batchRequest({ requests });
  };
  const handleCompleteEncounter = () => {
    if (!encounter || !appointment) return;
    const requests = [
      {
        url: encounterApi.update.path.replace("{id}", encounter.id),
        method: encounterApi.update.method,
        reference_id: "encounter-closed",
        body: {
          ...encounter,
          patient: encounter.patient.id,
          facility: encounter.facility.id,
          status: "completed",
        },
      },
      {
        url: scheduleApi.appointments.update.path
          .replace("{facilityId}", encounter.facility.id)
          .replace("{id}", appointment.id),
        method: scheduleApi.appointments.update.method,
        reference_id: "appointment-closed",
        body: {
          status: "fulfilled",
          note: appointment.note,
        },
      },
    ];

    if (appointment.token) {
      requests.push({
        url: tokenApi.update.path
          .replace("{facility_id}", encounter.facility.id)
          .replace("{queue_id}", appointment.token.queue.id)
          .replace("{id}", appointment.token.id),
        method: tokenApi.update.method,
        reference_id: "token-closed",
        body: {
          ...appointment.token,
          status: "FULFILLED",
        },
      });
    }

    batchRequest({ requests });
  };

  return (
    <div className="flex justify-center gap-4 border border-gray-200 rounded-md p-2 bg-white w-full items-center mb-2">
      {encounter.appointment?.token && (
        <Button asChild variant="outline">
          <Link
            href={`/facility/${encounter.facility.id}/patient/${encounter.patient.id}/appointments/${encounter.appointment.id}`}
          >
            <span className="flex items-center gap-3">
              <span className="font-mono font-semibold">
                {renderTokenNumber(encounter.appointment.token)}
              </span>
              <ExternalLinkIcon className="size-4" />
            </span>
          </Link>
        </Button>
      )}

      {encounter.status !== "in_progress" &&
      encounter.status !== "completed" ? (
        <Button
          variant="outline"
          onClick={() => handleStartEncounter()}
          disabled={isPending}
        >
          <PlayIcon size={12} />
          {t("start_encounter")}
        </Button>
      ) : (
        <SelectActionButton
          options={getOptions(encounter, t)}
          onAction={(value) => {
            if (value === "mark_as_complete") {
              handleCompleteEncounter();
            } else if (value === "close_appointment") {
              handleCloseAppointment();
            } else if (value === "close_token") {
              handleCloseToken();
            }
          }}
          disabled={
            encounter.status === "completed" ||
            isBatchRequestPending ||
            isUpdateTokenPending
          }
          persistKey="encounter-complete-action"
          variant="outline"
        />
      )}
    </div>
  );
};

const getOptions = (encounter: EncounterRead, t: TFunction) => {
  const options: NonEmptyArray<SelectActionOption<string>> = [
    {
      value: "mark_as_complete",
      child: (
        <div className="flex flex-col items-start">
          <span className="text-sm">{t("mark_as_complete")}</span>
          <p className="text-xs text-gray-500">
            {t("mark_as_complete_description")}
          </p>
        </div>
      ),
    },
  ];

  if (
    encounter.appointment?.token &&
    [TokenStatus.CREATED, TokenStatus.IN_PROGRESS].includes(
      encounter.appointment.token.status,
    )
  ) {
    options.push({
      ...options,
      value: "close_token",
      child: (
        <div className="flex flex-col items-start">
          <span className="text-sm">{t("close_token")}</span>
          <p className="text-xs text-gray-500">
            {t("close_token_description")}
          </p>
        </div>
      ),
    });
  }
  if (encounter.appointment?.status !== "fulfilled") {
    options.push({
      ...options,
      value: "close_appointment",
      child: (
        <div className="flex flex-col items-start">
          <span className="text-sm">{t("close_appointment")}</span>
          <p className="text-xs text-gray-500">
            {t("close_appointment_description")}
          </p>
        </div>
      ),
    });
  }
  return options;
};
