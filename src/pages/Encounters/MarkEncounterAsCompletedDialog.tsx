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

import { useEncounterProgressController } from "@/pages/Encounters/utils/useEncounterProgressController";
import { PLUGIN_Component } from "@/PluginEngine";
import { EncounterRead } from "@/types/emr/encounter/encounter";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import { AlertTriangleIcon } from "lucide-react";

export function MarkEncounterAsCompletedDialog({
  encounter,
  completeEverythingToMark,
  ...props
}: {
  encounter: EncounterRead;
  completeEverythingToMark?: boolean;
} & React.ComponentProps<typeof AlertDialog>) {
  const { t } = useTranslation();
  const { completeEncounter, completeEverything } =
    useEncounterProgressController({
      encounter: encounter,
    });

  if (!encounter) return null;

  return (
    <AlertDialog {...props}>
      <AlertDialogContent>
        <AlertDialogHeader className="pb-0 md:pb-0">
          <AlertDialogTitle>{t("mark_as_complete")}</AlertDialogTitle>
          <AlertDialogDescription className="flex flex-col gap-2">
            <span>{t("mark_encounter_as_complete_confirmation")}</span>
            {completeEverythingToMark && (
              <div className="bg-yellow-50 flex gap-2 items-center justify-start rounded-md p-1">
                <AlertTriangleIcon className="text-yellow-500 size-4" />
                <span className="block text-sm text-yellow-900">
                  {t("mark_everything_as_complete_description")}
                </span>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="px-4 empty:hidden md:px-6">
          <PLUGIN_Component
            __name="PatientInfoCardMarkAsComplete"
            encounter={encounter}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant="primary"
            onClick={() => {
              if (completeEverythingToMark) {
                completeEverything();
              } else {
                completeEncounter();
              }
            }}
          >
            {t("mark_as_complete")}
            <ShortcutBadge actionId="enter-action" />
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
