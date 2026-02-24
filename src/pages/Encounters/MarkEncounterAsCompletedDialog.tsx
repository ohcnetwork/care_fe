import React from "react";
import { useTranslation } from "react-i18next";

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
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { useCompleteEncounter } from "@/pages/Encounters/utils/useEncounterProgressController";
import { EncounterRead } from "@/types/emr/encounter/encounter";
import { navigate } from "raviger";

export function MarkEncounterAsCompletedDialog(
  props: React.ComponentProps<typeof AlertDialog>,
) {
  const { t } = useTranslation();
  const { selectedEncounter: encounter } = useEncounter();
  const { completeEncounter } = useCompleteEncounter({
    encounter: encounter as EncounterRead,
    onDischargeRequired: () => {
      navigate(
        `/facility/${encounter?.facility?.id}/patient/${encounter?.patient?.id}/encounter/${encounter?.id}/questionnaire/encounter?toDischarge=true`,
      );
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
            onClick={completeEncounter}
          >
            {t("mark_as_complete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
