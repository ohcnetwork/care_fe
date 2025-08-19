import {
  onlineManager,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";

import { queueMarkAscompleteRecord } from "@/components/Encounter/offlineQueue";

import useAuthUser, { useAuthContext } from "@/hooks/useAuthUser";
import { useOfflineEntry } from "@/hooks/useOfflineEntry";

import { handleOfflineRecordSuccess } from "@/OfflineSupport/offlineWriteHelpers";
import { PLUGIN_Component } from "@/PluginEngine";
import mutate from "@/Utils/request/mutate";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { EncounterStatus } from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";

export function MarkEncounterAsCompletedDialog(
  props: React.ComponentProps<typeof AlertDialog>,
) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { selectedEncounter: encounter } = useEncounter();
  const { offlineEntryId } = useOfflineEntry();
  const user = useAuthUser();

  const { mutate: updateEncounter } = useMutation({
    mutationFn: mutate(encounterApi.update, {
      pathParams: { id: encounter?.id || "" },
    }),
    onSuccess: (data) => {
      if (offlineEntryId) {
        handleOfflineRecordSuccess(offlineEntryId, data);
      }
      toast.success(t("encounter_marked_as_complete"));
      queryClient.invalidateQueries({ queryKey: ["encounter", encounter?.id] });
    },
  });
  const handleMarkAsComplete = async () => {
    if (!encounter) return;

    const encounterUpdatedData = {
      ...encounter,

      status: "completed" as EncounterStatus,

      patient: encounter.patient.id,
      encounter_class: encounter.encounter_class,
      period: {
        start: encounter.period.start,
        end: encounter.period.end
          ? encounter.period.end
          : new Date().toISOString(),
      },
      hospitalization: encounter.hospitalization,
      priority: encounter.priority,
      external_identifier: encounter.external_identifier,
      facility: encounter.facility.id,
      discharge_summary_advice: encounter.discharge_summary_advice,
    };

    if (!onlineManager.isOnline()) {
      await queueMarkAscompleteRecord({
        encounter,
        encounterUpdatedData,
        userId: user.id,
        queryClient,
        user,
        onSuccess: () => {
          toast.success(t("encounter_marked_as_complete"));
        },
        onError: (error) => {
          console.error("Error while Marking Encounter as Complete : ", error);
          toast.error(t("error_updating_encounter"));
        },
      });
    } else updateEncounter(encounterUpdatedData);
  };

  if (!encounter) return null;

  return (
    <AlertDialog {...props}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("mark_as_complete")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("mark_encounter_as_complete_confirmation")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <PLUGIN_Component
          __name="PatientInfoCardMarkAsComplete"
          encounter={encounter}
        />

        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "primary" })}
            onClick={handleMarkAsComplete}
          >
            {t("mark_as_complete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
