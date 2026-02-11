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
  EncounterRead,
  EncounterStatus,
} from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";
import {
  AppointmentRead,
  AppointmentStatus,
  SchedulableResourceType,
} from "@/types/scheduling/schedule";

import { useEncounterProgressController } from "@/pages/Encounters/utils/useEncounterProgressController";
import { renderTokenNumber } from "@/types/tokens/token/token";
import mutate from "@/Utils/request/mutate";
import { DotsVerticalIcon } from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, ExternalLinkIcon } from "lucide-react";
import { Link, navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { dateQueryString } from "@/Utils/utils";
import { CalendarCheck, CalendarRange, ListOrdered } from "lucide-react";

/**
 * Get the appointments page link for an appointment based on resource type.
 * - Practitioner: /facility/{facilityId}/appointments?practitioners={resourceId}&date_from={date}&date_to={date}
 * - Location: /facility/{facilityId}/locations/{resourceId}/appointments?date_from={date}&date_to={date}
 * - HealthcareService: /facility/{facilityId}/services/{resourceId}/appointments?date_from={date}&date_to={date}
 */
const getQueueLink = (appointment: AppointmentRead): string => {
  const facilityId = appointment.facility.id;
  const resourceId = appointment.resource.id;
  const date = dateQueryString(new Date(appointment.token_slot.start_datetime));
  const dateParams = `date_from=${date}&date_to=${date}`;

  switch (appointment.resource_type) {
    case SchedulableResourceType.Practitioner:
      return `/facility/${facilityId}/appointments?practitioners=${resourceId}&${dateParams}`;
    case SchedulableResourceType.Location:
      return `/facility/${facilityId}/locations/${resourceId}/appointments?${dateParams}`;
    case SchedulableResourceType.HealthcareService:
      return `/facility/${facilityId}/services/${resourceId}/appointments?${dateParams}`;
  }
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
      <TokenActions
        patientId={encounter.patient.id}
        facilityId={encounter.facility.id}
        appointment={appointment}
        resourceType={appointment.resource_type}
        resourceId={appointment.resource.id}
      />
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

  const {
    completeEverything,
    completeAppointment,
    isPending: isEndEncounterPending,
  } = useEncounterProgressController();

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

  const handleStartEncounter = () => {
    startEncounter({
      ...encounter,
      status: EncounterStatus.IN_PROGRESS,
    });
  };

  if (
    encounter.status === EncounterStatus.PLANNED ||
    encounter.status === EncounterStatus.ON_HOLD
  ) {
    return (
      <div
        className={cn(
          "w-full sm:w-auto space-x-2",
          appointment.token && "border-l border-gray-300 pl-2",
        )}
      >
        <span className="text-sm text-black">
          {t("do_you_want_to_start_this_encounter")}
        </span>
        <Button
          variant="outline"
          className="w-full sm:w-auto text-sm font-semibold text-black"
          onClick={handleStartEncounter}
        >
          {t("start_encounter")}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center w-full sm:w-auto space-x-2",
        appointment.token && "border-l border-gray-300 pl-2",
      )}
    >
      <span className="text-sm text-black pr-2">
        {t("how_do_you_to_finish_this_visit")}
      </span>
      <Button
        variant="outline"
        className="w-full sm:w-auto"
        disabled={isEndEncounterPending}
        onClick={() =>
          completeEverything({
            encounter,
            onDischargeRequired: () => {
              navigate(
                `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/questionnaire/encounter?toDischarge=true`,
              );
            },
          })
        }
      >
        <CheckCircle />
        {t("complete")}
      </Button>
      {encounter.appointment?.status !== AppointmentStatus.FULFILLED && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">
              <DotsVerticalIcon className="text-gray-700" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[59px]" align="end">
            <DropdownMenuItem
              className="p-2.5"
              onClick={() => completeAppointment({ encounter })}
            >
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-black">
                  {t("close_appointment")}
                </span>
                <p className="text-xs text-gray-700">
                  {t("close_appointment_description")}
                </p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

const TokenActions = ({
  patientId,
  facilityId,
  appointment,
  resourceType,
  resourceId,
}: {
  patientId: string;
  facilityId: string;
  appointment?: AppointmentRead;
  resourceType: SchedulableResourceType;
  resourceId: string;
}) => {
  const { t } = useTranslation();

  if (!appointment?.id && !appointment?.token) {
    return null;
  }

  const { token } = appointment;

  return (
    <div className="flex gap-2">
      {appointment.id && (
        <div className="flex items-center justify-center border-r border-gray-300">
          <Button variant="ghost" className="rounded-r-none pl-2 " asChild>
            <Link href={getQueueLink(appointment)}>
              <div className="flex sm:flex-row flex-col items-center justify-center sm:gap-1">
                <div className="flex gap-2 items-center underline">
                  <CalendarRange className="size-4 text-black" />
                  {t("list")}
                  <ExternalLinkIcon className="size-4 text-black" />
                </div>
              </div>
            </Link>
          </Button>
        </div>
      )}
      {appointment.id && (
        <div className="flex items-center justify-center border-r border-gray-300">
          <Button variant="ghost" className="rounded-r-none pl-2 " asChild>
            <Link
              href={`/facility/${facilityId}/patient/${patientId}/appointments/${appointment.id}`}
            >
              <div className="flex sm:flex-row flex-col items-center justify-center sm:gap-1">
                {token ? (
                  <>
                    <span className="text-sm text-gray-600">{t("token")}:</span>
                    <div className="flex whitespace-nowrap gap-1 items-center">
                      <span className="text-sm text-black font-semibold underline ">
                        {renderTokenNumber(token)}
                      </span>
                      <ExternalLinkIcon className="size-4 text-black" />
                    </div>
                  </>
                ) : (
                  <div className="flex gap-2 items-center underline">
                    <CalendarCheck className="size-4 text-black" />
                    {t("view")}
                    <ExternalLinkIcon className="size-4 text-black" />
                  </div>
                )}
              </div>
            </Link>
          </Button>
        </div>
      )}
      {token && (
        <div className="flex items-center justify-center">
          <Button variant="link" className="underline ">
            <Link
              basePath="/"
              className="flex items-center gap-1"
              href={`/facility/${facilityId}/${resourceTypeToResourcePathSlug[resourceType]}/${resourceId}/queues/${token.queue.id}`}
            >
              <ListOrdered className="size-4 text-black" />
              {t("queue")}
              <ExternalLinkIcon className="size-4 text-black" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
};
