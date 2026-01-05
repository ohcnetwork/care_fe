import { resourceTypeToResourcePathSlug } from "@/components/Schedule/useScheduleResource";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  BatchRequestBody,
  BatchRequestResponse,
} from "@/types/base/batch/batch";
import batchApi from "@/types/base/batch/batchApi";
import {
  EncounterEdit,
  EncounterRead,
  EncounterStatus,
  inactiveEncounterStatus,
} from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";
import {
  AppointmentRead,
  AppointmentStatus,
  AppointmentUpdateRequest,
  SchedulableResourceType,
} from "@/types/scheduling/schedule";
import scheduleApi from "@/types/scheduling/scheduleApi";

import {
  renderTokenNumber,
  TokenRead,
  TokenStatus,
  TokenUpdate,
} from "@/types/tokens/token/token";
import tokenApi from "@/types/tokens/token/tokenApi";
import mutate from "@/Utils/request/mutate";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ExternalLinkIcon } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const getOptions = (encounter: EncounterRead) => {
  const options: (
    | "mark_token_fulfilled"
    | "close_appointment"
    | "mark_as_complete"
  )[] = [];

  if (
    encounter.status === EncounterStatus.PLANNED ||
    encounter.status === EncounterStatus.ON_HOLD
  ) {
    return ["start_encounter"];
  }

  if (
    encounter.appointment?.token &&
    [TokenStatus.CREATED, TokenStatus.IN_PROGRESS].includes(
      encounter.appointment.token.status,
    )
  ) {
    options.push("mark_token_fulfilled");
  }

  if (encounter.appointment?.status !== AppointmentStatus.FULFILLED) {
    options.push("close_appointment");
  }

  if (!inactiveEncounterStatus.includes(encounter.status)) {
    options.push("mark_as_complete");
  }

  return options;
};

export const AppointmentEncounterHeader = ({
  appointment,
  encounter,
  canWritePrimaryEncounter,
}: {
  appointment: AppointmentRead;
  encounter: EncounterRead;
  canWritePrimaryEncounter: boolean;
}) => {
  return (
    <div className="flex gap-3 border border-gray-300 rounded-lg py-1.5 px-2 bg-white sm:w-fit w-full items-center justify-center shadow-sm">
      {appointment.token && (
        <TokenActions
          patientId={appointment.patient.id}
          facilityId={encounter.facility.id}
          appointmentId={appointment.id}
          token={appointment.token}
          resourceType={appointment.resource_type}
          resourceId={appointment.resource.id}
        />
      )}
      <div className="flex sm:flex-row flex-col gap-2 sm:items-center items-start">
        {canWritePrimaryEncounter && (
          <AppointmentEncounterHeaderActions
            encounter={encounter}
            appointment={appointment}
          />
        )}
      </div>
    </div>
  );
};

