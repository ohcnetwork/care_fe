import { useMutation, useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import Page from "@/components/Common/Page";
import { TagSelectorPopover } from "@/components/Tags/TagAssignmentSheet";

import useAppHistory from "@/hooks/useAppHistory";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { PractitionerSelector } from "@/pages/Appointments/components/PractitionerSelector";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import scheduleApis from "@/types/scheduling/scheduleApi";

import { AppointmentSlotPicker } from "./components/AppointmentSlotPicker";

interface Props {
  patientId: string;
}

export default function BookAppointment({ patientId }: Props) {
  const { t } = useTranslation();
  const { goBack } = useAppHistory();
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
  });
  const resource = resourcesQuery.data?.users.find((r) => r.id === resourceId);

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

  return (
    <Page title={t("book_appointment")}>
      <hr className="mt-6 mb-8 border-gray-200" />
      <div className="container mx-auto p-4 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-lg font-bold mb-2">{t("book_appointment")}</h1>
        </div>

        <div className="space-y-8">
          <div className="max-w-md">
            <Label className="mb-2">{t("tags", { count: 2 })}</Label>
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
                onSelect={(user) => user && setResourceId(user.id)}
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
