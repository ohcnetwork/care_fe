import {
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
import { Badge, BadgeProps } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";

import useAppHistory from "@/hooks/useAppHistory";

import { getPermissions } from "@/common/Permissions";

import routes from "@/Utils/request/api";
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
import { FacilityData } from "@/types/facility/facility";
import {
  Appointment,
  AppointmentFinalStatuses,
  AppointmentUpdateRequest,
} from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApi";

import { AppointmentSlotPicker } from "./components/AppointmentSlotPicker";

interface Props {
  facilityId: string;
  appointmentId: string;
}

export default function AppointmentDetail(props: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const { goBack } = useAppHistory();

  const { data: facilityData, isLoading: isFacilityLoading } = useQuery({
    queryKey: ["facility", props.facilityId],
    queryFn: query(routes.getPermittedFacility, {
      pathParams: {
        id: props.facilityId,
      },
    }),
  });

  const { canViewAppointments, canUpdateAppointment, canCreateAppointment } =
    getPermissions(hasPermission, facilityData?.permissions ?? []);

  const { data: appointment } = useQuery({
    queryKey: ["appointment", props.appointmentId],
    queryFn: query(scheduleApis.appointments.retrieve, {
      pathParams: {
        facility_id: props.facilityId,
        id: props.appointmentId,
      },
    }),
    enabled: canViewAppointments,
  });

  const redirectToPatientPage = () => {
    navigate(`/facility/${props.facilityId}/patients/verify`, {
      query: {
        phone_number: patient.phone_number,
        year_of_birth: patient.year_of_birth,
        partial_id: patient.id.slice(0, 5),
      },
    });
  };

  useEffect(() => {
    if (!canViewAppointments && !isFacilityLoading) {
      toast.error(t("no_permission_to_view_page"));
      goBack(`/facility/${props.facilityId}/overview`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewAppointments, isFacilityLoading]);

  const { mutate: updateAppointment, isPending } = useMutation<
    Appointment,
    unknown,
    AppointmentUpdateRequest
  >({
    mutationFn: mutate(scheduleApis.appointments.update, {
      pathParams: {
        facility_id: props.facilityId,
        id: props.appointmentId,
      },
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

  if (!facilityData || !appointment) {
    return <Loading />;
  }

  const { patient } = appointment;

  return (
    <Page title={t("appointment_details")}>
      <div className="container mx-auto p-6 max-w-7xl">
        <div
          className={cn(
            "flex flex-col md:flex-col lg:flex-row",
            isPending && "opacity-50 pointer-events-none animate-pulse",
          )}
        >
          <AppointmentDetails
            appointment={appointment}
            facility={facilityData}
          />
          <div className="mt-3">
            <div id="section-to-print" className="print:w-[400px] print:pt-4">
              <div id="appointment-token-card" className="bg-gray-50 md:p-4">
                <AppointmentTokenCard
                  appointment={appointment}
                  facility={facilityData}
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
                    facilityId={props.facilityId}
                    appointment={appointment}
                    onChange={(status) => updateAppointment({ status })}
                    onViewPatient={redirectToPatientPage}
                    canCreateAppointment={canCreateAppointment}
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
  appointment: Appointment;
  facility: FacilityData;
}) => {
  const { user } = appointment;
  const { t } = useTranslation();

  return (
    <div className="container md:p-6 max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="mr-3 inline-block mb-2">
              {t("schedule_information")}
            </span>
            <Badge
              variant={
                (
                  {
                    booked: "secondary",
                    checked_in: "primary",
                    in_consultation: "primary",
                    pending: "secondary",
                    arrived: "primary",
                    fulfilled: "primary",
                    entered_in_error: "destructive",
                    cancelled: "destructive",
                    rescheduled: "secondary",
                    noshow: "destructive",
                  } as Partial<
                    Record<Appointment["status"], BadgeProps["variant"]>
                  >
                )[appointment.status] ?? "outline"
              }
            >
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
          <Separator />
          <div className="text-sm">
            <p className="font-medium">{t("reason_for_visit")}</p>
            <p className="text-gray-600">
              {appointment.reason_for_visit || t("no_reason_provided")}
            </p>
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

      <div className="text-sm text-gray-600">
        {t("booked_by")} {appointment.booked_by?.first_name}{" "}
        {appointment.booked_by?.last_name} {t("on")}{" "}
        {format(appointment.booked_on, "MMMM d, yyyy 'at' h:mm a")}
      </div>
    </div>
  );
};

interface AppointmentActionsProps {
  facilityId: string;
  appointment: Appointment;
  onChange: (status: Appointment["status"]) => void;
  onViewPatient: () => void;
  canCreateAppointment: boolean;
}

const AppointmentActions = ({
  facilityId,
  appointment,
  onChange,
  onViewPatient,
  canCreateAppointment,
}: AppointmentActionsProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string>();

  const currentStatus = appointment.status;
  const isToday = isSameDay(appointment.token_slot.start_datetime, new Date());

  const { mutate: cancelAppointment, isPending: isCancelling } = useMutation({
    mutationFn: mutate(scheduleApis.appointments.cancel, {
      pathParams: {
        facility_id: facilityId,
        id: appointment.id,
      },
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
        pathParams: {
          facility_id: facilityId,
          id: appointment.id,
        },
      }),
      onSuccess: (newAppointment: Appointment) => {
        toast.success(t("appointment_rescheduled"));
        queryClient.invalidateQueries({
          queryKey: ["appointment", appointment.id],
        });
        setIsRescheduleOpen(false);
        setSelectedSlotId(undefined);
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
        <Sheet open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
          <SheetTrigger asChild>
            {appointment.status !== "in_consultation" && (
              <Button variant="outline" size="lg">
                <CalendarIcon className="size-4 mr-2" />
                {t("reschedule")}
              </Button>
            )}
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{t("reschedule_appointment")}</SheetTitle>
            </SheetHeader>

            <div className="mt-6">
              <AppointmentSlotPicker
                facilityId={facilityId}
                resourceId={appointment.user?.id}
                selectedSlotId={selectedSlotId}
                onSlotSelect={setSelectedSlotId}
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
                      rescheduleAppointment({ new_slot: selectedSlotId });
                    }
                  }}
                >
                  {isRescheduling ? t("rescheduling") : t("reschedule")}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {currentStatus === "booked" && (
        <>
          <Button
            disabled={!isToday}
            variant="outline_primary"
            onClick={() => onChange("checked_in")}
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
          onClick={() => onChange("in_consultation")}
          size="lg"
        >
          <PlusCircledIcon className="size-4 mr-2" />
          {t("start_consultation")}
        </Button>
      )}

      {currentStatus === "in_consultation" && (
        <Button
          disabled={!isToday}
          variant="outline_primary"
          onClick={() => onChange("fulfilled")}
          size="lg"
        >
          <CheckCircledIcon className="size-4 mr-2" />
          {t("mark_as_fulfilled")}
        </Button>
      )}

      {["booked", "checked_in"].includes(currentStatus) && (
        <Button variant="outline" onClick={() => onChange("noshow")} size="lg">
          <EyeNoneIcon className="size-4 mr-2" />
          {t("mark_as_noshow")}
        </Button>
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
              <AlertDialogDescription>
                <Alert variant="destructive" className="mt-4">
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
                onClick={() => cancelAppointment({ reason: "cancelled" })}
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
