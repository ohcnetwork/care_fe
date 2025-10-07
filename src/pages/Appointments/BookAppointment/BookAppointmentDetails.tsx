import {
  onlineManager,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";

import mutate from "@/Utils/request/mutate";
import { AppointmentSlotPicker } from "@/pages/Appointments/BookAppointment/AppointmentSlotPicker";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { TagConfig } from "@/types/emr/tagConfig/tagConfig";
import scheduleApi from "@/types/scheduling/scheduleApi";

import { AppCacheDB } from "@/OfflineSupport/AppcacheDB";
import { handleOfflineRecordSuccess } from "@/OfflineSupport/offlineWriteHelpers";
import { HTTPError } from "@/Utils/request/types";
import { queueNewAppointmentOffline } from "@/components/Appointment/offlineQueue";
import { ScheduleResourceFormState } from "@/components/Schedule/ResourceSelector";
import useAuthUser from "@/hooks/useAuthUser";
import { useOfflineEntry } from "@/hooks/useOfflineEntry";
import {
  Appointment,
  AppointmentCreateRequest,
  AppointmentRead,
  AppointmentStatus,
  SchedulableResourceType,
  ScheduleResource,
  TokenSlot,
} from "@/types/scheduling/schedule";
import { AppointmentDateSelection } from "./AppointmentDateSelection";
import { AppointmentFormSection } from "./AppointmentFormSection";

export const BookAppointmentDetails = ({
  patientId,
  onSuccess,
}: {
  patientId: string;
  onSuccess?: () => void;
}) => {
  const { t } = useTranslation();

  const authUser = useAuthUser();
  const queryClient = useQueryClient();
  const db = new AppCacheDB();
  const { offlineEntryId, offlineEntry } = useOfflineEntry();

  const { facilityId } = useCurrentFacility();

  const [OfflineSelectedSlot, setOfflineSelectedSlot] = useState<
    TokenSlot | undefined
  >();

  const [selectedSlotId, setSelectedSlotId] = useState<string>();
  const [selectedTags, setSelectedTags] = useState<TagConfig[]>([]);
  const [reason, setReason] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [selectedResource, setSelectedResource] =
    useState<ScheduleResourceFormState>({
      resource: null,
      resource_type: SchedulableResourceType.Practitioner,
    });

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

      if (normalizedData.booked_by) {
        setSelectedResource({
          resource: normalizedData.booked_by,
          resource_type: SchedulableResourceType.Practitioner,
        });
      }

      if (normalizedData.token_slot) {
        // Extract date from slot's start_datetime
        const slotDate = new Date(normalizedData.token_slot.start_datetime);
        setSelectedDate(slotDate);
        console.log("Setting offline slot:", normalizedData.token_slot.id);
        setOfflineSelectedSlot(normalizedData.token_slot);
        setSelectedSlotId(normalizedData.token_slot.id);
      }
    }
  }, [offlineEntry, offlineEntryId]);

  const handleOfflineQueue = async (
    appointmentRequestData: AppointmentCreateRequest,
  ) => {
    const status = AppointmentStatus.BOOKED;
    const slotMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1,
    );
    if (!selectedResource) {
      toast.error(t("missing_required_data_offline_booking"));
      return;
    }

    await queueNewAppointmentOffline({
      createAppointmentData: appointmentRequestData,
      selectedSlot: OfflineSelectedSlot,
      selectedResource: selectedResource as ScheduleResource,
      authUser,
      status,
      facilityId,
      patientId,
      selectedSlotId,
      selectedTags,
      selectedDate,
      slotMonth,
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
    mutationFn: mutate(scheduleApi.slots.createAppointment, {
      pathParams: { facilityId, slotId: selectedSlotId ?? "" },
    }),
    onSuccess: async (data: Appointment) => {
      if (offlineEntryId) {
        try {
          await handleOfflineRecordSuccess(offlineEntryId, data);
        } catch (error) {
          console.error(`Error handling offline record success:`, error);
          // Don't block the success flow, just log the error
          return;
        }
      }
      toast.success(t("appointment_created_successfully"));
      onSuccess?.();
      navigate(
        `/facility/${facilityId}/patient/${patientId}/appointments/${data.id}?showSuccess=true`,
      );
    },

    onError: async (error, variables) => {
      // If network error, push to offline queue
      if (error.message === "Network Error" && variables) {
        await handleOfflineQueue(variables);
        return;
      }
      toast.error(error.message);
    },
  });

  const handleSubmit = async () => {
    if (!selectedResource || !selectedSlotId) {
      return;
    }

    const createAppointmentData: AppointmentCreateRequest = {
      patient: patientId,
      note: reason,
      tags: selectedTags.map((tag) => tag.id),
    };

    if (!onlineManager.isOnline()) {
      await handleOfflineQueue(createAppointmentData);
      return;
    }

    await createAppointment({
      patient: patientId,
      note: reason,
      tags: selectedTags.map((tag) => tag.id),
    });
  };

  const handleIsOpen = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setCurrentStep(1);
      // setSelectedSlotId(undefined);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-row gap-4 justify-center">
        <div className="flex flex-col gap-8 p-4 w-114 bg-white shadow rounded-lg">
          <AppointmentFormSection
            facilityId={facilityId}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
            reason={reason}
            setReason={setReason}
            selectedResource={selectedResource}
            setSelectedResource={setSelectedResource}
          />
        </div>
        <div className="hidden sm:flex sm:flex-col lg:flex-row gap-6 bg-white shadow rounded-lg p-4 w-full sm:max-h-full">
          <AppointmentDateSelection
            facilityId={facilityId}
            resourceId={selectedResource.resource?.id}
            resourceType={selectedResource.resource_type}
            setSelectedDate={setSelectedDate}
            selectedDate={selectedDate}
          />
          <div className="w-full overflow-y-auto max-h-[calc(100vh-17rem)]">
            <AppointmentSlotPicker
              facilityId={facilityId}
              resourceId={selectedResource.resource?.id}
              resourceType={selectedResource.resource_type}
              selectedSlotId={selectedSlotId}
              onSlotSelect={setSelectedSlotId}
              onSlotDetailsChange={setOfflineSelectedSlot}
              selectedDate={selectedDate}
            />
          </div>
        </div>
      </div>
      {selectedSlotId && (
        <div className="hidden sm:flex p-4 shadow mt-2">
          <div className="flex gap-4 ml-auto">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                setSelectedSlotId("");
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              type="submit"
            >
              {t("confirm_appointment")}
            </Button>
          </div>
        </div>
      )}
      <Drawer open={isOpen} onOpenChange={handleIsOpen}>
        <DrawerTrigger asChild>
          <Button
            className="sm:hidden w-full mt-3"
            disabled={!selectedResource.resource?.id}
            onClick={() => {
              setIsOpen(true);
              setCurrentStep(1);
            }}
          >
            {t("select_date")}
            <ArrowRight size={16} />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="w-full p-4 space-y-4">
          <div className="flex flex-col gap-3 overflow-y-auto -mx-2">
            {currentStep === 1 && (
              <>
                <AppointmentDateSelection
                  facilityId={facilityId}
                  resourceId={selectedResource.resource?.id}
                  resourceType={selectedResource.resource_type}
                  setSelectedDate={setSelectedDate}
                  selectedDate={selectedDate}
                />
                <Button
                  className="w-full"
                  disabled={!selectedDate}
                  onClick={() => setCurrentStep(2)}
                >
                  {t("select_slot")}
                  <ArrowRight size={16} />
                </Button>
              </>
            )}
          </div>

          {currentStep === 2 && (
            <>
              <AppointmentSlotPicker
                facilityId={facilityId}
                resourceId={selectedResource.resource?.id}
                resourceType={selectedResource.resource_type}
                selectedSlotId={selectedSlotId}
                onSlotSelect={setSelectedSlotId}
                onSlotDetailsChange={setOfflineSelectedSlot}
                selectedDate={selectedDate}
              />
              <div className="sm:hidden flex flex-row gap-2 items-center justify-around">
                <Button
                  variant="outline"
                  className="w-fit"
                  onClick={() => {
                    setCurrentStep(1);
                    setSelectedSlotId(undefined);
                  }}
                >
                  <ArrowLeft />
                  {t("back")}
                </Button>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={!selectedSlotId}
                >
                  {t("confirm_appointment")}
                </Button>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};
