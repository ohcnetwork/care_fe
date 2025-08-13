import { useQuery } from "@tanstack/react-query";
import { useQueryParams } from "raviger";
import { createContext, useContext, useState } from "react";

import { Permissions, getPermissions } from "@/common/Permissions";

import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";
import { MarkEncounterAsCompletedDialog } from "@/pages/Encounters/MarkEncounterAsCompletedDialog";
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

  canAccessPrimaryEncounter: boolean;
  canAccessSelectedEncounter: boolean;
  canAccessClinicalData: boolean;

  canWritePrimaryEncounter: boolean;
  canWriteSelectedEncounter: boolean;
  canWriteClinicalData: boolean;

  actions: {
    markAsCompleted: () => void;
  };
};

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
  const canAccessSelectedEncounter =
    selectedEncounterPermissions.canViewEncounter ||
    selectedEncounterPermissions.canViewClinicalData;

  // User can edit the selected encounter if it was accessed via facility scope, is the same as the primary encounter in view, and is active
  const canWriteSelectedEncounter =
    canAccessSelectedEncounter &&
    !!facilityId &&
    selectedEncounterId === primaryEncounterId &&
    !!selectedEncounter &&
    !inactiveEncounterStatus.includes(selectedEncounter.status);

  // User can access the current encounter if they have canViewEncounter or canViewClinicalData permission
  const canAccessPrimaryEncounter =
    primaryEncounterPermissions.canViewEncounter ||
    primaryEncounterPermissions.canViewClinicalData;

  // User can edit the current encounter if it was accessed via facility scope and is active
  const canWritePrimaryEncounter =
    canAccessPrimaryEncounter &&
    !!facilityId &&
    !!primaryEncounter &&
    !inactiveEncounterStatus.includes(primaryEncounter.status);

  // User can access clinical data if they have canViewClinicalData permission or canViewEncounter permission
  const canAccessClinicalData =
    patientPermissions.canViewClinicalData ||
    selectedEncounterPermissions.canViewEncounter;

  // User can write clinical data if they have canViewClinicalData permission and can write the selected encounter
  const canWriteClinicalData =
    canAccessClinicalData && canWriteSelectedEncounter;

  const [markAsCompletedDialogOpen, setMarkAsCompletedDialogOpen] =
    useState(false);

  return (
    <encounterContext.Provider
      value={{
        facilityId,
        patientId,
        primaryEncounterId,
        selectedEncounterId,
        patient,
        primaryEncounter,
        selectedEncounter,
        isPatientLoading,
        isPrimaryEncounterLoading,
        isSelectedEncounterLoading,
        setSelectedEncounter,
        primaryEncounterPermissions,
        selectedEncounterPermissions,
        patientPermissions,
        canAccessSelectedEncounter,
        canWriteSelectedEncounter,
        canAccessPrimaryEncounter,
        canWritePrimaryEncounter,
        canAccessClinicalData,
        canWriteClinicalData,
        actions: {
          markAsCompleted: () => setMarkAsCompletedDialogOpen(true),
        },
      }}
    >
      {children}

      <MarkEncounterAsCompletedDialog
        open={markAsCompletedDialogOpen}
        onOpenChange={setMarkAsCompletedDialogOpen}
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
