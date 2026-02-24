import { resourceTypeToResourcePathSlug } from "@/components/Schedule/useScheduleResource";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import {
  EncounterRead,
  EncounterStatus,
  inactiveEncounterStatus,
} from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";
import {
  AppointmentRead,
  AppointmentStatus,
  SchedulableResourceType,
} from "@/types/scheduling/schedule";

import { renderTokenNumber } from "@/types/tokens/token/token";
import mutate from "@/Utils/request/mutate";
import { dateQueryString } from "@/Utils/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck,
  CalendarRange,
  ChevronDown,
  ExternalLinkIcon,
  ListOrdered,
} from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

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

const getOptions = (encounter: EncounterRead) => {
  const options: ("close_appointment" | "mark_as_complete")[] = [];

  if (
    encounter.status === EncounterStatus.PLANNED ||
    encounter.status === EncounterStatus.ON_HOLD
  ) {
    return ["start_encounter"];
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
      <TokenActions
        patientId={encounter.patient.id}
        facilityId={encounter.facility.id}
        appointment={appointment}
        resourceType={appointment.resource_type}
        resourceId={appointment.resource.id}
      />
      {canWritePrimaryEncounter && (
        <div className="flex sm:flex-row flex-col gap-2 sm:items-center items-start">
          <AppointmentEncounterHeaderActions
            encounter={encounter}
            appointment={appointment}
          />
        </div>
      )}
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

  const { actions, isEndEncounterPending } = useEncounter();

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
              ? actions.markAsCompleted
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
            className="w-full sm:w-auto"
            disabled={isEndEncounterPending}
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
                  actions.markAsCompleted();
                } else if (option === "close_appointment") {
                  actions.endEncounter(encounter, false);
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
    <div className="flex divide-x gap-2">
      {appointment.id && (
        <div className="flex items-center justify-center border-gray-300">
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
        <div className="flex items-center justify-center border-gray-300">
          <Button variant="ghost" className="rounded-r-none" asChild>
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
