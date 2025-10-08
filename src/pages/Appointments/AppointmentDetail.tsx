import {
  AvatarIcon,
  CalendarIcon,
  CheckCircledIcon,
  ClockIcon,
  DotsVerticalIcon,
  DrawingPinIcon,
  EnterIcon,
  EyeNoneIcon,
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
import { addDays, format, isBefore } from "date-fns";
import {
  BanIcon,
  CheckCircle2Icon,
  ChevronLeft,
  EyeIcon,
  Loader2,
  PlusSquare,
  PrinterIcon,
  ReceiptText,
  SquareActivity,
  X,
} from "lucide-react";
import { navigate, useQueryParams } from "raviger";

import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import { useShortcutSubContext } from "@/context/ShortcutContext";
import { formatPhoneNumberIntl } from "react-phone-number-input";
import { toast } from "sonner";

import { ChargeItemsSection } from "@/components/Billing/ChargeItems/ChargeItemsSection";
import { ChargeItemServiceResource } from "@/types/billing/chargeItem/chargeItem";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import CreateEncounterForm from "@/components/Encounter/CreateEncounterForm";
import { PatientAddressLink } from "@/components/Patient/PatientAddressLink";
import TagAssignmentSheet from "@/components/Tags/TagAssignmentSheet";

import useAppHistory from "@/hooks/useAppHistory";
import useAuthUser from "@/hooks/useAuthUser";
import { useOfflineEntry } from "@/hooks/useOfflineEntry";

import { getPermissions } from "@/common/Permissions";

import { usePermissions } from "@/context/PermissionContext";
import { TokenGenerationSheet } from "@/pages/Appointments/components/TokenGenerationSheet";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import {
  ENCOUNTER_CLASSES_COLORS,
  ENCOUNTER_PRIORITY_COLORS,
  ENCOUNTER_STATUS_COLORS,
} from "@/types/emr/encounter/encounter";
import { getTagHierarchyDisplay } from "@/types/emr/tagConfig/tagConfig";
import { FacilityRead } from "@/types/facility/facility";
import {
  Appointment,
  APPOINTMENT_STATUS_COLORS,
  AppointmentCancelRequest,
  AppointmentFinalStatuses,
  AppointmentRead,
  AppointmentRescheduleRequest,
  AppointmentStatus,
  AppointmentUpdateRequest,
  formatScheduleResourceName,
  SchedulableResourceType,
  ScheduleResource,
  TokenSlot,
} from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  formatName,
  getReadableDuration,
  stringifyNestedObject,
} from "@/Utils/utils";

