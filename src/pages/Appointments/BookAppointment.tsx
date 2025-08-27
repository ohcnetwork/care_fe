import {
  onlineManager,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { queueNewAppointmentOffline } from "@/components/Appointment/offlineQueue";
import Page from "@/components/Common/Page";
import { TagSelectorPopover } from "@/components/Tags/TagAssignmentSheet";

import useAppHistory from "@/hooks/useAppHistory";
import useAuthUser from "@/hooks/useAuthUser";
import { useOfflineEntry } from "@/hooks/useOfflineEntry";

import { AppCacheDB } from "@/OfflineSupport/AppcacheDB";
import { handleOfflineRecordSuccess } from "@/OfflineSupport/offlineWriteHelpers";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { HTTPError } from "@/Utils/request/types";
import { PractitionerSelector } from "@/pages/Appointments/components/PractitionerSelector";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import {
  Appointment,
  AppointmentCreateRequest,
  AppointmentRead,
  TokenSlot,
} from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApi";
import { UserReadMinimal } from "@/types/user/user";

import { AppointmentSlotPicker } from "./components/AppointmentSlotPicker";

interface Props {
  patientId: string;
}

export default function BookAppointment({ patientId }: Props) {
  const { t } = useTranslation();
  const { goBack } = useAppHistory();

  const authUser = useAuthUser();
  const queryClient = useQueryClient();
  const db = new AppCacheDB();
  const { offlineEntryId, offlineEntry } = useOfflineEntry();

  const [selectedPracticioner, setSelectedPracticioner] =
    useState<UserReadMinimal | null>(null);
  const [OfflineSelectedSlot, setOfflineSelectedSlot] = useState<
    TokenSlot | undefined
  >();
  const [selectedMonthOffline, setSelectedMonthOffline] = useState(new Date());
  const [selectedDateOffline, setSelectedDateOffline] = useState(new Date());

  const { facilityId } = useCurrentFacility();

  const [resourceId, setResourceId] = useState<string>();
  const [selectedSlotId, setSelectedSlotId] = useState<string>();
  const [selectedTags, setSelectedTags] = useState<TagConfig[]>([]);
  const [reason, setReason] = useState("");

  const resourcesQuery = useQuery({
    queryKey: ["practitioners", facilityId],
    queryFn: query(scheduleApis.appointments.availableUsers, {
      pathParams: { facilityId },
    }),
    meta: { persist: true },
    networkMode: "online",
  });
  const resource = resourcesQuery.data?.users.find((r) => r.id === resourceId);

  useEffect(() => {
    const users = resourcesQuery.data?.users;
    if (!users) {
      return;
    }

    if (users.length === 1) {
      setResourceId(users[0].id);
      setSelectedPracticioner(users[0]);
    }

    if (users.length === 0) {
      toast.error(t("no_practitioners_found"));
    }
  }, [resourcesQuery.data?.users]);

  // Populate form with offline data when available
  useEffect(() => {
    if (offlineEntry?.normalizedData) {
      const normalizedData = offlineEntry.normalizedData as AppointmentRead;

      if (normalizedData.tags && normalizedData.tags.length > 0) {
        setSelectedTags(normalizedData.tags);
      }

      if (normalizedData.note) {
        setReason(normalizedData.note);
      }

      if (normalizedData.user) {
        setSelectedPracticioner(normalizedData.user);
        setResourceId(normalizedData.user.id);
      }

      if (normalizedData.token_slot) {
        setOfflineSelectedSlot(normalizedData.token_slot);
        setSelectedSlotId(normalizedData.token_slot.id);

        // Extract date from slot's start_datetime
        const slotDate = new Date(normalizedData.token_slot.start_datetime);
        setSelectedDateOffline(slotDate);

        // Set month to the month containing the slot date
        const slotMonth = new Date(
          slotDate.getFullYear(),
          slotDate.getMonth(),
          1,
        );
        setSelectedMonthOffline(slotMonth);
      }
    }
  }, [offlineEntry, offlineEntryId]);

  const handleOfflineQueue = async (
    appointmentRequestData: AppointmentCreateRequest,
  ) => {
    const status = "booked";
    await queueNewAppointmentOffline({
      createAppointmentData: appointmentRequestData,
      selectedSlot: OfflineSelectedSlot,
      selectedPracticioner,
      authUser,
      status,
      facilityId,
      patientId,
      selectedSlotId,
      selectedTags,
      selectedDateOffline,
      selectedMonthOffline,
      queryClient,
      db,
      t,
      onSuccess: (appointmentId, _normalizedAppointment) => {
        toast.success(t("appointment_booking_success"));
        navigate(
          `/facility/${facilityId}/patient/${patientId}/appointments/${appointmentId}`,
        );
      },
      onError: (error) => {
        console.error("Error while scheduling appointment", error);
        toast.error(t("unexpected_error_while_booking_appointment"));
      },
    });
  };

  const { mutateAsync: createAppointment } = useMutation<
    Appointment,
    HTTPError,
    AppointmentCreateRequest
  >({
    mutationFn: mutate(scheduleApis.slots.createAppointment, {
      pathParams: { facilityId, slotId: selectedSlotId ?? "" },
    }),
    networkMode: "always",
    onSuccess: async (resp: Appointment) => {
      if (offlineEntryId) {
        await handleOfflineRecordSuccess(offlineEntryId, resp);
      }
    },

    onError: async (error, variables) => {
      // If network error, mark offline and push to offline queue
      if (error.message === "Network Error" && variables) {
        onlineManager.setOnline(false);
        await handleOfflineQueue(variables);
        return;
      }
    },
  });

  const handleSubmit = async () => {
    if (!resourceId) {
      toast.error(t("practicioner_is_not_selected"));
      return;
    }
    if (!selectedSlotId) {
      toast.error(t("slot_is_not_selected"));
      return;
    }

    try {
      const createAppointmentData: AppointmentCreateRequest = {
        patient: patientId,
        note: reason,
        tags: selectedTags.map((tag) => tag.id),
      };

      if (!onlineManager.isOnline()) {
        await handleOfflineQueue(createAppointmentData);
        return;
      }

      const data = await createAppointment(createAppointmentData);

      toast.success("Appointment created successfully");
      navigate(
        `/facility/${facilityId}/patient/${patientId}/appointments/${data.id}`,
      );
    } catch {
      toast.error(t("failed_to_create_appointment"));
    }
  };

  return (
    <Page title={t("book_appointment")}>
      <hr className="mt-6 mb-8 border-gray-200" />
      <div className="container mx-auto p-4 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-lg font-bold mb-2">{t("book_appointment")}</h1>
        </div>

        <div className="space-y-8">
          <div className="max-w-md">
            <Label className="mb-2">{t("tags")}</Label>
            <TagSelectorPopover
              selected={selectedTags}
              onChange={setSelectedTags}
              resource={TagResource.APPOINTMENT}
            />
          </div>
          <div className="max-w-md">
            <Label className="mb-2">{t("note")}</Label>
            <Textarea
              placeholder={t("appointment_note")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2">
            <div>
              <Label className="block mb-2">{t("select_practitioner")}</Label>
              <PractitionerSelector
                facilityId={facilityId}
                selected={resource ?? null}
                onSelect={(user) => {
                  if (user) {
                    setResourceId(user.id);
                    setSelectedPracticioner(user ?? null);
                  }
                }}
              />
            </div>
          </div>

          <div
            className={cn(
              "grid grid-cols-1 lg:grid-cols-2 gap-12",
              !resourceId && "opacity-50 pointer-events-none",
            )}
          >
            <AppointmentSlotPicker
              facilityId={facilityId}
              resourceId={resourceId}
              selectedSlotId={selectedSlotId}
              onSlotSelect={setSelectedSlotId}
              setOfflineSelectedSlot={setOfflineSelectedSlot}
              setSelectedMonthOffline={setSelectedMonthOffline}
              setSelectedDateOffline={setSelectedDateOffline}
              selectedDateOffline={selectedDateOffline}
              selectedMonthOffline={selectedMonthOffline}
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              type="button"
              onClick={() =>
                goBack(
                  `/facility/${facilityId}/patient/${patientId}/appointments`,
                )
              }
            >
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={!selectedSlotId}
              onClick={handleSubmit}
            >
              {t("schedule_appointment")}
            </Button>
          </div>
        </div>
      </div>
    </Page>
  );
}
