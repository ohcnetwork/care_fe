import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { LocalStorageKeys } from "@/common/constants";

import { useAuthContext } from "@/hooks/useAuthUser";

import query from "@/Utils/request/query";
import { PublicPatientRead } from "@/types/emr/patient/patient";
import publicPatientApi from "@/types/emr/patient/publicPatientApi";
import { TokenData } from "@/types/otp/otp";

export type PatientUserContextType = {
  patients?: PublicPatientRead[];
  selectedPatient: PublicPatientRead | null;
  setSelectedPatient: (patient: PublicPatientRead) => void;
  isLoadingPatients: boolean;
  tokenData: TokenData;
};

export const PatientUserContext = createContext<PatientUserContextType | null>(
  null,
);

interface Props {
  children: React.ReactNode;
}

export default function PatientUserProvider({ children }: Props) {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    () => localStorage.getItem(LocalStorageKeys.selectedPatient),
  );

  const { patientToken: tokenData } = useAuthContext();

  const { data: userData, isLoading } = useQuery({
    queryKey: ["patients", tokenData],
    queryFn: query(publicPatientApi.list, {
      headers: {
        Authorization: `Bearer ${tokenData?.token}`,
      },
    }),
    enabled: !!tokenData?.token,
  });

  const patients = useMemo(() => userData?.results ?? [], [userData]);

  // A stored id can go stale (profile unlinked, or a different number signed
  // in), so resolution always falls back to the first linked profile. The
  // stored value is only rewritten on an explicit switch.
  const selectedPatient = useMemo(
    () =>
      patients.find((patient) => patient.id === selectedPatientId) ??
      patients[0] ??
      null,
    [patients, selectedPatientId],
  );

  const setSelectedPatient = useCallback((patient: PublicPatientRead) => {
    setSelectedPatientId(patient.id);
    localStorage.setItem(LocalStorageKeys.selectedPatient, patient.id);
  }, []);

  // Every screen under this provider needs a patient session, so send an
  // unauthenticated (or signed-out) visitor to the patient login rather than
  // the public landing page.
  useEffect(() => {
    if (!tokenData) {
      navigate("/patient/login", { replace: true });
    }
  }, [tokenData]);

  if (!tokenData) {
    return null;
  }

  return (
    <PatientUserContext.Provider
      value={{
        patients,
        selectedPatient,
        setSelectedPatient,
        isLoadingPatients: isLoading,
        tokenData,
      }}
    >
      {children}
    </PatientUserContext.Provider>
  );
}
