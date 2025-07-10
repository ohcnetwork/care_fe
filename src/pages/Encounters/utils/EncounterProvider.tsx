import { useQuery } from "@tanstack/react-query";
import { useQueryParams } from "raviger";
import { createContext, useContext } from "react";

import { Permissions, getPermissions } from "@/common/Permissions";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { usePermissions } from "@/context/PermissionContext";
import { Encounter } from "@/types/emr/encounter/encounter";
import { Patient } from "@/types/emr/patient/patient";
import patientApi from "@/types/emr/patient/patientApi";

type EncounterContextType = {
  currentEncounterId: string;
  facilityId?: string;
  patientId: string;
  selectedEncounterId: string;

  patient: Patient | undefined;
  currentEncounter: Encounter | undefined;
  pastEncounters: PaginatedResponse<Encounter> | undefined;
  selectedEncounter: Encounter | undefined;
  isPatientLoading: boolean;
  isCurrentEncounterLoading: boolean;
  isSelectedEncounterLoading: boolean;
  isPastEncountersLoading: boolean;
  setSelectedEncounter: (encounterId: string | null) => void;
  currentEncounterPermissions: Permissions;
  selectedEncounterPermissions: Permissions;
  patientPermissions: Permissions;
};

const encounterContext = createContext<EncounterContextType | undefined>(
  undefined,
);

export function EncounterProvider({
  children,
  encounterId,
  facilityId,
  patientId,
}: {
  children: React.ReactNode;
  encounterId: string;
  facilityId?: string;
  patientId: string;
}) {
  const currentEncounterId = encounterId;
  const [{ selectedEncounter: selectedEncounterId = encounterId }, setQParams] =
    useQueryParams();

  const { data: patient, isLoading: isPatientLoading } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(patientApi.getPatient, {
      pathParams: { id: patientId },
    }),
  });

  const { data: currentEncounter, isLoading: isCurrentEncounterLoading } =
    useQuery({
      queryKey: ["encounter", currentEncounterId],
      queryFn: query(routes.encounter.get, {
        pathParams: { id: currentEncounterId },
        queryParams: facilityId
          ? { facility: facilityId }
          : { patient: patientId },
      }),
    });

  const { data: selectedEncounter, isLoading: isSelectedEncounterLoading } =
    useQuery({
      queryKey: ["encounter", selectedEncounterId],
      queryFn: query(routes.encounter.get, {
        pathParams: { id: selectedEncounterId },
        queryParams: facilityId
          ? { facility: facilityId }
          : { patient: patientId },
      }),
    });

  const { data: encounters, isLoading: isPastEncountersLoading } = useQuery({
    queryKey: ["encounters", "past", patientId],
    queryFn: query(routes.encounter.list, {
      queryParams: { patient: patientId },
    }),
  });

  const setSelectedEncounter = (encounterId: string | null) => {
    setQParams(
      { selectedEncounter: encounterId },
      { replace: false, overwrite: false },
    );
  };

  const { hasPermission } = usePermissions();

  const currentEncounterPermissions = getPermissions(
    hasPermission,
    currentEncounter?.permissions ?? [],
  );

  const selectedEncounterPermissions = getPermissions(
    hasPermission,
    selectedEncounter?.permissions ?? [],
  );

  const patientPermissions = getPermissions(
    hasPermission,
    patient?.permissions ?? [],
  );

  return (
    <encounterContext.Provider
      value={{
        currentEncounterId,
        facilityId,
        patientId,
        selectedEncounterId,
        patient,
        currentEncounter,
        pastEncounters: encounters && {
          ...encounters,
          results:
            encounters?.results.filter(
              (encounter) => encounter.id !== currentEncounterId,
            ) ?? [],
        },
        selectedEncounter,
        isPatientLoading,
        isCurrentEncounterLoading,
        isSelectedEncounterLoading,
        isPastEncountersLoading,
        setSelectedEncounter,
        currentEncounterPermissions,
        selectedEncounterPermissions,
        patientPermissions,
      }}
    >
      {children}
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
