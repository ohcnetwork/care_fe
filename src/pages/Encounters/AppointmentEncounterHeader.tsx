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

import { PatientIDScanDialog } from "@/components/Scan/PatientIDScanDialog";
import {
  encounterRequiresDischarge,
  useEncounterProgressController,
} from "@/pages/Encounters/utils/useEncounterProgressController";
import patientApi from "@/types/emr/patient/patientApi";
import scheduleApi from "@/types/scheduling/scheduleApi";
import { renderTokenNumber } from "@/types/tokens/token/token";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { dateQueryString } from "@/Utils/utils";
import { DotsVerticalIcon } from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  CalendarCheck,
  CalendarRange,
  CheckCircle,
  ExternalLinkIcon,
  ListOrdered,
  ScanLine,
} from "lucide-react";
import { Link, navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

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

const PatientScanButton = ({
  facilityId,
  appointment,
}: {
  facilityId: string;
  appointment: AppointmentRead;
}) => {
  const { t } = useTranslation();
  const [scanDialogOpen, setScanDialogOpen] = useState(false);

  const { mutate: checkPatientAppointments, isPending } = useMutation({
    mutationFn: async (patientId: string) => {
      const today = dateQueryString(new Date());
      const controller = new AbortController();

      const [appointments, patient] = await Promise.all([
        query(scheduleApi.appointments.list, {
          pathParams: { facilityId },
          queryParams: {
            status: [
              AppointmentStatus.BOOKED,
              AppointmentStatus.CHECKED_IN,
              AppointmentStatus.IN_CONSULTATION,
            ].join(","),
            resource_type: appointment.resource_type,
            resource_ids: appointment.resource.id,
            date_after: today,
            date_before: today,
            patient: patientId,
          },
        })({ signal: controller.signal }),
        query(patientApi.get, {
          silent: true,
          pathParams: { id: patientId },
        })({ signal: controller.signal }),
      ]);

      return { appointments, patient, patientId };
    },
    onSuccess: ({ appointments, patient, patientId }) => {
      if (appointments.results?.length) {
        navigate(
          `/facility/${facilityId}/patient/${patientId}/appointments/${appointments.results[0].id}`,
        );
      } else {
        toast.info(t("no_appointments_found_for_today"));
        navigate(
          `/facility/${facilityId}/patients/home?${new URLSearchParams({
            phone_number: patient.phone_number,
            year_of_birth: patient.year_of_birth?.toString() ?? "",
            partial_id: patientId.slice(0, 5),
          }).toString()}`,
        );
      }
    },
    onError: () => {
      toast.error(t("failed_to_check_appointments"));
    },
  });

  const handleScanSuccess = (patientId: string) => {
    checkPatientAppointments(patientId);
  };

  return (
    <div className="flex-1 flex items-center justify-center">
      <Button
        variant="ghost"
        onClick={() => setScanDialogOpen(true)}
        disabled={isPending}
        aria-label={t("scan_qr")}
        className="flex-col gap-0 size-auto sm:flex-row sm:gap-2"
      >
        <ScanLine className="size-4 text-black" />
        <span className="text-sm text-black">{t("scan")}</span>
      </Button>
      <PatientIDScanDialog
        open={scanDialogOpen}
        onOpenChange={setScanDialogOpen}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
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
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 border border-gray-300 rounded-lg py-1.5 px-2 bg-white sm:w-fit w-full sm:items-center items-stretch justify-center shadow-sm">
      <div className="flex divide-x-2 items-stretch justify-evenly overflow-auto">
        <PatientScanButton
          facilityId={encounter.facility.id}
          appointment={appointment}
        />
        <TokenActions
          patientId={encounter.patient.id}
          facilityId={encounter.facility.id}
          appointment={appointment}
          resourceType={appointment.resource_type}
          resourceId={appointment.resource.id}
        />
      </div>
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
  const requiresDischarge = encounterRequiresDischarge(encounter);

  const { completeEverything, completeAppointment, isPending } =
    useEncounterProgressController({
      encounter,
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
          "w-full sm:w-auto space-x-2 text-center",
          appointment.token && "sm:border-l-2 sm:pl-2",
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
        "w-full sm:w-auto space-x-2 flex items-center",
        appointment.token && "sm:border-l-2 sm:pl-2",
      )}
    >
      <span className="text-sm text-black">
        {encounter.appointment?.status !== AppointmentStatus.FULFILLED && (
          <span className="text-sm text-black">
            {t("how_do_you_to_finish_this_visit")}
          </span>
        )}
      </span>
      <Button
        variant="outline"
        className="w-full sm:w-auto"
        disabled={isPending}
        onClick={completeEverything}
      >
        <CheckCircle />
        {requiresDischarge ? t("mark_for_discharge") : t("complete")}
      </Button>
      {encounter.status !== EncounterStatus.COMPLETED && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">
              <DotsVerticalIcon className="text-gray-700" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[59px]" align="end">
            {encounter.appointment?.status !== AppointmentStatus.FULFILLED && (
              <DropdownMenuItem
                className="p-2.5"
                onClick={() => completeAppointment()}
                disabled={isPending}
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
            )}
            <DropdownMenuItem
              className="p-2.5"
              onClick={() => completeEverything()}
              disabled={isPending}
            >
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-black">
                  {requiresDischarge
                    ? t("mark_for_discharge")
                    : t("mark_as_complete")}
                </span>
                <p className="text-xs text-gray-700">
                  {requiresDischarge
                    ? t("mark_for_discharge_description")
                    : t("mark_as_complete_description")}
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
    <>
      {appointment.id && (
        <div className="flex-1 flex items-center justify-center">
          <Button
            variant="ghost"
            asChild
            className="flex-col gap-0 size-auto sm:flex-row sm:gap-2"
          >
            <Link href={getQueueLink(appointment)}>
              <CalendarRange className="size-4 text-black" />
              <span className="text-sm text-black underline">{t("list")}</span>
              <ExternalLinkIcon className="size-4 text-black hidden sm:block" />
            </Link>
          </Button>
        </div>
      )}
      {appointment.id && (
        <div className="flex-1 flex items-center justify-center">
          <Button
            variant="ghost"
            asChild
            className="flex-col gap-0 size-auto sm:flex-row sm:gap-2"
          >
            <Link
              href={`/facility/${facilityId}/patient/${patientId}/appointments/${appointment.id}`}
            >
              <>
                {token ? (
                  <>
                    <span className="text-xs sm:text-sm text-gray-600">
                      {t("token")}:
                    </span>
                    <div className="flex whitespace-nowrap gap-1 items-center">
                      <span className="text-sm text-black font-semibold underline">
                        {renderTokenNumber(token)}
                      </span>
                      <ExternalLinkIcon className="size-4 text-black hidden sm:block" />
                    </div>
                  </>
                ) : (
                  <>
                    <CalendarCheck className="size-4 text-black" />
                    <span className="text-black underline">{t("view")}</span>
                    <ExternalLinkIcon className="size-4 text-black hidden sm:block" />
                  </>
                )}
              </>
            </Link>
          </Button>
        </div>
      )}
      {token && (
        <div className="flex-1 flex items-center justify-center">
          <Button
            variant="ghost"
            className="flex-col gap-0 size-auto sm:flex-row sm:gap-2"
            asChild
          >
            <Link
              basePath="/"
              href={`/facility/${facilityId}/${resourceTypeToResourcePathSlug[resourceType]}/${resourceId}/queues/${token.queue.id}`}
            >
              <ListOrdered className="size-4 text-black" />
              <span className="text-sm text-black underline">{t("queue")}</span>
              <ExternalLinkIcon className="size-4 text-black hidden sm:block" />
            </Link>
          </Button>
        </div>
      )}
    </>
  );
};
