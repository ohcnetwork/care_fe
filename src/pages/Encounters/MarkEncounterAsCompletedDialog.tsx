import { useMutation, useQueryClient } from "@tanstack/react-query";
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

import { PLUGIN_Component } from "@/PluginEngine";
import mutate from "@/Utils/request/mutate";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import encounterApi from "@/types/emr/encounter/encounterApi";

export function MarkEncounterAsCompletedDialog(
  props: React.ComponentProps<typeof AlertDialog>,
) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { selectedEncounter: encounter } = useEncounter();

  const { mutate: updateEncounter } = useMutation({
    mutationFn: mutate(encounterApi.update, {
      pathParams: { id: encounter?.id || "" },
    }),
    onSuccess: () => {
      toast.success(t("encounter_marked_as_complete"));
      queryClient.invalidateQueries({ queryKey: ["encounter", encounter?.id] });
    },
  });

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
            onClick={() => {
              updateEncounter({
                ...encounter,
                status: "completed",
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
              });
            }}
          >
            {t("mark_as_complete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
