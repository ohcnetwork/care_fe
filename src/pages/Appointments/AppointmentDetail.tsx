import {
  AvatarIcon,
  CalendarIcon,
  CheckCircledIcon,
  ClockIcon,
  DownloadIcon,
  DrawingPinIcon,
  EnterIcon,
  EyeNoneIcon,
  MobileIcon,
  PersonIcon,
  PlusCircledIcon,
} from "@radix-ui/react-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { differenceInYears, format, isSameDay } from "date-fns";
import { BanIcon, Loader2, PrinterIcon } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import TagAssignmentSheet from "@/components/Tags/TagAssignmentSheet";

import useAppHistory from "@/hooks/useAppHistory";

import { getPermissions } from "@/common/Permissions";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
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
import { getTagHierarchyDisplay } from "@/types/emr/tagConfig/tagConfig";
import { FacilityData } from "@/types/facility/facility";
import {
  APPOINTMENT_STATUS_COLORS,
  Appointment,
  AppointmentFinalStatuses,
  AppointmentRead,
  AppointmentUpdateRequest,
} from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApi";

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
    enabled: canViewAppointments && !!facility,
  });

  const redirectToPatientPage = () => {
    navigate(`/facility/${facility?.id}/patients/verify`, {
      query: {
        phone_number: patient.phone_number,
        year_of_birth: patient.year_of_birth,
        partial_id: patient.id.slice(0, 5),
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
    unknown,
    AppointmentUpdateRequest
  >({
    mutationFn: mutate(scheduleApis.appointments.update, {
      pathParams: { facilityId, id: props.appointmentId },
    }),
    onSuccess: (_, request) => {
      queryClient.invalidateQueries({
        queryKey: ["appointment", props.appointmentId],
      });
      if (request.status === "in_consultation") {
        redirectToPatientPage();
      }
    },
  });

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
            {canUpdateAppointment && (
              <>
                <Separator className="my-4" />
                <div className="md:mx-6 mt-10">
                  <AppointmentActions
                    facilityId={facilityId}
                    appointment={appointment}
                    updateAppointment={updateAppointment}
                    onViewPatient={redirectToPatientPage}
                    canCreateAppointment={canCreateAppointment}
                    isUpdating={isUpdating}
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
  facility: FacilityData;
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
          <div className="flex items-center space-x-4 text-sm">
            <DrawingPinIcon className="size-5 text-gray-600" />
            <div>
              <p className="font-medium">
                {appointment.patient.address || t("no_address_provided")}
              </p>
              <p className="text-gray-600">
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
              <p className="text-gray-600">{user.email}</p>
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
  updateAppointment: (data: AppointmentUpdateRequest) => void;
  onViewPatient: () => void;
  canCreateAppointment: boolean;
  isUpdating: boolean;
}

const AppointmentActions = ({
  facilityId,
  appointment,
  updateAppointment,
  onViewPatient,
  canCreateAppointment,
  isUpdating,
}: AppointmentActionsProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isRescheduleReasonOpen, setIsRescheduleReasonOpen] = useState(false);
  const [newNote, setNewVisitReason] = useState(appointment.note);
  const [oldNote, setRescheduleReason] = useState(appointment.note);
  const [selectedPractitioner, setSelectedPractitioner] = useState(
    appointment.user,
  );
  const [selectedSlotId, setSelectedSlotId] = useState<string>();

  const currentStatus = appointment.status;
  const isToday = isSameDay(appointment.token_slot.start_datetime, new Date());
  const [note, setNote] = useState(appointment.note);

  const { mutate: cancelAppointment, isPending: isCancelling } = useMutation({
    mutationFn: mutate(scheduleApis.appointments.cancel, {
      pathParams: { facilityId, id: appointment.id },
    }),
    onSuccess: () => {
      toast.success(t("appointment_cancelled"));
      queryClient.invalidateQueries({
        queryKey: ["appointment", appointment.id],
      });
    },
  });

  const { mutate: rescheduleAppointment, isPending: isRescheduling } =
    useMutation({
      mutationFn: mutate(scheduleApis.appointments.reschedule, {
        pathParams: { facilityId, id: appointment.id },
      }),
      onSuccess: (newAppointment: Appointment) => {
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
    });

  if (AppointmentFinalStatuses.includes(currentStatus)) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 w-full md:w-64 mx-auto">
      <Button variant="outline" onClick={onViewPatient} size="lg">
        <PersonIcon className="size-4 mr-2" />
        {t("view_patient")}
      </Button>

      {canCreateAppointment && (
        <>
          <AlertDialog
            open={isRescheduleReasonOpen}
            onOpenChange={setIsRescheduleReasonOpen}
          >
            <AlertDialogTrigger asChild>
              {appointment.status !== "in_consultation" && (
                <Button variant="outline" size="lg">
                  <CalendarIcon className="size-4 mr-2" />
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
                  placeholder={t("reason_for_reschedule_placeholder")}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                />
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
                  disabled={!oldNote}
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
                        rescheduleAppointment({
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
        </>
      )}

      {currentStatus === "booked" && (
        <>
          <Button
            disabled={!isToday}
            variant="outline_primary"
            onClick={() => updateAppointment({ status: "checked_in" })}
            size="lg"
          >
            <EnterIcon className="size-4 mr-2" />
            {t("check_in")}
          </Button>
        </>
      )}

      {["booked", "checked_in"].includes(currentStatus) && (
        <Button
          disabled={!isToday}
          variant={
            currentStatus === "checked_in" ? "outline_primary" : "outline"
          }
          onClick={() => updateAppointment({ status: "in_consultation" })}
          size="lg"
        >
          <PlusCircledIcon className="size-4 mr-2" />
          {t("start_consultation")}
        </Button>
      )}

      {currentStatus === "in_consultation" && (
        <Button
          variant="outline_primary"
          onClick={() => updateAppointment({ status: "fulfilled" })}
          size="lg"
        >
          <CheckCircledIcon className="size-4 mr-2" />
          {t("mark_as_fulfilled")}
        </Button>
      )}

      {["booked", "checked_in"].includes(currentStatus) && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="lg">
              <EyeNoneIcon className="size-4 mr-2" />
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
                  updateAppointment({
                    status: "noshow",
                    note: note,
                  })
                }
                className={cn(buttonVariants({ variant: "destructive" }))}
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

      {appointment.status !== "in_consultation" && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="lg">
              <BanIcon className="size-4 mr-2" />
              {t("cancel_appointment")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("cancel_appointment")}</AlertDialogTitle>
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
                  cancelAppointment({
                    reason: "cancelled",
                    note: note,
                  })
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
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="lg">
            <BanIcon className="size-4 mr-2" />
            {t("mark_as_entered_in_error")}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("mark_as_entered_in_error")}</AlertDialogTitle>
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
              onClick={() => cancelAppointment({ reason: "entered_in_error" })}
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
  );
};