import {
  queueCancelAppointmentRecord,
  queueRescheduleOfflineRecord,
  queueUpdateAppointmentRecordOffline,
} from "@/components/Appointment/offlineQueue";
import { Avatar } from "@/components/Common/Avatar";
import BackButton from "@/components/Common/BackButton";
import { PatientInfoCard } from "@/components/Patient/PatientInfoCard";
import { formatPatientAddress } from "@/components/Patient/utils";
import {
  ScheduleResourceFormState,
  ScheduleResourceSelector,
} from "@/components/Schedule/ResourceSelector";
import { AppCacheDB } from "@/OfflineSupport/AppcacheDB";
import { handleOfflineRecordSuccess } from "@/OfflineSupport/offlineWriteHelpers";
import { AppointmentDateSelection } from "@/pages/Appointments/BookAppointment/AppointmentDateSelection";
import { AppointmentSlotPicker } from "@/pages/Appointments/BookAppointment/AppointmentSlotPicker";
import { TokenCard } from "@/pages/Appointments/components/AppointmentTokenCard";
import { QuickAction } from "@/pages/Encounters/tabs/overview/quick-actions";
import { CurrentUserRead } from "@/types/user/user";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import { HTTPError } from "@/Utils/request/types";

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

  const [params, setQueryParams] = useQueryParams();
  const { showSuccess } = params;

  useShortcutSubContext("facility:appointment");

  const { canViewAppointments, canWriteAppointment } = getPermissions(
    hasPermission,
    facility?.permissions ?? [],
  );

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

  // const redirectToPatientPage = () => {
  //   navigate(`/facility/${facility?.id}/patients/verify`, {
  //     query: {
  //       phone_number: patient.phone_number,
  //       year_of_birth: patient.year_of_birth,
  //       partial_id: !isOfflineId(patient.id)
  //         ? patient.id.slice(0, 5)
  //         : patient.id,
  //     },
  //   });
  // };

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
        // if (appointmentRequestData.status === "in_consultation") {
        //   redirectToPatientPage();
        // }
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
      // If network error, push to offline queue
      if (error.message === "Network Error" && variables) {
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
  const currentStatus = appointment.status;

  const canCheckIn = isBefore(
    appointment.token_slot.start_datetime,
    addDays(new Date(), 1),
  );

  return (
    <Page title={t("appointment_details")} hideTitleOnPage>
      <div className="container mx-auto max-w-7xl mt-4">
        <div className="flex gap-2 items-center mb-2">
          <BackButton size="icon" variant="ghost">
            <ChevronLeft />
          </BackButton>
          <h4 className="font-semibold text-gray-800">
            {t("appointment_details")}
          </h4>
        </div>
        {showSuccess && (
          <div className="mb-4 flex flex-col gap-2">
            <Alert className="bg-green-50 border-green-400 items-center">
              <CheckCircle2Icon className="h-8 w-8 text-green-600" />
              <AlertTitle className="text-green-800 flex items-center gap-2 justify-between">
                {t("appointment_created_success")}!
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQueryParams({})}
                  className="self-end"
                  aria-label={t("close")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </AlertTitle>
              <AlertDescription className="text-green-800">
                <p>
                  <Trans
                    i18nKey="appointment_created_successfully_description"
                    components={{
                      strong: <strong className="font-semibold" />,
                    }}
                    values={{
                      name:
                        (appointment &&
                          formatScheduleResourceName(appointment)) ||
                        "",
                      date: format(
                        appointment.token_slot.start_datetime,
                        "do MMMM",
                      ),
                      time: format(
                        appointment.token_slot.start_datetime,
                        "h:mm a",
                      ),
                      duration: getReadableDuration(
                        appointment.token_slot.start_datetime,
                        appointment.token_slot.end_datetime,
                      ),
                    }}
                  />
                </p>
              </AlertDescription>
            </Alert>
          </div>
        )}
        <div>
          <PatientInfoCard
            patient={appointment.patient}
            facilityId={facilityId}
            tags={appointment.tags}
            onTagsUpdate={() => {
              queryClient.invalidateQueries({
                queryKey: ["appointment", appointment.id],
              });
            }}
            tagEntityType="appointment"
            tagEntityId={appointment.id}
            children={
              canWriteAppointment && (
                <div className="md:mx-4">
                  <AppointmentActions
                    facilityId={facilityId}
                    appointment={appointment}
                    handleUpdateAppointment={handleUpdateAppointment}
                    canWriteAppointment={canWriteAppointment}
                    isUpdating={isUpdating}
                    canCheckIn={canCheckIn}
                    currentStatus={currentStatus}
                    offlineEntryId={offlineEntryId}
                    db={db}
                    authUser={authUser}
                  />
                </div>
              )
            }
          />
        </div>
        <div
          className={cn(
            "flex flex-col-reverse lg:flex-row mt-2 md:mt-0",
            isUpdating && "opacity-50 pointer-events-none animate-pulse",
          )}
        >
          <AppointmentDetailsContent
            appointment={appointment}
            facility={facility}
          />
          <div className="mt-6 pl-0 md:pl-4 flex-1">
            <h3 className="text-base font-semibold">{t("token")}</h3>
            {appointment.token?.number ? (
              <>
                <div
                  id="section-to-print"
                  className="print:w-[400px] print:pt-4"
                >
                  <TokenCard
                    appointment={appointment}
                    token={appointment.token}
                    facility={facility}
                  />
                </div>
              </>
            ) : (
              !["fulfilled"].includes(appointment.status) && (
                <div className="bg-gray-100 border border-gray-200 rounded flex flex-col items-center justify-center text-center">
                  <ReceiptText className="size-8 text-gray-500 mt-4" />
                  <div className="mt-2">
                    <h6 className="text-gray-900 text-sm font-semibold">
                      {t("token_not_generated")}
                    </h6>
                    <p className="text-gray-900 text-sm">
                      {t("token_not_generated_description")}
                    </p>
                  </div>
                  <div className="mt-2 mb-4">
                    <TokenGenerationSheet
                      facilityId={facility.id}
                      resourceType={appointment.resource_type}
                      appointmentId={appointment.id}
                      trigger={
                        <Button
                          variant="outline"
                          className="px-6"
                          disabled={AppointmentFinalStatuses.includes(
                            appointment.status,
                          )}
                        >
                          <PlusCircledIcon className="size-4 mr-2" />
                          {t("generate_token")}
                          <ShortcutBadge actionId="generate-token" />
                        </Button>
                      }
                      onSuccess={() => {
                        queryClient.invalidateQueries({
                          queryKey: ["appointment", appointment.id],
                        });
                      }}
                    />
                  </div>
                </div>
              )
            )}
            {appointment.associated_encounter?.id && (
              <Card className="bg-white shadow-sm rounded-md p-1 mt-2">
                <CardHeader className="p-2 bg-gray-50">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AvatarIcon className="size-5 text-primary" />
                    {t("encounter")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-2 px-1">
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
                          {appointment.associated_encounter.tags.map((tag) => (
                            <Badge
                              variant="outline"
                              key={tag.id}
                              className="text-xs"
                            >
                              {getTagHierarchyDisplay(tag)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Encounter Action Buttons */}
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
              </Card>
            )}
            {/* Lets only show encounter details if the appointment is not in a final status or if there is an encounter linked to the appointment */}
            {![...AppointmentFinalStatuses].includes(appointment.status) && (
              <div>
                <h3 className="text-base font-semibold mt-4">
                  {t("quick_actions")}
                </h3>
                <div className="grid gap-1 grid-cols-1 md:grid-cols-2 mt-1">
                  {/* Start Consultation - For booked and checked in appointments */}
                  {["booked", "checked_in"].includes(currentStatus) &&
                    (appointment.associated_encounter?.id ? (
                      // When encounter exists: set status to in_consultation and redirect
                      <QuickAction
                        icon={<PlusSquare className="text-primary-500" />}
                        title={t("start_consultation")}
                        actionId="start-consultation"
                        onClick={() => {
                          handleUpdateAppointment({
                            status: AppointmentStatus.IN_CONSULTATION,
                            note: appointment.note,
                          });
                          navigate(
                            `/facility/${facilityId}/patient/${appointment.patient.id}/encounter/${appointment.associated_encounter!.id}/updates`,
                          );
                        }}
                      />
                    ) : (
                      // When no encounter exists: create encounter and set status to in_consultation
                      <CreateEncounterForm
                        patientId={appointment.patient.id}
                        facilityId={facilityId}
                        patientName={appointment.patient.name}
                        appointment={appointment.id}
                        trigger={
                          <QuickAction
                            icon={<PlusSquare className="text-primary-500" />}
                            title={t("start_consultation")}
                            actionId="start-consultation"
                          />
                        }
                        onSuccess={() => {
                          handleUpdateAppointment({
                            status: AppointmentStatus.IN_CONSULTATION,
                            note: appointment.note,
                          });
                        }}
                      />
                    ))}

                  {!appointment.associated_encounter?.id && (
                    <CreateEncounterForm
                      patientId={appointment.patient.id}
                      facilityId={facilityId}
                      patientName={appointment.patient.name}
                      appointment={appointment.id}
                      disableRedirectOnSuccess={true}
                      trigger={
                        <QuickAction
                          icon={<SquareActivity className="text-orange-500" />}
                          title={t("create_encounter")}
                          actionId="create-encounter"
                        />
                      }
                      onSuccess={() => {
                        console.log("invalidating appointment", appointment.id);
                        queryClient.invalidateQueries({
                          queryKey: ["appointment", appointment.id],
                        });
                      }}
                    />
                  )}
                  {/* Print Appointment */}
                  <QuickAction
                    icon={<PrinterIcon className="size-4" />}
                    title={t("print_appointment")}
                    actionId="print-appointment"
                    href={`/facility/${facilityId}/patient/${appointment.patient.id}/appointments/${appointment.id}/print`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}

const AppointmentDetailsContent = ({
  appointment,
  facility,
}: {
  appointment: AppointmentRead;
  facility: FacilityRead;
}) => {
  const { t } = useTranslation();

  return (
    <div className="container max-w-3xl space-y-6 mt-6">
      <ChargeItemsSection
        facilityId={facility.id}
        resourceId={appointment.id}
        patientId={appointment.patient.id}
        serviceResourceType={ChargeItemServiceResource.appointment}
        sourceUrl={`/facility/${facility.id}/patient/${appointment.patient.id}/appointments/${appointment.id}`}
        encounterId={appointment.associated_encounter?.id}
        viewOnly={true}
      />
      <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
        <Card className="bg-white shadow-sm rounded-md p-1">
          <CardHeader className="p-2 bg-gray-50">
            <CardTitle className="flex justify-between">
              <span className="mr-3 inline-block mb-2">
                {t("schedule_information")}
              </span>
              <Badge variant={APPOINTMENT_STATUS_COLORS[appointment.status]}>
                {t(appointment.status)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-2">
            <div className="flex space-x-2 text-sm">
              <CalendarIcon className="size-4 text-gray-600" />
              <div>
                <p className="font-medium">
                  {format(
                    appointment.token_slot.start_datetime,
                    "MMMM d, yyyy",
                  )}
                </p>
                <p className="text-gray-600">
                  {appointment.token_slot.availability.name}
                </p>
              </div>
            </div>
            <div className="flex space-x-2 text-sm">
              <ClockIcon className="size-4 text-gray-500" />
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
            <div className="flex space-x-2 text-sm">
              <AvatarIcon className="size-4 text-gray-500" />
              <div className="text-sm">
                <p className="font-medium">{t("booked_by")}</p>
                <p className="text-gray-600 flex w-fit items-center gap-2 bg-gray-100 p-1 rounded-sm">
                  {appointment.booked_by && (
                    <Avatar
                      name={formatName(appointment.booked_by)}
                      imageUrl={appointment.booked_by?.profile_picture_url}
                      className="size-6"
                    />
                  )}
                  {appointment.booked_by
                    ? formatName(appointment.booked_by)
                    : `${appointment.patient.name} (${t("patient")})`}{" "}
                </p>
                {t("on")}{" "}
                {format(appointment.booked_on, "MMMM d, yyyy 'at' h:mm a")}
              </div>
            </div>
            <div className="flex space-x-2 text-sm">
              <AvatarIcon className="size-4 text-gray-500" />
              <div className="text-sm">
                <p className="font-medium">{t("last_updated_by")}</p>
                <p className="text-gray-600 flex w-fit items-center gap-2 bg-gray-100 p-1 rounded-sm">
                  {appointment.updated_by && (
                    <Avatar
                      name={formatName(appointment.updated_by)}
                      imageUrl={appointment.updated_by?.profile_picture_url}
                      className="size-6"
                    />
                  )}
                  {appointment.updated_by
                    ? formatName(appointment.updated_by)
                    : appointment.created_by === null
                      ? t("unknown")
                      : formatName(appointment.created_by)}{" "}
                </p>
                {t("on")}{" "}
                {format(appointment.modified_date, "MMMM d, yyyy 'at' h:mm a")}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm rounded-md p-1">
          <CardHeader className="p-2 bg-gray-50">
            <CardTitle>{t("patient_information")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-2">
            <div className="flex space-x-2 text-sm">
              <MobileIcon className="size-4 text-gray-500" />
              <div>
                <p className="text-gray-600">
                  {t("phone")}:{" "}
                  <a
                    href={`tel:${appointment.patient.phone_number}`}
                    className="text-primary hover:underline"
                  >
                    {formatPhoneNumberIntl(appointment.patient.phone_number)}
                  </a>
                </p>
                {appointment.patient.emergency_phone_number && (
                  <p className="text-gray-600">
                    {t("emergency")}:{" "}
                    <a
                      href={`tel:${appointment.patient.emergency_phone_number}`}
                      className="text-primary hover:underline"
                    >
                      {formatPhoneNumberIntl(
                        appointment.patient.emergency_phone_number,
                      )}
                    </a>
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-row items-start gap-2 text-sm">
              <DrawingPinIcon className="size-4 text-gray-500 mt-1" />
              <div className="flex flex-col gap-2 w-full">
                <div>
                  <p className="text-gray-600 break-words">
                    {formatPatientAddress(appointment.patient.address) || (
                      <span className="text-gray-500">
                        {t("no_address_provided")}
                      </span>
                    )}
                  </p>
                  <p className="text-gray-600 break-words">
                    {stringifyNestedObject(
                      appointment.patient.geo_organization,
                    )}
                  </p>
                  <p className="text-gray-600">
                    {t("pincode")}: {appointment.patient.pincode}
                  </p>
                </div>
                <PatientAddressLink address={appointment.patient.address} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-sm rounded-md p-1">
        <CardHeader className="p-2 bg-gray-50">
          <CardTitle>
            {t(`schedulable_resource__${appointment.resource_type}`)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-2">
          <div className="flex flex-row items-center gap-2">
            <p className="text-sm font-medium flex flex-row items-center gap-2">
              {appointment.resource_type ===
                SchedulableResourceType.Practitioner && (
                <Avatar
                  name={formatName(appointment.resource)}
                  imageUrl={appointment.resource?.profile_picture_url}
                  className="size-6"
                />
              )}
              {formatScheduleResourceName(appointment)}
            </p>
            <Separator orientation="vertical" className="min-h-6 h-full" />
            <p className="text-sm text-gray-600">{facility.name}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white shadow-sm rounded-md p-1">
        <CardHeader className="p-2 bg-gray-50">
          <CardTitle>{t("note")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-2">
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {appointment.note || t("no_note_provided")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

interface AppointmentActionsProps {
  facilityId: string;
  appointment: AppointmentRead;

  handleUpdateAppointment: (data: AppointmentUpdateRequest) => void;
  canWriteAppointment: boolean;

  isUpdating: boolean;
  canCheckIn: boolean;
  currentStatus: AppointmentStatus;
  offlineEntryId?: string;

  authUser: CurrentUserRead;
  db: AppCacheDB;
}

const AppointmentActions = ({
  facilityId,
  appointment,
  handleUpdateAppointment,
  canWriteAppointment,
  isUpdating,
  canCheckIn,
  currentStatus,
  authUser,
  db,
}: AppointmentActionsProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  // <<<<<<< HEAD
  //   const [selectedMonthOffline, setSelectedMonthOffline] = useState(new Date());
  //   const [selectedDateOffline, setSelectedDateOffline] = useState(new Date());
  // =======

  const [selectedResource, setSelectedResource] =
    useState<ScheduleResourceFormState>(appointment);
  // >>>>>>> upstream/develop
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isRescheduleReasonOpen, setIsRescheduleReasonOpen] = useState(false);
  const [newNote, setNewVisitReason] = useState(appointment.note);
  const [oldNote, setRescheduleReason] = useState(appointment.note);
  // <<<<<<< HEAD
  //   const [selectedPractitioner, setSelectedPractitioner] =
  //     useState<UserReadMinimal>(appointment.user);
  // =======

  // >>>>>>> upstream/develop
  const [selectedSlotId, setSelectedSlotId] = useState<string>();
  const [OfflineSelectedSlot, setOfflineSelectedSlot] = useState<
    TokenSlot | undefined
  >();

  const { offlineEntryId, offlineEntry } = useOfflineEntry();

  const [selectedDate, setSelectedDate] = useState(new Date());

  const [note, setNote] = useState(appointment.note);

  // useEffect(() => {
  //   if (offlineEntryId) {
  //     const loadOfflineEntry = async () => {
  //       try {
  //         const entry = await db.OfflineWrites.get(offlineEntryId);
  //         if (entry && entry.normalizedData) {
  //           setOfflineEntry(entry);
  //         }
  //       } catch (error) {
  //         console.error("Error loading offline entry:", error);
  //       }
  //     };
  //     loadOfflineEntry();
  //   }
  // }, [offlineEntryId, db]);

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

      if (payload.new_slot) {
        setSelectedSlotId(payload.new_slot);
        setSelectedDate(new Date(normalizedData.token_slot.start_datetime));
      }

      if (normalizedData.booked_by) {
        setSelectedResource({
          resource: normalizedData.booked_by,
          resource_type: SchedulableResourceType.Practitioner,
        });
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
    const status: AppointmentStatus =
      appointmentRequestData.reason === "cancelled"
        ? AppointmentStatus.CANCELLED
        : AppointmentStatus.ENTERED_IN_ERROR;

    await queueCancelAppointmentRecord({
      cancelAppointmentData: appointmentRequestData,
      appointment,
      authUser,
      status: status,
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
      // If network error, push to offline queue
      if (error.message === "Network Error" && variables) {
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
    console.log(
      "Handling offline queue for reschedule",
      appointmentRequestData,
      selectedResource,
      selectedSlotId,
      OfflineSelectedSlot,
    );
    const slotMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1,
    );

    await queueRescheduleOfflineRecord({
      rescheduleAppointmentData: appointmentRequestData,
      selectedSlot: OfflineSelectedSlot,
      selectedResource: selectedResource as ScheduleResource,
      authUser,
      appointment,
      db,
      facilityId,
      queryClient,
      t,
      selectedDate,
      slotMonth,
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
        // If network error, push to offline queue
        if (error.message === "Network Error" && variables) {
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

    console.log("Handling online reschedule", rescheduleAppointmentData);
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
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Primary Actions */}
      <div className="flex items-center justify-between gap-2">
        {/* Check In - Only for booked appointments */}
        {currentStatus && currentStatus === AppointmentStatus.BOOKED && (
          <Button
            disabled={!canCheckIn}
            variant="primary"
            onClick={() =>
              handleUpdateAppointment({
                status: AppointmentStatus.CHECKED_IN,
                note: appointment.note,
              })
            }
            size="lg"
            className="w-full justify-start"
          >
            <EnterIcon className="size-4" />
            {t("check_in")}
            <ShortcutBadge actionId="check-in-action" />
          </Button>
        )}

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <DotsVerticalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>

            <DropdownMenuItem
              onClick={() =>
                handleUpdateAppointment({
                  status: AppointmentStatus.FULFILLED,
                  note: appointment.note,
                })
              }
            >
              <CheckCircledIcon className="size-4 mr-2" />
              {t("mark_as_fulfilled")}
            </DropdownMenuItem>

            {/* Secondary Actions */}
            {canWriteAppointment && (
              <>
                <DropdownMenuSeparator />

                {/* Reschedule */}
                {appointment.status !== AppointmentStatus.IN_CONSULTATION && (
                  <>
                    <AlertDialog
                      open={isRescheduleReasonOpen}
                      onOpenChange={setIsRescheduleReasonOpen}
                    >
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <CalendarIcon className="size-4 mr-2" />
                          {t("reschedule")}
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t("reschedule_appointment")}
                          </AlertDialogTitle>
                          <Label>{t("note")}</Label>
                          <Textarea
                            value={oldNote}
                            onChange={(e) =>
                              setRescheduleReason(e.target.value)
                            }
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

                    <Sheet
                      open={isRescheduleOpen}
                      onOpenChange={setIsRescheduleOpen}
                    >
                      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                        <SheetHeader>
                          <SheetTitle>{t("reschedule_appointment")}</SheetTitle>
                        </SheetHeader>

                        <div className="mt-6 flex-1">
                          <div className="text-sm">
                            <div className="flex md:flex-row flex-col md:items-center justify-between mb-2 gap-2">
                              <Label className="font-medium">
                                {t("tags", { count: 2 })}
                              </Label>
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
                                    {tag.parent
                                      ? `${tag.parent.display}: `
                                      : ""}
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
                          <Label className="mb-2 aria-required mt-8">
                            {t("note")}
                          </Label>
                          <Textarea
                            placeholder={t("appointment_note")}
                            value={newNote}
                            onChange={(e) => setNewVisitReason(e.target.value)}
                          />
                          <div className="my-4 space-y-4">
                            <div className="flex flex-col">
                              <Label className="mb-2 text-sm font-medium text-gray-950">
                                {t(
                                  `schedulable_resource__${selectedResource.resource_type}`,
                                )}
                              </Label>
                              <ScheduleResourceSelector
                                selectedResource={selectedResource}
                                facilityId={facilityId}
                                setSelectedResource={setSelectedResource}
                              />
                            </div>
                          </div>
                          <div className="space-y-4">
                            <AppointmentDateSelection
                              facilityId={facilityId}
                              resourceId={selectedResource.resource?.id}
                              resourceType={selectedResource.resource_type}
                              currentAppointment={appointment}
                              setSelectedDate={setSelectedDate}
                              selectedDate={selectedDate}
                            />
                            <AppointmentSlotPicker
                              selectedDate={selectedDate}
                              facilityId={facilityId}
                              resourceId={selectedResource.resource?.id}
                              resourceType={selectedResource.resource_type}
                              selectedSlotId={selectedSlotId}
                              onSlotSelect={setSelectedSlotId}
                              onSlotDetailsChange={setOfflineSelectedSlot}
                              currentAppointment={appointment}
                            />
                          </div>

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
                              {isRescheduling
                                ? t("rescheduling")
                                : t("reschedule")}
                            </Button>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </>
                )}

                {/* Mark as No Show */}
                {[
                  AppointmentStatus.BOOKED,
                  AppointmentStatus.CHECKED_IN,
                ].includes(currentStatus) && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <EyeNoneIcon className="size-4 mr-2" />
                        {t("mark_as_noshow")}
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t("mark_as_noshow")}
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
                              status: AppointmentStatus.NO_SHOW,
                              note: note,
                            })
                          }
                          className={cn(
                            buttonVariants({ variant: "destructive" }),
                          )}
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
                {appointment.status !== AppointmentStatus.IN_CONSULTATION && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <BanIcon className="size-4 mr-2" />
                        {t("cancel_appointment")}
                      </DropdownMenuItem>
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
                          className={cn(
                            buttonVariants({ variant: "destructive" }),
                          )}
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
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <BanIcon className="size-4 mr-2" />
                      {t("mark_as_entered_in_error")}
                    </DropdownMenuItem>
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
                          handleAppointmentCancel({
                            reason: "entered_in_error",
                          })
                        }
                        className={cn(
                          buttonVariants({ variant: "destructive" }),
                        )}
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
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