const AppointmentEncounterHeaderActions = ({
  encounter,
  appointment,
}: {
  encounter: EncounterRead;
  appointment: AppointmentRead;
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

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

  const { mutate: startEncounter } = useMutation({
    mutationFn: mutate(encounterApi.update, {
      pathParams: { id: encounter.id },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["encounter", encounter.id],
      });
    },
  });

  const handleCloseToken = () => {
    if (!appointment?.token) return;
    updateToken({
      note: appointment.token.note,
      sub_queue: appointment.token.sub_queue?.id || null,
      status: TokenStatus.FULFILLED,
    });
  };

  const handleCloseAppointment = () => {
    if (!encounter || !appointment) return;

    const requests: BatchRequestBody<
      AppointmentUpdateRequest | TokenUpdate
    >["requests"] = [
      {
        url: scheduleApi.appointments.update.path
          .replace("{facilityId}", encounter.facility.id)
          .replace("{id}", appointment.id),
        method: scheduleApi.appointments.update.method,
        reference_id: "appointment-closed",
        body: {
          status: AppointmentStatus.FULFILLED,
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
          note: appointment.token.note,
          status: TokenStatus.FULFILLED,
          sub_queue: appointment.token.sub_queue?.id || null,
        },
      });
    }

    batchRequest({ requests });
  };
  const handleCompleteEncounter = () => {
    if (!encounter || !appointment) return;
    const requests: BatchRequestBody<
      AppointmentUpdateRequest | TokenUpdate | EncounterEdit
    >["requests"] = [
      {
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
      },
      {
        url: scheduleApi.appointments.update.path
          .replace("{facilityId}", encounter.facility.id)
          .replace("{id}", appointment.id),
        method: scheduleApi.appointments.update.method,
        reference_id: "appointment-closed",
        body: {
          status: AppointmentStatus.FULFILLED,
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
          note: appointment.token.note,
          sub_queue: appointment.token.sub_queue?.id || null,
          status: TokenStatus.FULFILLED,
        },
      });
    }

    batchRequest({ requests });
  };
  const handleStartEncounter = () => {
    startEncounter({
      ...encounter,
      status: EncounterStatus.IN_PROGRESS,
    });
  };

  const options = getOptions(encounter);

  if (options.length === 0) {
    return null;
  }

  if (options.length === 1) {
    const [option] = options;
    return (
      <div
        className={cn(
          "w-full sm:w-auto space-x-2",
          appointment.token && "border-l border-gray-300 pl-2",
        )}
      >
        <span className="text-sm text-black">
          {option === "mark_as_complete"
            ? t("do_you_want_to_complete_this_encounter")
            : t("do_you_want_to_start_this_encounter")}
        </span>
        <Button
          variant="outline"
          className="w-full sm:w-auto text-sm font-semibold text-black"
          onClick={
            option === "mark_as_complete"
              ? handleCompleteEncounter
              : handleStartEncounter
          }
        >
          {option === "mark_as_complete"
            ? t("complete_encounter")
            : t("start_encounter")}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full sm:w-auto space-x-2",
        appointment.token && "border-l border-gray-300 pl-2",
      )}
    >
      <span className="text-sm text-black">
        {t("how_do_you_to_finish_this_visit")}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={isBatchRequestPending || isUpdateTokenPending}
            className="w-full sm:w-auto"
          >
            <span className="text-sm font-semibold text-black">
              {t("end_actions")}
            </span>
            <ChevronDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-[59px]" align="start">
          {options.map((option) => (
            <DropdownMenuItem
              key={option}
              className="p-2.5"
              onClick={() => {
                if (option === "mark_as_complete") {
                  handleCompleteEncounter();
                } else if (option === "close_appointment") {
                  handleCloseAppointment();
                } else if (option === "mark_token_fulfilled") {
                  handleCloseToken();
                }
              }}
            >
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-black">
                  {t(option)}
                </span>
                <p className="text-xs text-gray-700">
                  {t(`${option}_description`)}
                </p>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

const TokenActions = ({
  patientId,
  facilityId,
  appointmentId,
  token,
  resourceType,
  resourceId,
}: {
  patientId: string;
  facilityId: string;
  appointmentId: string;
  token: TokenRead;
  resourceType: SchedulableResourceType;
  resourceId: string;
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex gap-2">
      <div className="flex items-center justify-center border-r border-gray-300">
        <Button variant="ghost" className="rounded-r-none pl-2 " asChild>
          <Link
            href={`/facility/${facilityId}/patient/${patientId}/appointments/${appointmentId}`}
          >
            <div className="flex sm:flex-row flex-col items-center justify-center sm:gap-1">
              <span className="text-sm text-gray-600">{t("token")}:</span>
              <div className="flex whitespace-nowrap gap-1 items-center">
                <span className="text-sm text-black font-semibold underline ">
                  {renderTokenNumber(token)}
                </span>
                <ExternalLinkIcon className="size-4 text-black" />
              </div>
            </div>
          </Link>
        </Button>
      </div>
      <div className="flex items-center justify-center">
        <Button variant="link" className="underline ">
          <Link
            basePath="/"
            className="flex items-center gap-1"
            href={`/facility/${facilityId}/${resourceTypeToResourcePathSlug[resourceType]}/${resourceId}/queues/${token.queue.id}`}
          >
            {t("queue")}
            <ExternalLinkIcon className="size-4 text-black" />
          </Link>
        </Button>
      </div>
    </div>
  );
};
