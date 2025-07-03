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
import {
  onlineManager,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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
  SheetTrigger,
} from "@/components/ui/sheet";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { AuthUserModel } from "@/components/Users/models";

import useAppHistory from "@/hooks/useAppHistory";
import useAuthUser from "@/hooks/useAuthUser";

import { getPermissions } from "@/common/Permissions";

import { AppCacheDB, OfflineWritesEntry } from "@/OfflineSupport/AppcacheDB";
import {
  isOfflineId,
  normalizeUserBase,
  saveOfflineWrite,
  updateSlotCacheAfterOfflineAppointment,
} from "@/OfflineSupport/offlineWriteHelpers";
import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  formatName,
  getMonthFromDate,
  getReadableDuration,
  saveElementAsImage,
  stringifyNestedObject,
} from "@/Utils/utils";
import { usePermissions } from "@/context/PermissionContext";
import { AppointmentTokenCard } from "@/pages/Appointments/components/AppointmentTokenCard";
import { PractitionerSelector } from "@/pages/Appointments/components/PractitionerSelector";
import { FacilityData } from "@/types/facility/facility";
import {
  APPOINTMENT_STATUS_COLORS,
  Appointment,
  AppointmentCancelledStatus,
  AppointmentFinalStatuses,
  AppointmentNonCancelledStatus,
  AppointmentUpdateRequest,
  TokenSlot,
} from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApi";
import { UserBase } from "@/types/user/user";

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
  const db = new AppCacheDB();
  const authUser = useAuthUser();
  const { data: facilityData, isLoading: isFacilityLoading } = useQuery({
    queryKey: ["facility", props.facilityId],
    queryFn: query(routes.getPermittedFacility, {
      pathParams: {
        id: props.facilityId,
      },
    }),
    meta: { persist: true },
    networkMode: "online",
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
    meta: { persist: true },
    networkMode: "online",
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

  const queueUpdateAppointmentRecordOffline = async (
    updateAppointmentData: any,
    appointment: Appointment,
    authUser: AuthUserModel,
    status: AppointmentNonCancelledStatus,
  ) => {
    const statusupdateId = isOfflineId(appointment.id)
      ? `${appointment.id}-statusUpdate`
      : `offline-${appointment.id}-statusUpdate`;

    const rescheduleId = isOfflineId(appointment.id)
      ? `${appointment.id}-reschedule`
      : `offline-${appointment.id}-reschedule`;

    const existingStatusEntry = await db.OfflineWrites.get(statusupdateId);
    const existingRescheduleEntry = await db.OfflineWrites.get(rescheduleId);

    const baseEntry = {
      id: statusupdateId,
      userId: authUser.external_id,
      mutationSyncrouteKey: "updateAppointment",
      mutationPathParams: {
        facility_id: appointment.facility.id,
        id: appointment.id,
      },
      type: "statusUpdate",
      resourceType: "Appointment",
      payload: updateAppointmentData,
      parentMutationIds: isOfflineId(appointment.id)
        ? [appointment.id] //   offline-created appointment
        : existingRescheduleEntry
          ? [rescheduleId] //  reschedule write exists and if we are updating status
          : [],

      serverTimestamp: appointment.modified_date,
    };

    const writeEntry = !isOfflineId(appointment.id)
      ? {
          ...baseEntry,
          serverTimestamp: appointment.modified_date, // only add  when we upating and an exisitng appointment as needed for conflict detection
          useQueryrouteKey: "retrieveAppointment",
          useQueryPathParams: {
            facility_id: appointment.facility.id,
            id: appointment.id,
          },
        }
      : baseEntry;

    try {
      if (existingStatusEntry) {
        await db.OfflineWrites.update(statusupdateId, writeEntry); //  correct variable
      } else {
        const saveResult = await saveOfflineWrite(writeEntry); //  used writeEntry here
        if (!saveResult.success) {
          toast.error(saveResult.error);
          return;
        }
      }

      // Update local cache immediately

      const updatedAppointment = {
        ...appointment,
        status,
        is_updated_offline: true,
      };
      queryClient.setQueryData(
        ["appointment", appointment.id],
        updatedAppointment,
      );

      const prevAppointmentList = queryClient.getQueryData<
        PaginatedResponse<Appointment>
      >(["patient-appointments", appointment.patient.id]);

      if (prevAppointmentList?.results?.length) {
        const updatedAppointmentList = {
          ...prevAppointmentList,
          results: prevAppointmentList.results.map((entry) =>
            entry.id === appointment.id ? updatedAppointment : entry,
          ),
        };

        queryClient.setQueryData(
          ["patient-appointments", appointment.patient.id],
          updatedAppointmentList,
        );
      }

      toast.success(`Appointment marked as ${status}`);
      if (status === "in_consultation") {
        redirectToPatientPage();
      }
    } catch (error) {
      console.error("Failed to queue status update:", error);
      toast.error("Failed to queue status update");
    }
  };

  const handleUpdateAppointment = async ({
    status,
  }: {
    status: Appointment["status"];
  }) => {
    if (!status || !appointment) {
      return;
    }

    if (!onlineManager.isOnline()) {
      queueUpdateAppointmentRecordOffline(
        { status },
        appointment,
        authUser,
        status,
      );
      return;
    }

    updateAppointment({ status });
  };

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
                    onChange={(status) => {
                      handleUpdateAppointment({ status });
                    }}
                    onViewPatient={redirectToPatientPage}
                    canCreateAppointment={canCreateAppointment}
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
            <Badge variant={APPOINTMENT_STATUS_COLORS[appointment.status]}>
              {t(appointment.status)}
            </Badge>
            {appointment.is_updated_offline === true && (
              <Badge
                variant="outline"
                className="ml-2 border-2 border-yellow-400 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:text-yellow-900"
              >
                {t("Pending_sync")}
              </Badge>
            )}
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
    </div>
  );
};

