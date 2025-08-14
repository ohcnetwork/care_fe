import {
  onlineManager,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Link, usePathParams } from "raviger";
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

import useAuthUser from "@/hooks/useAuthUser";

import { getPermissions } from "@/common/Permissions";

import { AppCacheDB } from "@/OfflineSupport/AppcacheDB";
import {
  OfflineKeyMap,
  PathParamsObject,
  QueryParamsObject,
} from "@/OfflineSupport/offlineKeys";
import {
  handleOfflineRecordSuccess,
  isOfflineId,
  normalizeUserBase,
  saveOfflineWrite,
  saveOfflineWriteData,
  updateActiveEncounterList,
} from "@/OfflineSupport/offlineWriteHelpers";
import { PLUGIN_Component } from "@/PluginEngine";
import mutate from "@/Utils/request/mutate";
import { usePermissions } from "@/context/PermissionContext";
import {
  EncounterEdit,
  EncounterRead,
  EncounterStatus,
  inactiveEncounterStatus,
} from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";

interface EncounterActionsProps {
  encounter: EncounterRead;
  offlineEntryId?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  disableButtons?: boolean;
  className?: string;
  layout?: "dropdown" | "standalone";
}

export default function EncounterActions({
  encounter,
  offlineEntryId,
  variant = "outline",
  size = "default",
  disableButtons = false,
  className,
  layout = "standalone",
}: EncounterActionsProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const authUser = useAuthUser();
  const { canWriteEncounter } = getPermissions(
    hasPermission,
    encounter.permissions,
  );
  const db = new AppCacheDB();

  const organizationId = usePathParams("/organization/:organizationId/*");
  const canWrite =
    canWriteEncounter && !inactiveEncounterStatus.includes(encounter.status);

  const { mutate: updateEncounter } = useMutation({
    mutationFn: mutate(encounterApi.update, {
      pathParams: { id: encounter.id },
    }),
    onSuccess: (data) => {
      if (offlineEntryId) {
        handleOfflineRecordSuccess(offlineEntryId, data);
      }

      toast.success(t("encounter_marked_as_complete"));
      queryClient.invalidateQueries({ queryKey: ["encounter", encounter.id] });
    },
    onError: () => {
      toast.error(t("error_updating_encounter"));
    },
  });

  const queueMarkAscompleteRecord = async (
    encounterUpdatedData: EncounterEdit,
  ) => {
    if (isOfflineId(encounter.id)) {
      toast.error(t("cannot_mark_offline_created_encounter_as_complete"));
      return;
    }

    const useQueryParams: QueryParamsObject<typeof encounterApi.get> = encounter
      .facility.id
      ? { facility: encounter.facility.id }
      : { patient: encounter.patient.id };

    const offlineWrite: saveOfflineWriteData = {
      id: encounter.id,
      userId: authUser.external_id,
      facilityId: encounter.facility.id,
      mutationSyncRouteKey: OfflineKeyMap.mark_encounter_as_complete,
      type: OfflineKeyMap.mark_encounter_as_complete,
      resourceType: "Encounter",
      mutationPathParams: { id: encounter.id } satisfies PathParamsObject<
        typeof encounterApi.update
      >,
      payload: encounterUpdatedData,
      serverTimestamp: encounter.modified_date,
      useQueryRouteKey: "getEncounter",
      useQueryPathParams: { id: encounter.id } satisfies PathParamsObject<
        typeof encounterApi.get
      >,
      useQueryParams: useQueryParams,
    };

    try {
      const saveResult = await saveOfflineWrite(offlineWrite);
      if (!saveResult.success) {
        toast.error(saveResult.error);
        return;
      }

      const updatedEncounter: EncounterRead = {
        ...encounter,
        status: "completed",
        updated_by: {
          ...normalizeUserBase(authUser),
          last_login: authUser.last_login ?? "",
          profile_picture_url: authUser.profile_picture_url ?? "",
          mfa_enabled: authUser.mfa_enabled ?? false,
          deleted: authUser.deleted ?? false,
        },
        is_updated_offline: true,
      };

      // Update the offline write entry with normalized data for display/editing
      await db.OfflineWrites.update(saveResult.entry.id, {
        normalizedData: updatedEncounter,
      });

      updateActiveEncounterList({
        queryClient,
        action: "markAsCompleteEncounter",
        patientID: encounter.patient.id,
        normalizeEncounter: updatedEncounter,
      });

      queryClient.setQueryData(["encounter", encounter.id], updatedEncounter);

      toast.success(t("encounter_marked_as_complete"));
    } catch (error) {
      console.error("Error while Marking Encounter as Complete : ", error);
      toast.error(t("error_updating_encounter"));
    }
  };

  const handleMarkAsComplete = async () => {
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
      await queueMarkAscompleteRecord(encounterUpdatedData);
    } else updateEncounter(encounterUpdatedData);
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
              href={
                organizationId
                  ? `/organization/organizationId/patient/${encounter.patient.id}/encounter/${encounter.id}/treatment_summary`
                  : `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/treatment_summary`
              }
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
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
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
            href={
              organizationId
                ? `/organization/organizationId/patient/${encounter.patient.id}/encounter/${encounter.id}/treatment_summary`
                : `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/treatment_summary`
            }
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
