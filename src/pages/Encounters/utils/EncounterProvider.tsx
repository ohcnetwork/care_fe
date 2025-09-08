import { useQuery } from "@tanstack/react-query";
import { useQueryParams } from "raviger";
import { createContext, useContext, useState } from "react";

import { CareTeamSheet } from "@/components/CareTeam/CareTeamSheet";
import { LocationSheet } from "@/components/Location/LocationSheet";
import LinkDepartmentsSheet from "@/components/Patient/LinkDepartmentsSheet";

import { Permissions, getPermissions } from "@/common/Permissions";

import query from "@/Utils/request/query";
import { DispenseConsumableButton } from "@/components/Consumable/DispenseConsumableButton";
import { usePermissions } from "@/context/PermissionContext";
import { MarkEncounterAsCompletedDialog } from "@/pages/Encounters/MarkEncounterAsCompletedDialog";
import { DispenseMedicineButton } from "@/pages/Encounters/tabs/overview/summary-panel-details-tab/dispense-medicine";
import {
  EncounterRead,
  inactiveEncounterStatus,
} from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";
import { PatientRead } from "@/types/emr/patient/patient";
import patientApi from "@/types/emr/patient/patientApi";

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
  canWriteClinicalData: boolean;

  actions: {
    markAsCompleted: () => void;
    assignLocation: () => void;
    viewLocationHistory: () => void;
    manageCareTeam: () => void;
    manageDepartments: () => void;
    dispenseMedicine: () => void;
    dispenseConsumable: () => void;
  };
};

enum EncounterAction {
  MarkAsCompleted,
  AssignLocation,
  LocationHistory,
  ManageCareTeam,
  ManageDepartments,
  DispenseMedicine,
  DispenseConsumable,
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
    queryFn: query(patientApi.getPatient, {
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

  // User can access the selected encounter if they have canViewEncounter or canViewClinicalData permission
  const canReadSelectedEncounter =
    selectedEncounterPermissions.canViewEncounter ||
    selectedEncounterPermissions.canViewClinicalData;

  // User can edit the selected encounter if it was accessed via facility scope, is the same as the primary encounter in view, and is active
  const canWriteSelectedEncounter =
    canReadSelectedEncounter &&
    !!facilityId &&
    selectedEncounterId === primaryEncounterId &&
    !!selectedEncounter &&
    !inactiveEncounterStatus.includes(selectedEncounter.status);

  // User can access the current encounter if they have canViewEncounter or canViewClinicalData permission
  const canReadPrimaryEncounter =
    primaryEncounterPermissions.canViewEncounter ||
    primaryEncounterPermissions.canViewClinicalData;

  // User can edit the current encounter if it was accessed via facility scope and is active
  const canWritePrimaryEncounter =
    canReadPrimaryEncounter &&
    !!facilityId &&
    !!primaryEncounter &&
    !inactiveEncounterStatus.includes(primaryEncounter.status);

  // User can access clinical data if they have canViewClinicalData permission or canViewEncounter permission
  const canReadClinicalData =
    patientPermissions.canViewClinicalData ||
    selectedEncounterPermissions.canViewEncounter;

  // User can write clinical data if they have canViewClinicalData permission and can write the selected encounter
  const canWriteClinicalData = canReadClinicalData && canWriteSelectedEncounter;

  const [activeAction, setActiveAction] = useState<EncounterAction | null>(
    null,
  );

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
        canReadPrimaryEncounter,
        canWritePrimaryEncounter,
        canReadClinicalData,
        canWriteClinicalData,
        actions: {
          markAsCompleted: () => {
            setActiveAction(EncounterAction.MarkAsCompleted);
          },
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
          dispenseConsumable: () => {
            setActiveAction(EncounterAction.DispenseConsumable);
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
          trigger={<></>}
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
          trigger={<></>}
        />
      )}

      <DispenseMedicineButton
        open={activeAction === EncounterAction.DispenseMedicine}
        setOpen={(open) => {
          setActiveAction(open ? EncounterAction.DispenseMedicine : null);
        }}
      />

      <DispenseConsumableButton
        open={activeAction === EncounterAction.DispenseConsumable}
        setOpen={(open) => {
          setActiveAction(open ? EncounterAction.DispenseConsumable : null);
        }}
      />
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
