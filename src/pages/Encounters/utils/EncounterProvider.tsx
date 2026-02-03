import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { navigate, useQueryParams } from "raviger";
import { createContext, useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { CareTeamSheet } from "@/components/CareTeam/CareTeamSheet";
import { LocationSheet } from "@/components/Location/LocationSheet";
import LinkDepartmentsSheet from "@/components/Patient/LinkDepartmentsSheet";

import { getPermissions, Permissions } from "@/common/Permissions";

import { DispenseButton } from "@/components/Consumable/DispenseButton";
import { usePermissions } from "@/context/PermissionContext";
import { MarkEncounterAsCompletedDialog } from "@/pages/Encounters/MarkEncounterAsCompletedDialog";
import { useEncounterProgressController } from "@/pages/Encounters/utils/utils";
import {
  completedEncounterStatus,
  EncounterRead,
  inactiveEncounterStatus,
} from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";
import { PatientRead } from "@/types/emr/patient/patient";
import patientApi from "@/types/emr/patient/patientApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

type EncounterContextType = {
  facilityId?: string;
  patientId: string;
  primaryEncounterId: string;
  selectedEncounterId: string;

  patient: PatientRead | undefined;
  primaryEncounter: EncounterRead | undefined;
  selectedEncounter: EncounterRead | undefined;
  isPatientLoading: boolean;
  isPrimaryEncounterLoading: boolean;
  isSelectedEncounterLoading: boolean;
  setSelectedEncounter: (encounterId: string | null) => void;
  primaryEncounterPermissions: Permissions;
  selectedEncounterPermissions: Permissions;
  patientPermissions: Permissions;

  canReadPrimaryEncounter: boolean;
  canReadSelectedEncounter: boolean;
  canReadClinicalData: boolean;

  canWritePrimaryEncounter: boolean;
  canWriteSelectedEncounter: boolean;
  canRestartSelectedEncounter: boolean;
  canWriteClinicalData: boolean;

  isEndEncounterPending: boolean;

  actions: {
    markAsCompleted: () => void;
    endEncounter: (encounter: EncounterRead, closeEncounter: boolean) => void;
    assignLocation: () => void;
    viewLocationHistory: () => void;
    manageCareTeam: () => void;
    manageDepartments: () => void;
    dispenseMedicine: () => void;
    dispense: () => void;
    restartEncounter: () => void;
  };
};

enum EncounterAction {
  MarkAsCompleted,
  ConfirmMarkAsCompleted,
  AssignLocation,
  LocationHistory,
  ManageCareTeam,
  ManageDepartments,
  DispenseMedicine,
  Dispense,
}

const encounterContext = createContext<EncounterContextType | undefined>(
  undefined,
);

export function EncounterProvider({
  children,
  encounterId: primaryEncounterId,
  facilityId,
  patientId,
}: {
  children: React.ReactNode;
  encounterId: string;
  facilityId?: string;
  patientId: string;
}) {
  const [
    { selectedEncounter: selectedEncounterId = primaryEncounterId },
    setQParams,
  ] = useQueryParams();

  const { data: patient, isLoading: isPatientLoading } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(patientApi.get, {
      pathParams: { id: patientId },
      silent: true,
    }),
  });

  const { data: primaryEncounter, isLoading: isPrimaryEncounterLoading } =
    useQuery({
      queryKey: ["encounter", primaryEncounterId],
      queryFn: query(encounterApi.get, {
        pathParams: { id: primaryEncounterId },
        queryParams: facilityId
          ? { facility: facilityId }
          : { patient: patientId },
      }),
    });

  const { data: selectedEncounter, isLoading: isSelectedEncounterLoading } =
    useQuery({
      queryKey: ["encounter", selectedEncounterId],
      queryFn: query(encounterApi.get, {
        pathParams: { id: selectedEncounterId },
        queryParams: facilityId
          ? { facility: facilityId }
          : { patient: patientId },
      }),
    });

  const setSelectedEncounter = (encounterId: string | null) => {
    setQParams(
      { selectedEncounter: encounterId },
      { replace: false, overwrite: false },
    );
  };

  const { hasPermission } = usePermissions();

  const primaryEncounterPermissions = getPermissions(
    hasPermission,
    primaryEncounter?.permissions ?? [],
  );

  const selectedEncounterPermissions = getPermissions(
    hasPermission,
    selectedEncounter?.permissions ?? [],
  );

  const patientPermissions = getPermissions(
    hasPermission,
    patient?.permissions ?? [],
  );

  // User can access the selected encounter if they have read encounter
  const canReadSelectedEncounter =
    selectedEncounterPermissions.canReadEncounter;

  // User can access clinical data if they have canViewClinicalData permission or canViewEncounter permission
  const canReadClinicalData =
    patientPermissions.canViewClinicalData ||
    selectedEncounterPermissions.canReadEncounterClinicalData;

  // User can edit the selected encounter if it was accessed via facility scope, is the same as the primary encounter in view, and is active
  const canWriteSelectedEncounter =
    !!facilityId &&
    selectedEncounterId === primaryEncounterId &&
    !!selectedEncounter &&
    !inactiveEncounterStatus.includes(selectedEncounter.status);

  // User can restart the selected encounter if it was accessed via facility scope, is the same as the primary encounter in view, and is completed
  const canRestartSelectedEncounter =
    !!facilityId &&
    selectedEncounterId === primaryEncounterId &&
    !!selectedEncounter &&
    completedEncounterStatus.includes(selectedEncounter.status);

  // User can access the current encounter if they have canReadEncounter permission
  const canReadPrimaryEncounter = primaryEncounterPermissions.canReadEncounter;
  // User can edit the current encounter if it was accessed via facility scope and is active
  const canWritePrimaryEncounter =
    canReadPrimaryEncounter &&
    !!facilityId &&
    !!primaryEncounter &&
    !inactiveEncounterStatus.includes(primaryEncounter.status);

  // User can write clinical data if they have canViewClinicalData permission and can write the selected encounter
  const canWriteClinicalData = canReadClinicalData && canWriteSelectedEncounter;

  const [activeAction, setActiveAction] = useState<EncounterAction | null>(
    null,
  );

  const { endEncounter, isPending: isEndEncounterPending } =
    useEncounterProgressController();
  const toDischarge =
    selectedEncounter?.encounter_class === "imp" &&
    selectedEncounter?.status !== "discharged";

  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { mutate: restartEncounterMutation } = useMutation({
    mutationFn: mutate(encounterApi.restart, {
      pathParams: { id: selectedEncounter?.id ?? "" },
    }),
    onSuccess: () => {
      toast.success(t("encounter_restarted_successfully"));
      queryClient.invalidateQueries({ queryKey: ["encounters"] });
      queryClient.invalidateQueries({
        queryKey: ["encounter", selectedEncounter?.id],
      });
      if (selectedEncounter) {
        navigate(
          `/facility/${selectedEncounter.facility.id}/patient/${selectedEncounter.patient.id}/encounter/${selectedEncounter.id}/updates`,
        );
      }
    },
    onError: () => {
      toast.error(t("failed_to_restart_encounter"));
    },
  });

  return (
    <encounterContext.Provider
      value={{
        facilityId,
        patientId,
        primaryEncounterId,
        selectedEncounterId,
        patient: patient ?? primaryEncounter?.patient,
        primaryEncounter,
        selectedEncounter,
        isPatientLoading,
        isPrimaryEncounterLoading,
        isSelectedEncounterLoading,
        setSelectedEncounter,
        primaryEncounterPermissions,
        selectedEncounterPermissions,
        patientPermissions,
        canReadSelectedEncounter,
        canWriteSelectedEncounter,
        canRestartSelectedEncounter,
        canReadPrimaryEncounter,
        canWritePrimaryEncounter,
        canReadClinicalData,
        canWriteClinicalData,
        isEndEncounterPending,
        actions: {
          markAsCompleted: () => {
            if (toDischarge) {
              navigate(
                `/facility/${selectedEncounter?.facility.id}/patient/${selectedEncounter?.patient.id}/encounter/${selectedEncounter?.id}/questionnaire/encounter?toDischarge=true`,
              );
              return;
            }
            setActiveAction(EncounterAction.MarkAsCompleted);
          },
          endEncounter,
          assignLocation: () => {
            setActiveAction(EncounterAction.AssignLocation);
          },
          viewLocationHistory: () => {
            setActiveAction(EncounterAction.LocationHistory);
          },
          manageCareTeam: () => {
            setActiveAction(EncounterAction.ManageCareTeam);
          },
          manageDepartments: () => {
            setActiveAction(EncounterAction.ManageDepartments);
          },
          dispenseMedicine: () => {
            setActiveAction(EncounterAction.DispenseMedicine);
          },
          dispense: () => {
            setActiveAction(EncounterAction.Dispense);
          },
          restartEncounter: () => {
            restartEncounterMutation({});
          },
        },
      }}
    >
      {children}

      <MarkEncounterAsCompletedDialog
        open={activeAction === EncounterAction.MarkAsCompleted}
        onOpenChange={(open) => {
          setActiveAction(open ? EncounterAction.MarkAsCompleted : null);
        }}
      />

      {selectedEncounter && (
        <LocationSheet
          open={
            activeAction === EncounterAction.AssignLocation ||
            activeAction === EncounterAction.LocationHistory
          }
          onOpenChange={(open) => {
            setActiveAction(open ? EncounterAction.AssignLocation : null);
          }}
          facilityId={selectedEncounter.facility.id}
          history={selectedEncounter.location_history}
          encounter={selectedEncounter}
          defaultTab={
            activeAction === EncounterAction.LocationHistory
              ? "history"
              : "assign"
          }
        />
      )}

      {selectedEncounter && (
        <CareTeamSheet
          open={activeAction === EncounterAction.ManageCareTeam}
          setOpen={(open) => {
            setActiveAction(open ? EncounterAction.ManageCareTeam : null);
          }}
          encounter={selectedEncounter}
          canWrite={canWriteSelectedEncounter}
        />
      )}

      {selectedEncounter && (
        <LinkDepartmentsSheet
          entityType="encounter"
          entityId={selectedEncounter.id}
          currentOrganizations={selectedEncounter.organizations}
          facilityId={selectedEncounter.facility.id}
          open={activeAction === EncounterAction.ManageDepartments}
          setOpen={(open) => {
            setActiveAction(open ? EncounterAction.ManageDepartments : null);
          }}
          trigger={<span />}
        />
      )}

      {facilityId && (
        <DispenseButton
          open={activeAction === EncounterAction.Dispense}
          setOpen={(open) => {
            setActiveAction(open ? EncounterAction.Dispense : null);
          }}
          facilityId={facilityId}
        />
      )}
    </encounterContext.Provider>
  );
}

export function useEncounter() {
  const context = useContext(encounterContext);
  if (!context) {
    throw new Error("useEncounter must be used within an EncounterProvider");
  }
  return context;
}
