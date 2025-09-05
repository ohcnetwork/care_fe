import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { AppointmentSlotPicker } from "@/pages/Appointments/components/AppointmentSlotPicker";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { TagConfig } from "@/types/emr/tagConfig/tagConfig";
import scheduleApi from "@/types/scheduling/scheduleApi";

import { DateSelection } from "./DateSelection";
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
    queryFn: query(scheduleApi.appointments.availableUsers, {
      pathParams: { facilityId },
    }),
  });
  const resource = resourcesQuery.data?.users.find((r) => r.id === resourceId);

  const [selectedSlotId, setSelectedSlotId] = useState<string>();
  const [selectedTags, setSelectedTags] = useState<TagConfig[]>([]);
  const [reason, setReason] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isDateSelected, setIsDateSelected] = useState(false);
  const { mutateAsync: createAppointment } = useMutation({
    mutationFn: mutate(scheduleApi.slots.createAppointment, {
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

  return (
    <div className="w-full">
      <div className="flex flex-row gap-4 justify-center">
        <FilterAppointment
          facilityId={facilityId}
          resource={resource}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          reason={reason}
          setReason={setReason}
          setResourceId={setResourceId}
        />
        <div className="hidden sm:flex flex-col xl:flex-row gap-6 bg-white shadow rounded-lg p-4 w-full">
          <DateSelection
            facilityId={facilityId}
            resourceId={resourceId ?? ""}
            setSelectedDate={setSelectedDate}
            selectedDate={selectedDate}
            setSelectedMonth={setSelectedMonth}
            selectedMonth={selectedMonth}
          />
          <AppointmentSlotPicker
            facilityId={facilityId}
            resourceId={resourceId}
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
      <Drawer>
        <DrawerTrigger asChild>
          <Button className="sm:hidden w-full" disabled={!resourceId}>
            {t("select_date")}
            <ArrowRight size={16} />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="w-full p-4 space-y-4">
          {!isDateSelected && (
            <>
              <DateSelection
                facilityId={facilityId}
                resourceId={resourceId ?? ""}
                setSelectedDate={setSelectedDate}
                selectedDate={selectedDate}
                setSelectedMonth={setSelectedMonth}
                selectedMonth={selectedMonth}
              />
              <Button
                className="w-full"
                disabled={!selectedDate}
                onClick={() => setIsDateSelected(true)}
              >
                {t("select_slot")}
                <ArrowRight size={16} />
              </Button>
            </>
          )}
          {selectedDate && isDateSelected && (
            <>
              <AppointmentSlotPicker
                facilityId={facilityId}
                resourceId={resourceId}
                selectedSlotId={selectedSlotId}
                onSlotSelect={setSelectedSlotId}
                selectedDate={selectedDate}
              />
              <div className="sm:hidden flex flex-row gap-2 items-center justify-around">
                <Button
                  variant="outline"
                  className="w-fit"
                  onClick={() => {
                    setIsDateSelected(false);
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
