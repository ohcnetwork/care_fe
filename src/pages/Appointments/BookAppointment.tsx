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

import useAppHistory from "@/hooks/useAppHistory";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { PractitionerSelector } from "@/pages/Appointments/components/PractitionerSelector";
import scheduleApis from "@/types/scheduling/scheduleApi";

import { AppointmentSlotPicker } from "./components/AppointmentSlotPicker";

interface Props {
  facilityId: string;
  patientId: string;
}

export default function BookAppointment(props: Props) {
  const { t } = useTranslation();
  const { goBack } = useAppHistory();

  const [resourceId, setResourceId] = useState<string>();
  const [selectedSlotId, setSelectedSlotId] = useState<string>();

  const [reason, setReason] = useState("");

  const resourcesQuery = useQuery({
    queryKey: ["practitioners", props.facilityId],
    queryFn: query(scheduleApis.appointments.availableUsers, {
      pathParams: {
        facility_id: props.facilityId,
      },
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
      pathParams: {
        facility_id: props.facilityId,
        slot_id: selectedSlotId ?? "",
      },
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
        patient: props.patientId,
        reason_for_visit: reason,
      });
      toast.success("Appointment created successfully");
      navigate(
        `/facility/${props.facilityId}/patient/${props.patientId}/appointments/${data.id}`,
      );
    } catch {
      toast.error("Failed to create appointment");
    }
  };

  return (
    <Page title={t("book_appointment")}>
      <hr className="mt-6 mb-8" />
      <div className="container mx-auto p-4 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-lg font-bold mb-2">{t("book_appointment")}</h1>
        </div>

        <div className="space-y-8">
          <div>
            <Label className="mb-2">{t("reason_for_visit")}</Label>
            <Textarea
              placeholder={t("reason_for_visit_placeholder")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2">
            <div>
              <Label className="block mb-2">{t("select_practitioner")}</Label>
              <PractitionerSelector
                facilityId={props.facilityId}
                selected={resource ?? null}
                onSelect={(user) => setResourceId(user?.id ?? undefined)}
                clearSelection={t("show_all")}
              />
            </div>
          </div>

          <div
            className={cn(
              "grid grid-cols-1 md:grid-cols-2 gap-12",
              !resourceId && "opacity-50 pointer-events-none",
            )}
          >
            <AppointmentSlotPicker
              facilityId={props.facilityId}
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
                  `/facility/${props.facilityId}/patient/${props.patientId}/appointments`,
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
