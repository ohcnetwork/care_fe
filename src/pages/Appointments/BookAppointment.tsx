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

import Page from "@/components/Common/Page";
import { TagSelectorPopover } from "@/components/Tags/TagAssignmentSheet";
import { AuthUserModel } from "@/components/Users/models";

import useAppHistory from "@/hooks/useAppHistory";
import useAuthUser from "@/hooks/useAuthUser";

import {
  isOfflineId,
  normalizedAppointmentRecord,
  saveOfflineWrite,
  updateSlotCacheAfterOfflineAppointment,
} from "@/OfflineSupport/offlineWriteHelpers";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { PractitionerSelector } from "@/pages/Appointments/components/PractitionerSelector";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { Patient } from "@/types/emr/patient/patient";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import { FacilityData } from "@/types/facility/facility";
import {
  Appointment,
  AppointmentNonCancelledStatus,
  TokenSlot,
} from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApi";
import { UserBase } from "@/types/user/user";

import { AppointmentSlotPicker } from "./components/AppointmentSlotPicker";

interface Props {
  patientId: string;
}

export default function BookAppointment({ patientId }: Props) {
  const { t } = useTranslation();
  const { goBack } = useAppHistory();

  const authUser = useAuthUser();
  const queryClient = useQueryClient();

  const [selectedPracticioner, setSelectedPracticioner] =
    useState<UserBase | null>(null);
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

  const { mutateAsync: createAppointment } = useMutation({
    mutationFn: mutate(scheduleApis.slots.createAppointment, {
      pathParams: { facilityId, slotId: selectedSlotId ?? "" },
    }),
  });

  const queueAppointmentRecordOffline = async (
    createAppointmentData: any,
    selectedSlot: TokenSlot | undefined,
    selectedPracticioner: UserBase | null,
    authUser: AuthUserModel,
    status: AppointmentNonCancelledStatus,
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
      const generatedId = `offline-${crypto.randomUUID()}`;
      const offlineEntry = {
        id: generatedId,
        userId: authUser?.external_id,
        mutationSyncrouteKey: "createAppointment",
        mutationPathParams: {
          facility_id: facilityId,
          slot_id: selectedSlotId ?? "",
        },
        type: "createAppointment",
        resourceType: "Appointment",
        payload: createAppointmentData,
        parentMutationIds: isOfflineId(patientId) ? [patientId] : [],
      };

      const saveResult = await saveOfflineWrite(offlineEntry);

      if (!saveResult.success) {
        toast.error(saveResult.error);
        return;
      }

      const facilityData = queryClient.getQueryData<FacilityData>([
        "facility",
        facilityId,
      ]);

      const FacilityBareMinimumData = {
        id: facilityData?.id ?? "-",
        name: facilityData?.name ?? "-",
      };

      const Patientdata = queryClient.getQueryData<Patient>([
        "patient",
        patientId,
      ]);

      if (!Patientdata) {
        toast.error(
          t("eror_while_appointment_schedule1_patient_missin_offline"),
        );
        return;
      }
      const normalizeAppointment = normalizedAppointmentRecord(
        saveResult.entry,
        selectedSlot,
        Patientdata ?? Patientdata,
        authUser,
        status,
        selectedPracticioner,
        FacilityBareMinimumData,
      );

      queryClient.setQueryData(
        ["appointment", generatedId],
        normalizeAppointment,
      );

      updateSlotCacheAfterOfflineAppointment({
        queryClient: queryClient,
        selectedSlot: selectedSlot,
        selectedPracticioner: selectedPracticioner,
        facilityId: facilityId,
        selectedDate: selectedDateOffline,
        selectedMonth: selectedMonthOffline,
        action: "booked",
      });

      const prevAppointmentList = queryClient.getQueryData<
        PaginatedResponse<Appointment>
      >(["patient-appointments", patientId]);

      const updatedAppointmentList: PaginatedResponse<Appointment> =
        prevAppointmentList?.results
          ? {
              ...prevAppointmentList,
              results: [...prevAppointmentList.results, normalizeAppointment],
              count:
                (prevAppointmentList.count ??
                  prevAppointmentList.results.length) + 1,
            }
          : {
              count: 1,
              results: [normalizeAppointment],
            };

      queryClient.setQueryData(
        ["patient-appointments", patientId],
        updatedAppointmentList,
      );

      toast.success("Appointment created successfully");
      navigate(
        `/facility/${facilityId}/patient/${patientId}/appointments/${generatedId}`,
      );
    } catch (error) {
      console.error("Error while scheduling appointment", error);
      toast.error(t("eror_while_appointment_schedule"));
    }
  };
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
      const createAppointmentData = {
        patient: patientId,
        reason_for_visit: reason,
        tags: selectedTags.map((tag) => tag.id),
      };

      if (!onlineManager.isOnline()) {
        const status = "booked";
        await queueAppointmentRecordOffline(
          createAppointmentData,
          OfflineSelectedSlot,
          selectedPracticioner,
          authUser,
          status,
        );

        return;
      }

      const data = await createAppointment(createAppointmentData);

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
            <Label className="mb-2">{t("tags")}</Label>
            <TagSelectorPopover
              selected={selectedTags}
              onChange={setSelectedTags}
              resource={TagResource.APPOINTMENT}
            />
          </div>
          <div className="max-w-md">
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
                facilityId={facilityId}
                selected={resource ?? null}
                onSelect={(user) => {
                  setResourceId(user?.id ?? undefined);
                  setSelectedPracticioner(user ?? null);
                }}
                clearSelection={t("show_all")}
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
