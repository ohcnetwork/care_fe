import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";

import mutate from "@/Utils/request/mutate";
import { AppointmentSlotPicker } from "@/pages/Appointments/BookAppointment/AppointmentSlotPicker";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { TagConfig } from "@/types/emr/tagConfig/tagConfig";
import scheduleApi from "@/types/scheduling/scheduleApi";

import { ScheduleResourceFormState } from "@/components/Schedule/ResourceSelector";
import {
  Appointment,
  SchedulableResourceType,
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

  const { facilityId } = useCurrentFacility();

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
  const [selectedResourceType, setSelectedResourceType] =
    useState<SchedulableResourceType>(SchedulableResourceType.Practitioner);
  const { mutateAsync: createAppointment } = useMutation({
    mutationFn: mutate(scheduleApi.slots.createAppointment, {
      pathParams: { facilityId, slotId: selectedSlotId ?? "" },
    }),
    onSuccess: (data: Appointment) => {
      toast.success(t("appointment_created_successfully"));
      onSuccess?.();
      navigate(
        `/facility/${facilityId}/patient/${patientId}/appointments/${data.id}`,
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = async () => {
    if (!selectedResource || !selectedSlotId) {
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
      setSelectedResource({
        resource: null,
        resource_type: SchedulableResourceType.Practitioner,
      });
      setSelectedSlotId(undefined);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-row gap-4 justify-center">
        <AppointmentFormSection
          facilityId={facilityId}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          reason={reason}
          setReason={setReason}
          selectedResource={selectedResource}
          setSelectedResource={setSelectedResource}
          setSelectedResourceType={setSelectedResourceType}
          selectedResourceType={selectedResourceType}
        />
        <div className="hidden sm:flex sm:flex-col lg:flex-row gap-6 bg-white shadow rounded-lg p-4 w-full sm:max-h-full">
          <AppointmentDateSelection
            facilityId={facilityId}
            resourceId={selectedResource.resource?.id}
            resourceType={selectedResourceType}
            setSelectedDate={setSelectedDate}
            selectedDate={selectedDate}
          />
          <AppointmentSlotPicker
            facilityId={facilityId}
            resourceId={selectedResource.resource?.id}
            resourceType={selectedResourceType}
            selectedSlotId={selectedSlotId}
            onSlotSelect={setSelectedSlotId}
            selectedDate={selectedDate}
          />
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
            className="sm:hidden w-full"
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
          {currentStep === 1 && (
            <>
              <AppointmentDateSelection
                facilityId={facilityId}
                resourceId={selectedResource.resource?.id}
                resourceType={selectedResourceType}
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
          {currentStep === 2 && (
            <>
              <AppointmentSlotPicker
                facilityId={facilityId}
                resourceId={selectedResource.resource?.id}
                resourceType={selectedResourceType}
                selectedSlotId={selectedSlotId}
                onSlotSelect={setSelectedSlotId}
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
