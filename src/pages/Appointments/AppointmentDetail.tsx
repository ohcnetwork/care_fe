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
import { BanIcon, PrinterIcon } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { FacilityModel } from "@/components/Facility/models";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  formatName,
  getReadableDuration,
  saveElementAsImage,
} from "@/Utils/utils";
import { AppointmentTokenCard } from "@/pages/Appointments/components/AppointmentTokenCard";
import {
  formatAppointmentSlotTime,
  printAppointment,
} from "@/pages/Appointments/utils";
import {
  Appointment,
  AppointmentStatuses,
  AppointmentUpdateRequest,
} from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApis";

interface Props {
  facilityId: string;
  appointmentId: string;
}

export default function AppointmentDetail(props: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const facilityQuery = useQuery({
    queryKey: ["facility", props.facilityId],
    queryFn: query(routes.getPermittedFacility, {
      pathParams: {
        id: props.facilityId,
      },
    }),
  });

  const appointmentQuery = useQuery({
    queryKey: ["appointment", props.appointmentId],
    queryFn: query(scheduleApis.appointments.retrieve, {
      pathParams: {
        facility_id: props.facilityId,
        id: props.appointmentId,
      },
    }),
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

  const appointment = appointmentQuery.data;
  const facility = facilityQuery.data;

  if (!facility || !appointment) {
    return <Loading />;
  }

  const { patient } = appointment;
  const appointmentDate = formatAppointmentSlotTime(appointment);

  return (
    <Page
      title={t("appointment_details")}
      crumbsReplacements={{
        [facility.id!]: { name: facility.name },
        [patient.id]: { name: patient.name },
        [appointment.id]: { name: `Appointment on ${appointmentDate}` },
      }}
    >
      <div className="container mx-auto p-6 max-w-7xl">
        <div
          className={cn(
            "flex flex-col md:flex-row",
            isPending && "opacity-50 pointer-events-none animate-pulse",
          )}
        >
          <AppointmentDetails
            appointment={appointmentQuery.data}
            facility={facilityQuery.data}
          />
          <div className="mt-3">
            <div id="appointment-token-card" className="bg-gray-50 p-4">
              <AppointmentTokenCard
                appointment={appointmentQuery.data}
                facility={facilityQuery.data}
              />
            </div>
            <div className="flex gap-2 justify-end px-6">
              <Button
                variant="outline"
                onClick={() => printAppointment({ t, facility, appointment })}
              >
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
            <Separator className="my-4" />
            <div className="mx-6 mt-10">
              <AppointmentActions
                facilityId={props.facilityId}
                appointment={appointment}
                onChange={(status) => updateAppointment({ status })}
                onViewPatient={redirectToPatientPage}
              />
            </div>
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
  facility: FacilityModel;
}) => {
  const { patient, user } = appointment;
  const { t } = useTranslation();

  return (
    <div className="container p-6 max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="mr-3">{t("schedule_information")}</span>
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
            <CalendarIcon className="h-5 w-5 text-gray-600" />
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
            <ClockIcon className="h-5 w-5 text-gray-600" />
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
            <PersonIcon className="h-5 w-5 text-gray-600" />
            <div>
              <p className="font-medium">{appointment.patient.name}</p>
              <p className="text-gray-600">
                {appointment.patient.date_of_birth && (
                  <>
                    {format(appointment.patient.date_of_birth, "MMMM d, yyyy")}{" "}
                    {differenceInYears(
                      new Date(),
                      appointment.patient.date_of_birth!,
                    )}
                  </>
                )}
                {appointment.patient.year_of_birth && (
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
            <MobileIcon className="h-5 w-5 text-gray-600" />
            <div>
              <p className="font-medium">{appointment.patient.phone_number}</p>
              <p className="text-gray-600">
                {t("emergency")}: {appointment.patient.emergency_phone_number}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <DrawingPinIcon className="h-5 w-5 text-gray-600" />
            <div>
              <p className="font-medium">
                {appointment.patient.address || t("no_address_provided")}
              </p>
              <p className="text-gray-600">
                {[
                  patient.ward,
                  patient.local_body,
                  patient.district,
                  patient.state,
                ]
                  .filter(Boolean)
                  .join(", ")}
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
}

const AppointmentActions = ({
  facilityId,
  appointment,
  onChange,
  onViewPatient,
}: AppointmentActionsProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const currentStatus = appointment.status;
  const isToday = isSameDay(appointment.token_slot.start_datetime, new Date());

  const { mutate: cancelAppointment } = useMutation({
    mutationFn: mutate(scheduleApis.appointments.cancel, {
      pathParams: {
        facility_id: facilityId,
        id: appointment.id,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["appointment", appointment.id],
      });
    },
  });

  if (["fulfilled", "cancelled", "entered_in_error"].includes(currentStatus)) {
    return null;
  }

  if (!["booked", "checked_in", "in_consultation"].includes(currentStatus)) {
    return (
      <div className="w-48">
        <Label className="mb-2">{t("change_status")}</Label>
        <Select
          value={currentStatus}
          onValueChange={(value) => onChange(value as Appointment["status"])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AppointmentStatuses.map((status) => (
              <SelectItem value={status}>{t(status)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-64 mx-auto">
      <Button variant="outline" onClick={onViewPatient} size="lg">
        <PersonIcon className="size-4 mr-2" />
        {t("view_patient")}
      </Button>
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
            >
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            >
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
