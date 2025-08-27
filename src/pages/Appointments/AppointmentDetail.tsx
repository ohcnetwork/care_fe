import {
  AvatarIcon,
  CalendarIcon,
  CheckCircledIcon,
  ClockIcon,
  DownloadIcon,
  DrawingPinIcon,
  EnterIcon,
  EyeNoneIcon,
  GearIcon,
  MobileIcon,
  PersonIcon,
  PlusCircledIcon,
} from "@radix-ui/react-icons";
import {
  onlineManager,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { addDays, differenceInYears, format, isBefore } from "date-fns";
import { BanIcon, EyeIcon, Loader2, PrinterIcon } from "lucide-react";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import {
  queueCancelAppointmentRecord,
  queueRescheduleOfflineRecord,
  queueUpdateAppointmentRecordOffline,
} from "@/components/Appointment/offlineQueue";
import { ClickableAddress } from "@/components/Common/ClickableAddress";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import CreateEncounterForm from "@/components/Encounter/CreateEncounterForm";
import TagAssignmentSheet from "@/components/Tags/TagAssignmentSheet";
import { AuthUserModel } from "@/components/Users/models";

import useAppHistory from "@/hooks/useAppHistory";
import useAuthUser from "@/hooks/useAuthUser";
import { useOfflineEntry } from "@/hooks/useOfflineEntry";

import { getPermissions } from "@/common/Permissions";

import { AppCacheDB, OfflineWritesEntry } from "@/OfflineSupport/AppcacheDB";
import {
  handleOfflineRecordSuccess,
  isOfflineId,
} from "@/OfflineSupport/offlineWriteHelpers";
import { PendingSyncBadge } from "@/OfflineSupport/pendingSyncbadge";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { HTTPError } from "@/Utils/request/types";
import {
  formatName,
  getReadableDuration,
  saveElementAsImage,
  stringifyNestedObject,
} from "@/Utils/utils";
import { usePermissions } from "@/context/PermissionContext";
import { AppointmentTokenCard } from "@/pages/Appointments/components/AppointmentTokenCard";
import { PractitionerSelector } from "@/pages/Appointments/components/PractitionerSelector";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import {
  ENCOUNTER_CLASSES_COLORS,
  ENCOUNTER_PRIORITY_COLORS,
  ENCOUNTER_STATUS_COLORS,
} from "@/types/emr/encounter/encounter";
import { getTagHierarchyDisplay } from "@/types/emr/tagConfig/tagConfig";
import { FacilityRead } from "@/types/facility/facility";
import {
  APPOINTMENT_STATUS_COLORS,
  Appointment,
  AppointmentCancelRequest,
  AppointmentFinalStatuses,
  AppointmentRead,
  AppointmentRescheduleRequest,
  AppointmentUpdateRequest,
  TokenSlot,
} from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApi";
import { UserReadMinimal } from "@/types/user/user";

import { AppointmentSlotPicker } from "./components/AppointmentSlotPicker";

interface Props {
  appointmentId: string;
}

export default function AppointmentDetail(props: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { facility, facilityId, isFacilityLoading } = useCurrentFacility();
  const { hasPermission } = usePermissions();
  const { goBack } = useAppHistory();
  const { offlineEntryId } = useOfflineEntry();

  const db = new AppCacheDB();
  const authUser = useAuthUser();

  const { canViewAppointments, canUpdateAppointment, canCreateAppointment } =
    getPermissions(hasPermission, facility?.permissions ?? []);

  const { data: appointment } = useQuery({
    queryKey: ["appointment", props.appointmentId],
    queryFn: query(scheduleApis.appointments.retrieve, {
      pathParams: {
        facilityId,
        id: props.appointmentId,
      },
    }),
    meta: { persist: true },
    networkMode: "online",

    enabled: canViewAppointments && !!facility,
  });

  const redirectToPatientPage = () => {
    navigate(`/facility/${facility?.id}/patients/verify`, {
      query: {
        phone_number: patient.phone_number,
        year_of_birth: patient.year_of_birth,
        partial_id: !isOfflineId(patient.id)
          ? patient.id.slice(0, 5)
          : patient.id,
      },
    });
  };

  const handleAppointmentUpdateOfflineQueue = async (
    appointmentRequestData: AppointmentUpdateRequest,
  ) => {
    if (!appointmentRequestData.status || !appointment) {
      return;
    }
    await queueUpdateAppointmentRecordOffline({
      updateAppointmentData: appointmentRequestData,
      appointment,
      authUser,
      status: appointmentRequestData.status,
      facilityId,
      queryClient,
      t,
      db,
      onSuccess: (_appointmentId, _normalizedAppointment) => {
        toast.success(t("appointment_updated_successfully"));
        if (appointmentRequestData.status === "in_consultation") {
          redirectToPatientPage();
        }
      },
      onError: (error) => {
        console.error("Failed to queue status update:", error);
        toast.error(t("unexpected_error_updating_appointment_status"));
      },
    });
  };

  useEffect(() => {
    // Don't redirect while facility is still loading
    if (isFacilityLoading) {
      return;
    }

    // If facility query failed (no access to facility)
    if (!facility) {
      toast.error(t("no_permission_to_view_page"));
      goBack(`/`);
      return;
    }

    // If facility is loaded but user doesn't have permission to view appointments
    if (facility && !canViewAppointments) {
      toast.error(t("no_permission_to_view_page"));
      goBack(`/facility/${facility.id}/overview`);
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFacilityLoading, facility, canViewAppointments, facilityId]);

  const { mutate: updateAppointment, isPending: isUpdating } = useMutation<
    Appointment,
    HTTPError,
    AppointmentUpdateRequest
  >({
    mutationFn: mutate(scheduleApis.appointments.update, {
      pathParams: { facilityId, id: props.appointmentId },
    }),
    networkMode: "always",

    onSuccess: async (data) => {
      if (offlineEntryId) {
        await handleOfflineRecordSuccess(offlineEntryId, data);
      }
      queryClient.invalidateQueries({
        queryKey: ["appointment", props.appointmentId],
      });
    },

    onError: async (error, variables) => {
      // If network error, mark offline and push to offline queue
      if (error.message === "Network Error" && variables) {
        onlineManager.setOnline(false);
        await handleAppointmentUpdateOfflineQueue(variables);
        return;
      }
    },
  });

  const handleUpdateAppointment = async (
    appointmentUpdateData: AppointmentUpdateRequest,
  ) => {
    if (!appointmentUpdateData.status || !appointment) {
      return;
    }

    if (!onlineManager.isOnline()) {
      await handleAppointmentUpdateOfflineQueue(appointmentUpdateData);
      return;
    }

    updateAppointment(appointmentUpdateData);
    return;
  };

  if (!facility || !appointment) {
    return <Loading />;
  }

  const { patient } = appointment;

  return (
    <Page title={t("appointment_details")}>
      <div className="container mx-auto p-6 max-w-7xl">
        <div
          className={cn(
            "flex flex-col md:flex-col lg:flex-row",
            isUpdating && "opacity-50 pointer-events-none animate-pulse",
          )}
        >
          <AppointmentDetails appointment={appointment} facility={facility} />
          <div className="mt-3">
            <div id="section-to-print" className="print:w-[400px] print:pt-4">
              <div id="appointment-token-card" className="bg-gray-50 md:p-4">
                <AppointmentTokenCard
                  appointment={appointment}
                  facility={facility}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end px-6 mt-4 md:mt-0">
              <Button variant="outline" onClick={() => print()}>
                <PrinterIcon className="size-4 mr-2" />
                <span>{t("print")}</span>
              </Button>
              <Button
                variant="default"
                onClick={async () => {
                  await saveElementAsImage(
                    "appointment-token-card",
                    `${patient.name}'s Appointment.png`,
                  );
                  toast.success("Appointment card has been saved!");
                }}
              >
                <DownloadIcon className="size-4 mr-2" />
                <span>{t("save")}</span>
              </Button>
            </div>
            {/* Lets only show encounter details if the appointment is not in a final status or if there is an encounter linked to the appointment */}
            {(![...AppointmentFinalStatuses, "noshow"].includes(
              appointment.status,
            ) ||
              appointment.associated_encounter?.id) && (
              <div className="md:mx-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AvatarIcon className="size-5 text-primary" />
                      {t("encounter")}
                    </CardTitle>
                  </CardHeader>
                  {appointment.associated_encounter?.id ? (
                    <CardContent className="space-y-2">
                      {/* Encounter Status and Class */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            ENCOUNTER_STATUS_COLORS[
                              appointment.associated_encounter.status
                            ]
                          }
                          className="text-xs"
                        >
                          {t(
                            `encounter_status__${appointment.associated_encounter.status}`,
                          )}
                        </Badge>
                        <Badge
                          variant={
                            ENCOUNTER_CLASSES_COLORS[
                              appointment.associated_encounter.encounter_class
                            ]
                          }
                          className="text-xs"
                        >
                          {t(
                            `encounter_class__${appointment.associated_encounter.encounter_class}`,
                          )}
                        </Badge>
                        <Badge
                          variant={
                            ENCOUNTER_PRIORITY_COLORS[
                              appointment.associated_encounter.priority
                            ]
                          }
                          className="text-xs"
                        >
                          {t(
                            `encounter_priority__${appointment.associated_encounter.priority}`,
                          )}
                        </Badge>
                      </div>

                      {/* Tags */}
                      {appointment.associated_encounter.tags &&
                        appointment.associated_encounter.tags.length > 0 && (
                          <div className="text-sm">
                            <div className="flex flex-wrap gap-1">
                              {appointment.associated_encounter.tags.map(
                                (tag) => (
                                  <Badge
                                    variant="outline"
                                    key={tag.id}
                                    className="text-xs"
                                  >
                                    {getTagHierarchyDisplay(tag)}
                                  </Badge>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      {/* Action Buttons */}
                      <div className="flex md:flex-row flex-col gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(
                              `/facility/${facility.id}/patient/${appointment.patient.id}/encounter/${appointment.associated_encounter!.id}/updates`,
                            )
                          }
                          className="flex items-center gap-2"
                        >
                          <EyeIcon className="size-4" />
                          {t("view_encounter")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(
                              `/facility/${facility.id}/patient/${appointment.patient.id}`,
                            )
                          }
                          className="flex items-center gap-2"
                        >
                          <PersonIcon className="size-4" />
                          {t("view_patient")}
                        </Button>
                      </div>
                    </CardContent>
                  ) : (
                    <CardContent className="space-y-2">
                      <div className="text-center">
                        <CardDescription>
                          {t("no_encounter_linked")}
                        </CardDescription>
                        <div className="text-gray-800 mb-4">
                          <p className="text-xs">
                            {t("create_encounter_description")}
                          </p>
                        </div>
                        <CreateEncounterForm
                          patientId={appointment.patient.id}
                          facilityId={facility.id}
                          patientName={appointment.patient.name}
                          appointment={appointment.id}
                          disableRedirectOnSuccess={true}
                          trigger={
                            <Button
                              variant="default"
                              size="lg"
                              className="w-full max-w-xs"
                            >
                              <PlusCircledIcon className="size-4 mr-2" />
                              {t("create_encounter")}
                            </Button>
                          }
                          onSuccess={() => {
                            // Refresh the appointment data to show the new encounter
                            queryClient.invalidateQueries({
                              queryKey: ["appointment", appointment.id],
                            });
                          }}
                        />
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            )}

            {canUpdateAppointment && (
              <>
                <div className="md:mx-4 mt-4">
                  <AppointmentActions
                    facilityId={facilityId}
                    appointment={appointment}
                    handleUpdateAppointment={handleUpdateAppointment}
                    onViewPatient={redirectToPatientPage}
                    canCreateAppointment={canCreateAppointment}
                    offlineEntryId={offlineEntryId}
                    isUpdating={isUpdating}
                    db={db}
                    authUser={authUser}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}

const AppointmentDetails = ({
  appointment,
  facility,
}: {
  appointment: AppointmentRead;
  facility: FacilityRead;
}) => {
  const { user } = appointment;
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return (
    <div className="container md:p-6 max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="mr-3 inline-block mb-2">
              {t("schedule_information")}
            </span>
            <Badge variant={APPOINTMENT_STATUS_COLORS[appointment.status]}>
              {t(appointment.status)}
            </Badge>
            {appointment.is_updated_offline === true && <PendingSyncBadge />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4 text-sm">
            <CalendarIcon className="size-5 text-gray-600" />
            <div>
              <p className="font-medium">
                {format(appointment.token_slot.start_datetime, "MMMM d, yyyy")}
              </p>
              <p className="text-gray-600">
                {appointment.token_slot.availability.name}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <ClockIcon className="size-5 text-gray-600" />
            <div>
              <p className="font-medium">
                {format(appointment.token_slot.start_datetime, "h:mm a")} -{" "}
                {format(appointment.token_slot.end_datetime, "h:mm a")}
              </p>
              <p className="text-gray-600 capitalize">
                {t("duration")}:{" "}
                {getReadableDuration(
                  appointment.token_slot.start_datetime,
                  appointment.token_slot.end_datetime,
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <AvatarIcon className="size-5 text-gray-600" />
            <div className="text-sm">
              <p className="font-medium">{t("booked_by")}</p>
              <p className="text-gray-600">
                {appointment.booked_by
                  ? formatName(appointment.booked_by)
                  : `${appointment.patient.name} (${t("patient")})`}{" "}
                {t("on")}{" "}
                {format(appointment.booked_on, "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <AvatarIcon className="size-5 text-gray-600" />
            <div className="text-sm">
              <p className="font-medium">{t("last_updated_by")}</p>
              <p className="text-gray-600">
                {appointment.updated_by
                  ? formatName(appointment.updated_by)
                  : appointment.created_by === null
                    ? t("unknown")
                    : formatName(appointment.created_by)}{" "}
                {t("on")}{" "}
                {format(appointment.modified_date, "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>
          <Separator />
          <div className="text-sm">
            <p className="font-medium">{t("note")}</p>
            <p className="text-gray-600 whitespace-pre-wrap">
              {appointment.note || t("no_note_provided")}
            </p>
          </div>
          <div className="text-sm">
            <div className="flex md:flex-row flex-col md:items-center justify-between mb-2 gap-2">
              <p className="font-medium">{t("tags")}</p>
              <TagAssignmentSheet
                entityType="appointment"
                entityId={appointment.id}
                facilityId={facility.id}
                currentTags={appointment.tags}
                onUpdate={() => {
                  queryClient.invalidateQueries({
                    queryKey: ["appointment", appointment.id],
                  });
                }}
                canWrite={true}
              />
            </div>
            {appointment.tags?.length > 0 ? (
              <p className="text-gray-600 flex flex-wrap gap-1">
                {appointment.tags.map((tag) => (
                  <Badge variant="outline" key={tag.id}>
                    {getTagHierarchyDisplay(tag)}
                  </Badge>
                ))}
              </p>
            ) : (
              <p className="text-gray-600 md:-mt-2">{t("no_tags_assigned")}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("patient_information")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4 text-sm">
            <PersonIcon className="size-5 text-gray-600" />
            <div>
              <p className="font-medium">{appointment.patient.name}</p>
              <p className="text-gray-600">
                {appointment.patient.date_of_birth ? (
                  <>
                    {format(appointment.patient.date_of_birth, "MMMM d, yyyy")}{" "}
                    |{" "}
                    {differenceInYears(
                      new Date(),
                      appointment.patient.date_of_birth!,
                    )}
                  </>
                ) : (
                  <>
                    {differenceInYears(
                      new Date(),
                      new Date().setFullYear(
                        Number(appointment.patient.year_of_birth),
                      ),
                    )}
                  </>
                )}{" "}
                {t("years")}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <MobileIcon className="size-5 text-gray-600" />
            <div>
              <p className="font-medium">
                <a
                  href={`tel:${appointment.patient.phone_number}`}
                  className="text-primary hover:underline"
                >
                  {formatPhoneNumberIntl(appointment.patient.phone_number)}
                </a>
              </p>
              <p className="text-gray-600">
                {t("emergency")}:{" "}
                {appointment.patient.emergency_phone_number && (
                  <a
                    href={`tel:${appointment.patient.emergency_phone_number}`}
                    className="text-primary hover:underline"
                  >
                    {formatPhoneNumberIntl(
                      appointment.patient.emergency_phone_number,
                    )}
                  </a>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-row items-start gap-4 text-sm">
            <DrawingPinIcon className="size-5 text-gray-600 mt-1" />
            <div className="min-w-0 flex-1">
              <p className="font-medium break-words">
                <ClickableAddress
                  address={
                    appointment.patient.address || t("no_address_provided")
                  }
                />
              </p>
              <p className="text-gray-600 break-words">
                {stringifyNestedObject(appointment.patient.geo_organization)}
              </p>
              <p className="text-gray-600">
                {t("pincode")}: {appointment.patient.pincode}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("practitioner_information")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <div className="text-sm">
              <p className="font-medium">{formatName(user)}</p>
            </div>
            <Separator />
            <div className="text-sm">
              <p className="font-medium">{t("facility")}</p>
              <p className="text-gray-600">{facility.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface AppointmentActionsProps {
  facilityId: string;
  appointment: AppointmentRead;
  handleUpdateAppointment: (data: AppointmentUpdateRequest) => void;
  onViewPatient: () => void;
  canCreateAppointment: boolean;
  offlineEntryId?: string;

  authUser: AuthUserModel;
  db: AppCacheDB;

  isUpdating: boolean;
}

const AppointmentActions = ({
  facilityId,
  appointment,
  handleUpdateAppointment,
  onViewPatient,
  canCreateAppointment,
  offlineEntryId,
  authUser,
  db,
  isUpdating,
}: AppointmentActionsProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedMonthOffline, setSelectedMonthOffline] = useState(new Date());
  const [selectedDateOffline, setSelectedDateOffline] = useState(new Date());
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isRescheduleReasonOpen, setIsRescheduleReasonOpen] = useState(false);
  const [newNote, setNewVisitReason] = useState(appointment.note);
  const [oldNote, setRescheduleReason] = useState(appointment.note);
  const [selectedPractitioner, setSelectedPractitioner] =
    useState<UserReadMinimal>(appointment.user);
  const [selectedSlotId, setSelectedSlotId] = useState<string>();
  const [OfflineSelectedSlot, setOfflineSelectedSlot] = useState<
    TokenSlot | undefined
  >();
  const [offlineEntry, setOfflineEntry] = useState<OfflineWritesEntry | null>(
    null,
  );

  const currentStatus = appointment.status;

  // Allow check-in/start consultation as long as the appointment is before 24 hours ahead of slot's start time
  const canCheckIn = isBefore(
    appointment.token_slot.start_datetime,
    addDays(new Date(), 1),
  );

  const [note, setNote] = useState(appointment.note);

  useEffect(() => {
    if (offlineEntryId) {
      const loadOfflineEntry = async () => {
        try {
          const entry = await db.OfflineWrites.get(offlineEntryId);
          if (entry && entry.normalizedData) {
            setOfflineEntry(entry);
          }
        } catch (error) {
          console.error("Error loading offline entry:", error);
        }
      };
      loadOfflineEntry();
    }
  }, [offlineEntryId, db]);

  useEffect(() => {
    if (offlineEntry?.type === "reschedule_appointment") {
      setIsRescheduleOpen(true);
    }
  }, [offlineEntry]);

  useEffect(() => {
    if (
      offlineEntry?.normalizedData &&
      offlineEntry.type === "reschedule_appointment"
    ) {
      const normalizedData = offlineEntry.normalizedData as Appointment;
      const payload = offlineEntry.payload as AppointmentRescheduleRequest;

      if (payload.previous_booking_note) {
        setRescheduleReason(payload.previous_booking_note);
      }
      if (payload.new_booking_note) {
        setNewVisitReason(payload.new_booking_note);
      }

      if (normalizedData.user) {
        setSelectedPractitioner(normalizedData.user);
      }

      if (normalizedData.token_slot) {
        setOfflineSelectedSlot(normalizedData.token_slot);
        setSelectedSlotId(normalizedData.token_slot.id);
      }
    }
  }, [offlineEntry]);

  const handleAppointmentCancelOfflineQueue = async (
    appointmentRequestData: AppointmentCancelRequest,
  ) => {
    await queueCancelAppointmentRecord({
      cancelAppointmentData: appointmentRequestData,
      appointment,
      authUser,
      status: appointmentRequestData.reason,
      facilityId,
      queryClient,
      t,
      db,
      onSuccess: (_appointmentId, _normalizedAppointment) => {
        toast.success(t("unsynced_appointment_cancelled"));
      },
      onError: (error) => {
        console.error("Error while cancelling appointment : ", error);
        toast.error(t("unexpected_error_while_cancelling_appointment"));
      },
    });
  };

  const { mutate: cancelAppointment, isPending: isCancelling } = useMutation<
    Appointment,
    HTTPError,
    AppointmentCancelRequest
  >({
    mutationFn: mutate(scheduleApis.appointments.cancel, {
      pathParams: { facilityId, id: appointment.id },
    }),
    networkMode: "always",
    onSuccess: async (data) => {
      if (offlineEntryId) {
        await handleOfflineRecordSuccess(offlineEntryId, data);
      }
      toast.success(t("appointment_cancelled"));
      queryClient.invalidateQueries({
        queryKey: ["appointment", appointment.id],
      });
    },
    onError: async (error, variables) => {
      // If network error, mark offline and push to offline queue
      if (error.message === "Network Error" && variables) {
        onlineManager.setOnline(false);
        await handleAppointmentCancelOfflineQueue(variables);
        return;
      }
    },
  });

  const handleAppointmentCancel = async ({
    reason,
    note,
  }: AppointmentCancelRequest) => {
    if (!reason || !appointment) {
      return;
    }

    if (!onlineManager.isOnline()) {
      await handleAppointmentCancelOfflineQueue({ reason: reason, note: note });
      return;
    }

    cancelAppointment({ reason: reason, note: note });
    return;
  };

  const handleAppointmentRescheduleOfflineQueue = async (
    appointmentRequestData: AppointmentRescheduleRequest,
  ) => {
    await queueRescheduleOfflineRecord({
      rescheduleAppointmentData: appointmentRequestData,
      selectedSlot: OfflineSelectedSlot,
      selectedPracticioner: selectedPractitioner,
      authUser,
      appointment,
      db,
      facilityId,
      queryClient,
      t,
      selectedDateOffline,
      selectedMonthOffline,
      onSuccess: (_appointmentId, _normalizedAppointment) => {
        toast.success(t("appointment_rescheduled"));
        setIsRescheduleOpen(false);
        setSelectedSlotId(undefined);
        setOfflineSelectedSlot(undefined);
        navigate(
          `/facility/${facilityId}/patient/${appointment.patient.id}/appointments/${appointment.id}`,
        );
      },
      onError: (error) => {
        console.error("Error while Rescheduling Appointment", error);
        toast.error(t("unexpected_error_while_rescheduling_appointment"));
      },
    });
  };

  const { mutate: rescheduleAppointment, isPending: isRescheduling } =
    useMutation<Appointment, HTTPError, AppointmentRescheduleRequest>({
      mutationFn: mutate(scheduleApis.appointments.reschedule, {
        pathParams: { facilityId, id: appointment.id },
      }),
      networkMode: "always",
      onSuccess: async (newAppointment: Appointment) => {
        if (offlineEntryId) {
          await handleOfflineRecordSuccess(offlineEntryId, newAppointment);
        }
        toast.success(t("appointment_rescheduled"));
        queryClient.invalidateQueries({
          queryKey: ["appointment", appointment.id],
        });
        setIsRescheduleOpen(false);
        setSelectedSlotId(undefined);
        setRescheduleReason("");
        navigate(
          `/facility/${facilityId}/patient/${appointment.patient.id}/appointments/${newAppointment.id}`,
        );
      },
      onError: async (error, variables) => {
        // If network error, mark offline and push to offline queue
        if (error.message === "Network Error" && variables) {
          onlineManager.setOnline(false);
          await handleAppointmentRescheduleOfflineQueue(variables);
          return;
        }
      },
    });

  const handleRescheduleSubmit = async (
    rescheduleAppointmentData: AppointmentRescheduleRequest,
  ) => {
    if (!selectedSlotId) {
      toast.error(t("slot_is_not_selected"));
      return;
    }

    if (!onlineManager.isOnline()) {
      await handleAppointmentRescheduleOfflineQueue(rescheduleAppointmentData);
      return;
    }

    rescheduleAppointment(rescheduleAppointmentData);
    return;
  };

  if (AppointmentFinalStatuses.includes(currentStatus)) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <GearIcon className="size-5 text-primary" />
          {t("actions")}
        </CardTitle>
        <CardDescription>{t("appointment_management_actions")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Actions */}
        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={onViewPatient}
            size="lg"
            className="w-full justify-start h-12"
          >
            <PersonIcon className="size-4 mr-3" />
            {t("patient_home")}
          </Button>

          {/* Check In - Only for booked appointments */}
          {currentStatus === "booked" && (
            <Button
              disabled={!canCheckIn}
              variant="primary"
              onClick={() =>
                handleUpdateAppointment({
                  status: "checked_in",
                  note: appointment.note,
                })
              }
              size="lg"
              className="w-full justify-start h-12"
            >
              <EnterIcon className="size-4 mr-3" />
              {t("check_in")}
            </Button>
          )}

          {/* Start Consultation - For booked and checked in appointments */}
          {["booked", "checked_in"].includes(currentStatus) &&
            (appointment.associated_encounter?.id ? (
              // When encounter exists: set status to in_consultation and redirect
              <Button
                disabled={!canCheckIn}
                variant={currentStatus === "checked_in" ? "primary" : "outline"}
                size="lg"
                className="w-full justify-start h-12"
                onClick={() => {
                  handleUpdateAppointment({
                    status: "in_consultation",
                    note: appointment.note,
                  });
                  navigate(
                    `/facility/${facilityId}/patient/${appointment.patient.id}/encounter/${appointment.associated_encounter!.id}/updates`,
                  );
                }}
              >
                <PlusCircledIcon className="size-4 mr-3" />
                {t("start_consultation")}
              </Button>
            ) : (
              // When no encounter exists: create encounter and set status to in_consultation
              <CreateEncounterForm
                patientId={appointment.patient.id}
                facilityId={facilityId}
                patientName={appointment.patient.name}
                appointment={appointment.id}
                trigger={
                  <Button
                    disabled={!canCheckIn}
                    variant={
                      currentStatus === "checked_in" ? "primary" : "outline"
                    }
                    size="lg"
                    className="w-full justify-start h-12"
                  >
                    <PlusCircledIcon className="size-4 mr-3" />
                    {t("start_consultation")}
                  </Button>
                }
                onSuccess={() => {
                  handleUpdateAppointment({
                    status: "in_consultation",
                    note: appointment.note,
                  });
                }}
              />
            ))}

          {/* Mark as Fulfilled - For in consultation */}
          {currentStatus === "in_consultation" && (
            <Button
              variant="primary"
              onClick={() =>
                handleUpdateAppointment({
                  status: "fulfilled",
                  note: appointment.note,
                })
              }
              size="lg"
              className="w-full justify-start h-12"
            >
              <CheckCircledIcon className="size-4 mr-3" />
              {t("mark_as_fulfilled")}
            </Button>
          )}
        </div>

        {/* Secondary Actions */}
        {canCreateAppointment && (
          <div className="space-y-3">
            <Separator />

            {/* Reschedule */}
            <AlertDialog
              open={isRescheduleReasonOpen}
              onOpenChange={setIsRescheduleReasonOpen}
            >
              <AlertDialogTrigger asChild>
                {appointment.status !== "in_consultation" && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full justify-start h-12"
                  >
                    <CalendarIcon className="size-4 mr-3" />
                    {t("reschedule")}
                  </Button>
                )}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("reschedule_appointment")}
                  </AlertDialogTitle>
                  <Label>{t("note")}</Label>
                  <Textarea
                    value={oldNote}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                  />
                  <AlertDialogDescription>
                    <Alert variant="destructive">
                      <AlertTitle>{t("warning")}</AlertTitle>
                      <AlertDescription>
                        {t("reschedule_appointment_warning")}
                      </AlertDescription>
                    </Alert>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    onClick={() => setIsRescheduleReasonOpen(false)}
                  >
                    {t("cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setIsRescheduleReasonOpen(false);
                      setIsRescheduleOpen(true);
                    }}
                    disabled={!oldNote.trim()}
                  >
                    {t("continue")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Sheet open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
              <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>{t("reschedule_appointment")}</SheetTitle>
                </SheetHeader>

                <div className="mt-6">
                  <div className="text-sm">
                    <div className="flex md:flex-row flex-col md:items-center justify-between mb-2 gap-2">
                      <Label className="font-medium">{t("tags")}</Label>
                      <TagAssignmentSheet
                        entityType="appointment"
                        entityId={appointment.id}
                        facilityId={facilityId}
                        currentTags={appointment.tags}
                        onUpdate={() => {
                          queryClient.invalidateQueries({
                            queryKey: ["appointment", appointment.id],
                          });
                        }}
                        canWrite={true}
                      />
                    </div>
                    {appointment.tags?.length > 0 ? (
                      <p className="text-gray-600 flex flex-wrap gap-1">
                        {appointment.tags.map((tag) => (
                          <Badge key={tag.id} variant="secondary">
                            {tag.parent ? `${tag.parent.display}: ` : ""}
                            {tag.display}
                          </Badge>
                        ))}
                      </p>
                    ) : (
                      <p className="text-gray-600 md:-mt-2">
                        {t("no_tags_assigned")}
                      </p>
                    )}
                  </div>
                  <Label className="mb-2 aria-required mt-8">{t("note")}</Label>
                  <Textarea
                    placeholder={t("appointment_note")}
                    value={newNote}
                    onChange={(e) => setNewVisitReason(e.target.value)}
                  />
                  <div className="my-4">
                    <Label className="mb-2">{t("select_practitioner")}</Label>
                    <PractitionerSelector
                      facilityId={facilityId}
                      selected={selectedPractitioner}
                      onSelect={(user) => user && setSelectedPractitioner(user)}
                    />
                  </div>
                  <AppointmentSlotPicker
                    facilityId={facilityId}
                    resourceId={selectedPractitioner?.id}
                    selectedSlotId={selectedSlotId}
                    onSlotSelect={setSelectedSlotId}
                    currentAppointment={appointment}
                    setOfflineSelectedSlot={setOfflineSelectedSlot}
                    setSelectedMonthOffline={setSelectedMonthOffline}
                    setSelectedDateOffline={setSelectedDateOffline}
                  />

                  <div className="flex justify-end gap-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsRescheduleOpen(false);
                        setSelectedSlotId(undefined);
                      }}
                    >
                      {t("cancel")}
                    </Button>
                    <Button
                      variant="default"
                      disabled={!selectedSlotId || isRescheduling}
                      onClick={() => {
                        if (selectedSlotId) {
                          handleRescheduleSubmit({
                            new_slot: selectedSlotId,
                            previous_booking_note: oldNote,
                            new_booking_note: newNote,
                            tags: appointment.tags.map((tag) => tag.id),
                          });
                        }
                      }}
                    >
                      {isRescheduling ? t("rescheduling") : t("reschedule")}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Mark as No Show */}
            {["booked", "checked_in"].includes(currentStatus) && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full justify-start h-12"
                  >
                    <EyeNoneIcon className="size-4 mr-3" />
                    {t("mark_as_noshow")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("mark_as_noshow")}</AlertDialogTitle>
                    <Label>{t("note")}</Label>
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                    <AlertDialogDescription>
                      <Alert variant="destructive">
                        <AlertTitle>{t("warning")}</AlertTitle>
                        <AlertDescription>
                          {t("mark_as_noshow_warning")}
                        </AlertDescription>
                      </Alert>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        handleUpdateAppointment({
                          status: "noshow",
                          note: note,
                        })
                      }
                      className={cn(buttonVariants({ variant: "destructive" }))}
                      disabled={!note.trim()}
                    >
                      {isUpdating ? (
                        <Loader2 className="size-4 animate-spin mr-2" />
                      ) : (
                        t("confirm")
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* Cancel Appointment */}
            {appointment.status !== "in_consultation" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full justify-start h-12"
                  >
                    <BanIcon className="size-4 mr-3" />
                    {t("cancel_appointment")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("cancel_appointment")}
                    </AlertDialogTitle>
                    <Label>{t("note")}</Label>
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                    <AlertDialogDescription>
                      <Alert variant="destructive">
                        <AlertTitle>{t("warning")}</AlertTitle>
                        <AlertDescription>
                          {t("cancel_appointment_warning")}
                        </AlertDescription>
                      </Alert>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        handleAppointmentCancel({
                          reason: "cancelled",
                          note: note,
                        })
                      }
                      className={cn(buttonVariants({ variant: "destructive" }))}
                      disabled={!note.trim()}
                    >
                      {isCancelling ? (
                        <Loader2 className="size-4 animate-spin mr-2" />
                      ) : (
                        t("confirm")
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* Mark as Entered in Error */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full justify-start h-12"
                >
                  <BanIcon className="size-4 mr-3" />
                  {t("mark_as_entered_in_error")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("mark_as_entered_in_error")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    <Alert variant="destructive" className="mt-4">
                      <AlertTitle>{t("warning")}</AlertTitle>
                      <AlertDescription>
                        {t("entered_in_error_warning")}
                      </AlertDescription>
                    </Alert>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      handleAppointmentCancel({ reason: "entered_in_error" })
                    }
                    className={cn(buttonVariants({ variant: "destructive" }))}
                  >
                    {isCancelling ? (
                      <Loader2 className="size-4 animate-spin mr-2" />
                    ) : (
                      t("confirm")
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
