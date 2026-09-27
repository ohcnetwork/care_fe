import { resourceTypeToResourcePathSlug } from "@/components/Schedule/useScheduleResource";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import useBreakpoints from "@/hooks/useBreakpoints";
import { cn } from "@/lib/utils";
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
  CalendarX2,
  CheckCircle,
  ListOrdered,
  Play,
  ScanLine,
} from "lucide-react";
import { Link, navigate } from "raviger";
import { ReactNode, useState } from "react";
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
  compact = false,
}: {
  facilityId: string;
  appointment: AppointmentRead;
  compact?: boolean;
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
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setScanDialogOpen(true)}
        disabled={isPending}
        aria-label={t("scan_qr")}
        className={cn(
          "h-8 shrink-0 gap-1.5 px-2 text-sm font-medium text-gray-700",
          compact && "size-9 p-0",
        )}
      >
        <ScanLine className="size-4" aria-hidden="true" />
        {!compact && t("scan")}
      </Button>
      <PatientIDScanDialog
        open={scanDialogOpen}
        onOpenChange={setScanDialogOpen}
        onScanSuccess={handleScanSuccess}
      />
    </>
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
  const { t } = useTranslation();
  const isCompact = useBreakpoints({ default: true, md: false });
  const queryClient = useQueryClient();

  const { completeEverything, completeAppointment, isPending } =
    useEncounterProgressController({
      encounter,
    });

  const { mutate: startEncounter, isPending: isStarting } = useMutation({
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

  const appointmentActions = (
    <TokenActions
      patientId={encounter.patient.id}
      facilityId={encounter.facility.id}
      appointment={appointment}
      resourceType={appointment.resource_type}
      resourceId={appointment.resource.id}
      asMenuItems={isCompact}
    />
  );
  const encounterActions = canWritePrimaryEncounter && (
    <AppointmentEncounterHeaderActions
      encounter={encounter}
      onStart={handleStartEncounter}
      onComplete={completeEverything}
      onCloseAppointment={completeAppointment}
      isPending={isPending || isStarting}
      asMenuItems={isCompact}
    />
  );

  return (
    <div className="flex min-w-0 flex-1 items-center justify-end gap-1 md:flex-wrap md:gap-x-3 md:gap-y-1 md:py-1">
      <div
        role="group"
        aria-label={t("appointment")}
        className="flex min-w-0 items-center justify-end gap-0.5 md:flex-wrap"
      >
        <PatientScanButton
          facilityId={encounter.facility.id}
          appointment={appointment}
          compact={isCompact}
        />
        {!isCompact && appointmentActions}
      </div>
      {isCompact ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 shrink-0"
              aria-label={t("more_actions")}
            >
              <DotsVerticalIcon aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            collisionPadding={8}
            aria-label={t("encounter_actions")}
            className="w-72 max-w-[calc(100vw-2rem)] p-1"
          >
            <DropdownMenuGroup aria-label={t("appointment")}>
              <DropdownMenuLabel className="px-3 text-xs font-medium text-gray-500">
                {t("appointment")}
              </DropdownMenuLabel>
              {appointmentActions}
            </DropdownMenuGroup>
            {canWritePrimaryEncounter && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup aria-label={t("encounter_actions")}>
                  <DropdownMenuLabel className="px-3 text-xs font-medium text-gray-500">
                    {t("encounter")}
                  </DropdownMenuLabel>
                  {encounterActions}
                </DropdownMenuGroup>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        encounterActions
      )}
    </div>
  );
};

const AppointmentEncounterHeaderActions = ({
  encounter,
  onStart,
  onComplete,
  onCloseAppointment,
  isPending,
  asMenuItems = false,
}: {
  encounter: EncounterRead;
  onStart: () => void;
  onComplete: () => void;
  onCloseAppointment: () => void;
  isPending: boolean;
  asMenuItems?: boolean;
}) => {
  const { t } = useTranslation();
  const requiresDischarge = encounterRequiresDischarge(encounter);
  const canStart =
    encounter.status === EncounterStatus.PLANNED ||
    encounter.status === EncounterStatus.ON_HOLD;

  if (asMenuItems) {
    return canStart ? (
      <DropdownMenuItem
        className="min-h-11 gap-2 px-3 py-2"
        onSelect={onStart}
        disabled={isPending}
      >
        <Play aria-hidden="true" />
        {t("start_encounter")}
      </DropdownMenuItem>
    ) : (
      <>
        <DropdownMenuItem
          className="min-h-11 items-start gap-2 px-3 py-2"
          onSelect={onComplete}
          disabled={isPending}
          aria-label={
            requiresDischarge ? t("mark_for_discharge") : t("complete")
          }
        >
          <CheckCircle className="mt-0.5" aria-hidden="true" />
          <div className="min-w-0">
            <div className="font-medium">
              {requiresDischarge ? t("mark_for_discharge") : t("complete")}
            </div>
            <div className="text-xs text-gray-500">
              {requiresDischarge
                ? t("mark_for_discharge_description")
                : t("mark_as_complete_description")}
            </div>
          </div>
        </DropdownMenuItem>
        {encounter.status !== EncounterStatus.COMPLETED &&
          encounter.appointment?.status !== AppointmentStatus.FULFILLED && (
            <DropdownMenuItem
              className="min-h-11 items-start gap-2 px-3 py-2"
              onSelect={onCloseAppointment}
              disabled={isPending}
              aria-label={t("close_appointment")}
            >
              <CalendarX2 className="mt-0.5" aria-hidden="true" />
              <div className="min-w-0">
                <div className="font-medium">{t("close_appointment")}</div>
                <div className="text-xs text-gray-500">
                  {t("close_appointment_description")}
                </div>
              </div>
            </DropdownMenuItem>
          )}
      </>
    );
  }

  if (canStart) {
    return (
      <div
        role="group"
        aria-label={t("encounter_actions")}
        className="flex min-w-0 flex-wrap items-center gap-1"
      >
        <Button
          type="button"
          variant="outline"
          className="h-auto min-h-8 max-w-full whitespace-normal border-gray-300 px-3 py-1.5 text-sm shadow-none"
          onClick={onStart}
          disabled={isPending}
        >
          {t("start_encounter")}
        </Button>
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label={t("encounter_actions")}
      className="flex min-w-0 flex-wrap items-center gap-1"
    >
      <Button
        type="button"
        variant="outline"
        className="h-auto min-h-8 max-w-full gap-1.5 whitespace-normal border-gray-300 px-3 py-1.5 text-sm shadow-none"
        disabled={isPending}
        onClick={onComplete}
      >
        <CheckCircle aria-hidden="true" />
        {requiresDischarge ? t("mark_for_discharge") : t("complete")}
      </Button>
      {encounter.status !== EncounterStatus.COMPLETED && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              aria-label={t("more_actions")}
            >
              <DotsVerticalIcon className="text-gray-700" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-w-[calc(100vw-2rem)]" align="end">
            {encounter.appointment?.status !== AppointmentStatus.FULFILLED && (
              <DropdownMenuItem
                className="p-2.5"
                onClick={onCloseAppointment}
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
              onClick={onComplete}
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
  asMenuItems = false,
}: {
  patientId: string;
  facilityId: string;
  appointment?: AppointmentRead;
  resourceType: SchedulableResourceType;
  resourceId: string;
  asMenuItems?: boolean;
}) => {
  const { t } = useTranslation();

  if (!appointment?.id && !appointment?.token) {
    return null;
  }

  const { token } = appointment;

  return (
    <>
      {appointment.id && (
        <TokenAction asMenuItem={asMenuItems}>
          <Link href={getQueueLink(appointment)} basePath="/">
            <CalendarRange className="size-4" aria-hidden="true" />
            {asMenuItems ? t("appointments") : t("list")}
          </Link>
        </TokenAction>
      )}
      {appointment.id && (
        <TokenAction asMenuItem={asMenuItems}>
          <Link
            basePath="/"
            href={`/facility/${facilityId}/patient/${patientId}/appointments/${appointment.id}`}
          >
            {asMenuItems ? (
              <>
                <CalendarCheck className="size-4" aria-hidden="true" />
                {t("view_appointment")}
                {token && (
                  <span className="ml-auto text-xs text-gray-500">
                    {renderTokenNumber(token)}
                  </span>
                )}
              </>
            ) : token ? (
              <>
                <span className="shrink-0 text-gray-500">{t("token")}:</span>
                <span
                  className="truncate font-semibold text-gray-950"
                  title={renderTokenNumber(token)}
                >
                  {renderTokenNumber(token)}
                </span>
              </>
            ) : (
              <>
                <CalendarCheck className="size-4" aria-hidden="true" />
                {t("view")}
              </>
            )}
          </Link>
        </TokenAction>
      )}
      {token && (
        <TokenAction asMenuItem={asMenuItems}>
          <Link
            basePath="/"
            href={`/facility/${facilityId}/${resourceTypeToResourcePathSlug[resourceType]}/${resourceId}/queues/${token.queue.id}`}
          >
            <ListOrdered className="size-4" aria-hidden="true" />
            {t("queue")}
          </Link>
        </TokenAction>
      )}
    </>
  );
};

function TokenAction({
  asMenuItem,
  children,
}: {
  asMenuItem: boolean;
  children: ReactNode;
}) {
  return asMenuItem ? (
    <DropdownMenuItem asChild className="min-h-11 gap-2 px-3 py-2">
      {children}
    </DropdownMenuItem>
  ) : (
    <Button
      variant="ghost"
      asChild
      className="h-8 max-w-full shrink-0 gap-1.5 px-2 text-sm font-medium text-gray-700"
    >
      {children}
    </Button>
  );
}