interface AppointmentActionsProps {
  facilityId: string;
  appointment: Appointment;
  onChange: (status: Appointment["status"]) => void;
  onViewPatient: () => void;
  canCreateAppointment: boolean;
  authUser: AuthUserModel;
  db: AppCacheDB;
}

const AppointmentActions = ({
  facilityId,
  appointment,
  onChange,
  onViewPatient,
  canCreateAppointment,
  authUser,
  db,
}: AppointmentActionsProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedMonthOffline, setSelectedMonthOffline] = useState(new Date());
  const [selectedDateOffline, setSelectedDateOffline] = useState(new Date());
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedPractitioner, setSelectedPractitioner] = useState(
    appointment.user,
  );
  const [selectedSlotId, setSelectedSlotId] = useState<string>();
  const [OfflineSelectedSlot, setOfflineSelectedSlot] = useState<
    TokenSlot | undefined
  >();
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

  const queueCancelAppointmentRecord = async (
    cancelAppointmentData: any,
    appointment: Appointment,
    authUser: AuthUserModel,
    status: AppointmentCancelledStatus,
  ) => {
    const cancelAppointmentID = isOfflineId(appointment.id)
      ? `${appointment.id}+cancel`
      : `offline-${appointment.id}-cancel`;

    const baseEntry = {
      id: cancelAppointmentID,
      userId: authUser?.external_id,
      mutationSyncrouteKey: "cancelAppointment",
      mutationPathParams: {
        facility_id: facilityId,
        id: appointment.id,
      },
      type: "cancelAppointment",
      resourceType: "Appointment",
      payload: cancelAppointmentData,
    };

    const offlineEntry = !isOfflineId(appointment.id)
      ? {
          ...baseEntry,
          serverTimestamp: appointment.modified_date,
          useQueryPathParams: {
            facility_id: appointment.facility.id,
            id: appointment.id,
          },
        }
      : baseEntry;

    const prevTokenSlot = appointment.token_slot; //prev slot
    const prevDate = new Date(appointment.token_slot.start_datetime); // previous date
    const prevMonth = getMonthFromDate(appointment.token_slot.start_datetime); // previous month

    if (isOfflineId(appointment.id)) {
      const existingCreateEntry = await db.OfflineWrites.get(appointment.id);
      if (existingCreateEntry?.type === "createAppointment") {
        await db.OfflineWrites.delete(appointment.id);
        queryClient.removeQueries({
          queryKey: ["appointment", appointment.id],
        });
        toast.success(t("unsynced_appointment_cancelled"));
      } else {
        toast.error(t("cannot_cancel_non_created_offline_appointment"));
      }
    } else {
      const saveResult = await saveOfflineWrite(offlineEntry);
      if (!saveResult.success) {
        toast.error(saveResult.error);
      }

      const updatedAppointment = {
        ...appointment,
        status,
        is_updated_offline: true,
      };
      queryClient.setQueryData(
        ["appointment", appointment.id],
        updatedAppointment,
      );

      const prevAppointmentList = queryClient.getQueryData<
        PaginatedResponse<Appointment>
      >(["patient-appointments", appointment.patient.id]);

      if (prevAppointmentList?.results?.length) {
        const updatedAppointmentList = {
          ...prevAppointmentList,
          results: prevAppointmentList.results.map((entry) =>
            entry.id === appointment.id ? updatedAppointment : entry,
          ),
        };

        queryClient.setQueryData(
          ["patient-appointments", appointment.patient.id],
          updatedAppointmentList,
        );
      }
    }
    const statusUpdateID = isOfflineId(appointment.id)
      ? `${appointment.id}-statusUpdate`
      : `offline-${appointment.id}-statusUpdate`;

    const rescheduleID = isOfflineId(appointment.id)
      ? `${appointment.id}+reschedule`
      : `offline-${appointment.id}-reschedule`;

    await Promise.allSettled([
      db.OfflineWrites.delete(statusUpdateID),
      db.OfflineWrites.delete(rescheduleID),
    ]);

    updateSlotCacheAfterOfflineAppointment({
      queryClient: queryClient,
      selectedPracticioner: appointment.user,
      facilityId: appointment.facility.id,
      action: "cancel",
      previousSlot: prevTokenSlot, //prev slot
      previousDate: prevDate, // previous date
      previousMonth: prevMonth, // previous month
    });
  };

  const handleAppointmentCancel = async ({
    reason,
  }: {
    reason: "cancelled" | "entered_in_error";
  }) => {
    if (!reason || !appointment) {
      return;
    }

    if (!onlineManager.isOnline()) {
      queueCancelAppointmentRecord(
        { reason: reason },
        appointment,
        authUser,
        reason,
      );
      return;
    }

    cancelAppointment({ reason: reason });
  };

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

  const queuerescheduleOfflineRecord = async (
    rescheduleAppointmentData: any,
    selectedSlot: TokenSlot | undefined,
    selectedPracticioner: UserBase,
    authUser: AuthUserModel,
    appointment: Appointment,
    db: AppCacheDB,
  ) => {
    if (!selectedSlot) {
      toast.error(t("slot_is_not_selected"));
      return;
    }
    if (!selectedPracticioner) {
      toast.error(t("practicioner_is_not_selected"));
      return;
    }
    try {
      const rescheduleID = isOfflineId(appointment.id)
        ? `${appointment.id}-reschedule`
        : `offline-${appointment.id}-reschedule`;
      const OfflineEntryExist = await db.OfflineWrites.get(rescheduleID);
      const createAppointmentExist = await db.OfflineWrites.get(appointment.id);

      if (
        createAppointmentExist &&
        createAppointmentExist.type === "createAppointment"
      ) {
        const prevMutationpathparams =
          createAppointmentExist.mutationPathParams;
        const updateEntry: OfflineWritesEntry = {
          ...createAppointmentExist,
          mutationPathParams: {
            ...prevMutationpathparams,
            slot_id: selectedSlot?.id,
          },
        };

        await db.OfflineWrites.update(createAppointmentExist.id, updateEntry);
      } else if (
        OfflineEntryExist &&
        OfflineEntryExist.type === "rescheduleAppointment"
      ) {
        const updateEntry: OfflineWritesEntry = {
          ...OfflineEntryExist,
          payload: rescheduleAppointmentData, // replaces the old payload
        };

        await db.OfflineWrites.update(OfflineEntryExist.id, updateEntry);
      } else {
        const offlineEntry = {
          id: rescheduleID,
          userId: authUser?.external_id,
          mutationSyncrouteKey: "rescheduleAppointment",
          mutationPathParams: {
            facility_id: facilityId,
            id: appointment.id,
          },
          type: "rescheduleAppointment",
          resourceType: "Appointment",
          payload: rescheduleAppointmentData,
          serverTimestamp: appointment.modified_date, // point to note : Although here we are changing  modified dat ehre for a appointment , It is correct for new appointment ,
          // But we have to ensure serverstamp store the value of modidfied data from last server-cache  not the value after we update appointment and change modified data during normalizing in some cases
          useQueryrouteKey: "retrieveAppointment",
          useQueryPathParams: {
            facility_id: appointment.facility.id,
            id: appointment.id,
          },
        };

        const saveResult = await saveOfflineWrite(offlineEntry);

        if (!saveResult.success) {
          toast.error(saveResult.error);
        }

        const updatedAppointment = {
          ...appointment,
          token_slot: selectedSlot,
          user: selectedPracticioner,
          status: "booked" as AppointmentNonCancelledStatus,
          booked_on: new Date().toISOString(),
          booked_by: normalizeUserBase(authUser),
          is_updated_offline: true,
        };

        const prevAppointmentList = queryClient.getQueryData<
          PaginatedResponse<Appointment>
        >(["patient-appointments", appointment.patient.id]);

        if (prevAppointmentList?.results?.length) {
          const updatedAppointmentList = {
            ...prevAppointmentList,
            results: prevAppointmentList.results.map((entry) =>
              entry.id === appointment.id ? updatedAppointment : entry,
            ),
          };

          queryClient.setQueryData(
            ["patient-appointments", appointment.patient.id],
            updatedAppointmentList,
          );
        }
      }

      const statusUpdateId = isOfflineId(appointment.id)
        ? `${appointment.id}-statusUpdate`
        : `offline-${appointment.id}-statusUpdate`;

      const existingStatusEntry = await db.OfflineWrites.get(statusUpdateId);

      if (existingStatusEntry && existingStatusEntry.type === "statusUpdate") {
        await db.OfflineWrites.delete(statusUpdateId);
      }

      updateSlotCacheAfterOfflineAppointment({
        queryClient: queryClient,
        selectedSlot: selectedSlot,
        selectedPracticioner: selectedPracticioner,
        facilityId: appointment.facility.id,
        selectedDate: selectedDateOffline,
        selectedMonth: selectedMonthOffline,
        action: "rescheduled",
        previousSlot: appointment.token_slot, //prev slot
        previousDate: new Date(appointment.token_slot.start_datetime), // previous date
        previousMonth: getMonthFromDate(appointment.token_slot.start_datetime), // previous month
      });

      const updatedCacheAppointment: Appointment = {
        ...appointment,
        token_slot: selectedSlot,
        user: selectedPracticioner,
        status: "booked" as AppointmentNonCancelledStatus,
        booked_on: new Date().toISOString(),
        booked_by: normalizeUserBase(authUser),
        is_updated_offline: true,
      };

      queryClient.setQueryData(
        ["appointment", appointment.id],
        updatedCacheAppointment,
      );

      toast.success(t("appointment_rescheduled"));
      setIsRescheduleOpen(false);
      setSelectedSlotId(undefined);
      setOfflineSelectedSlot(undefined);
      navigate(
        `/facility/${facilityId}/patient/${appointment.patient.id}/appointments/${appointment.id}`,
      );
    } catch (error) {
      console.error("Error while Reschudling Appointment", error);
      toast.error(t("error_while_Reschudling_Appointment"));
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!selectedSlotId) {
      toast.error(t("Please_select_toast"));
      return;
    }

    const rescheduleAppointmentData = { new_slot: selectedSlotId };

    if (!onlineManager.isOnline()) {
      await queuerescheduleOfflineRecord(
        rescheduleAppointmentData,
        OfflineSelectedSlot,
        selectedPractitioner,
        authUser,
        appointment,
        db,
      );
      return;
    }
    rescheduleAppointment(rescheduleAppointmentData);
  };

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
              <div className="my-4">
                <Label className="mb-2">{t("select_practitioner")}</Label>
                <PractitionerSelector
                  facilityId={facilityId}
                  selected={selectedPractitioner}
                  onSelect={(user) => user && setSelectedPractitioner(user)}
                  clearSelection={t("show_all")}
                />
              </div>
              <AppointmentSlotPicker
                facilityId={facilityId}
                resourceId={selectedPractitioner?.id}
                selectedSlotId={selectedSlotId}
                setOfflineSelectedSlot={setOfflineSelectedSlot}
                onSlotSelect={setSelectedSlotId}
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
                      handleRescheduleSubmit();
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
                onClick={() => handleAppointmentCancel({ reason: "cancelled" })}
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
  );
};
