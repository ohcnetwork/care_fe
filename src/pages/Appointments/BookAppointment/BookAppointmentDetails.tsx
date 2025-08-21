import { useMutation, useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import useAppHistory from "@/hooks/useAppHistory";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { AppointmentSlotPicker } from "@/pages/Appointments/components/AppointmentSlotPicker";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { TagConfig } from "@/types/emr/tagConfig/tagConfig";
import { TokenSlot } from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApi";
import scheduleApi from "@/types/scheduling/scheduleApi";

import { FilterAppointment } from "./FilterAppointment";

export const BookAppointmentDetails = ({
  patientId,
}: {
  patientId: string;
}) => {
  const { t } = useTranslation();
  const [resourceId, setResourceId] = useState<string>();

  const { facilityId } = useCurrentFacility();
  const resourcesQuery = useQuery({
    queryKey: ["practitioners", facilityId],
    queryFn: query(scheduleApis.appointments.availableUsers, {
      pathParams: { facilityId },
    }),
  });
  const resource = resourcesQuery.data?.users.find((r) => r.id === resourceId);
  const { goBack } = useAppHistory();

  const [selectedSlotId, setSelectedSlotId] = useState<string>();
  const [selectedTags, setSelectedTags] = useState<TagConfig[]>([]);
  const [reason, setReason] = useState("");
  const [slotDetails, setSlotDetails] = useState<TokenSlot>();

  const { mutateAsync: createAppointment } = useMutation({
    mutationFn: mutate(scheduleApis.slots.createAppointment, {
      pathParams: { facilityId, slotId: selectedSlotId ?? "" },
    }),
  });

  const handleSubmit = async () => {
    if (!resourceId) {
      toast.error("Please select a practitioner");
      return;
    }
    if (!selectedSlotId) {
      toast.error("Please select a slot");
      return;
    }

    try {
      const data = await createAppointment({
        patient: patientId,
        note: reason,
        tags: selectedTags.map((tag) => tag.id),
      });
      toast.success("Appointment created successfully");
      navigate(
        `/facility/${facilityId}/patient/${patientId}/appointments/${data.id}`,
      );
    } catch {
      toast.error("Failed to create appointment");
    }
  };

  useEffect(() => {
    const users = resourcesQuery.data?.users;
    if (!users) {
      return;
    }

    if (users.length === 1) {
      setResourceId(users[0].id);
    }

    if (users.length === 0) {
      toast.error(t("no_practitioners_found"));
    }
  }, [resourcesQuery.data?.users]);

  const { data: appointments } = useQuery({
    queryKey: ["book-appointment", patientId],
    queryFn: query(scheduleApi.appointments.list, {
      pathParams: { facilityId: facilityId },
      queryParams: {
        patient: patientId,
        limit: 100,
      },
    }),
  });

  let hasOverlappingSlots;
  if (slotDetails) {
    hasOverlappingSlots = appointments?.results.some(
      (appointment) =>
        appointment.token_slot.start_datetime <= slotDetails?.end_datetime &&
        appointment.token_slot.end_datetime >= slotDetails?.start_datetime,
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex flex-row gap-4">
        <FilterAppointment
          facilityId={facilityId}
          resource={resource}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          reason={reason}
          setReason={setReason}
          setResourceId={setResourceId}
        />
        <div
          className={cn(
            "container flex flex-col md:flex-row gap-6 bg-white shadow rounded-lg p-4 w-full",
            !resourceId && "opacity-50 pointer-events-none",
          )}
        >
          <AppointmentSlotPicker
            facilityId={facilityId}
            resourceId={resourceId}
            selectedSlotId={selectedSlotId}
            onSlotSelect={setSelectedSlotId}
            onSlotDetailsChange={setSlotDetails}
          />
        </div>
      </div>
      {selectedSlotId &&
        (hasOverlappingSlots ? (
          <ClashAlert />
        ) : (
          <div className="flex justify-end p-4">
            <div className="flex gap-4">
              <Button
                variant="outline"
                size="sm"
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
                size="sm"
                onClick={handleSubmit}
                type="submit"
              >
                {t("confirm_appointment")}
              </Button>
            </div>
          </div>
        ))}
    </div>
  );
};

const ClashAlert = () => {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm"></Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="size-40 rounded-md shadow">Timing Clash Alert</div>
      </PopoverContent>
    </Popover>
  );
};
