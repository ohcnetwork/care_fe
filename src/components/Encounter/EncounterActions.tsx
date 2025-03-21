import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

import { getPermissions } from "@/common/Permissions";

import { PLUGIN_Component } from "@/PluginEngine";
import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import { usePermissions } from "@/context/PermissionContext";
import { Encounter, inactiveEncounterStatus } from "@/types/emr/encounter";

interface EncounterActionsProps {
  encounter: Encounter;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  disableButtons?: boolean;
  className?: string;
  layout?: "dropdown" | "standalone";
}

export default function EncounterActions({
  encounter,
  variant = "outline",
  size = "default",
  disableButtons = false,
  className,
  layout = "standalone",
}: EncounterActionsProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const { canWriteEncounter } = getPermissions(
    hasPermission,
    encounter.permissions,
  );
  const canWrite =
    canWriteEncounter && !inactiveEncounterStatus.includes(encounter.status);

  const { mutate: updateEncounter } = useMutation({
    mutationFn: mutate(routes.encounter.update, {
      pathParams: { id: encounter.id },
    }),
    onSuccess: () => {
      toast.success(t("encounter_marked_as_complete"));
      queryClient.invalidateQueries({ queryKey: ["encounter", encounter.id] });
    },
    onError: () => {
      toast.error(t("error_updating_encounter"));
    },
  });

  const handleMarkAsComplete = () => {
    updateEncounter({
      ...encounter,
      status: "completed",
      organizations: encounter.organizations.map((org) => org.id),
      patient: encounter.patient.id,
      encounter_class: encounter.encounter_class,
      period: encounter.period,
      hospitalization: encounter.hospitalization,
      priority: encounter.priority,
      external_identifier: encounter.external_identifier,
      facility: encounter.facility.id,
    });
  };

  if (disableButtons) {
    return null;
  }

  const ActionItems = () => {
    if (layout === "dropdown") {
      return (
        <>
          <DropdownMenuItem asChild>
            <Link
              href={`/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/treatment_summary`}
            >
              {t("treatment_summary")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="files?file=discharge_summary">
              {t("discharge_summary")}
            </Link>
          </DropdownMenuItem>
          {canWrite && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  data-cy="mark-encounter-as-complete"
                >
                  {t("mark_as_complete")}
                </DropdownMenuItem>
              </AlertDialogTrigger>
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
                    data-cy="encounter-complete-dropdown"
                  >
                    {t("mark_as_complete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </>
      );
    }

    return (
      <div className={cn("space-y-2", className)}>
        <Button
          variant={variant}
          size={size}
          className="w-full justify-start"
          asChild
        >
          <Link
            href={`/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/treatment_summary`}
          >
            {t("treatment_summary")}
          </Link>
        </Button>
        <Button
          variant={variant}
          size={size}
          className="w-full justify-start"
          asChild
        >
          <Link href="files?file=discharge_summary">
            {t("discharge_summary")}
          </Link>
        </Button>
        {canWrite && (
          <>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  data-cy="mark-encounter-complete"
                  variant={variant}
                  size={size}
                  className="w-full justify-start"
                >
                  {t("mark_as_complete")}
                </Button>
              </AlertDialogTrigger>
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
                    className={cn(buttonVariants({ variant: "primary" }))}
                    onClick={handleMarkAsComplete}
                    data-cy="confirm-encounter-complete"
                  >
                    {t("mark_as_complete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <PLUGIN_Component
              __name="PatientInfoCardActions"
              encounter={encounter}
            />
          </>
        )}
      </div>
    );
  };

  return ActionItems();
}
