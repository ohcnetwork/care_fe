import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { createContext, useEffect, useState } from "react";

import { useAuthContext } from "@/hooks/useAuthUser";

import query from "@/Utils/request/query";
import { PublicPatientRead } from "@/types/emr/patient/patient";
import publicPatientApi from "@/types/emr/patient/publicPatientApi";
import { TokenData } from "@/types/otp/otp";

export type PatientUserContextType = {
  patients?: PublicPatientRead[];
  selectedPatient: PublicPatientRead | null;
  setSelectedPatient: (patient: PublicPatientRead) => void;
  tokenData: TokenData;
};

export const PatientUserContext = createContext<PatientUserContextType | null>(
  null,
);

interface Props {
  children: React.ReactNode;
}

export default function PatientUserProvider({ children }: Props) {
  const [patients, setPatients] = useState<PublicPatientRead[]>([]);
  const [selectedPatient, setSelectedPatient] =
    useState<PublicPatientRead | null>(null);

  const { patientToken: tokenData } = useAuthContext();

  const { data: userData } = useQuery({
    queryKey: ["patients", tokenData],
    queryFn: query(publicPatientApi.list, {
      headers: {
        Authorization: `Bearer ${tokenData?.token}`,
      },
    }),
    enabled: !!tokenData?.token,
  });

  useEffect(() => {
    if (userData?.results && userData.results.length > 0) {
      setPatients(userData.results);
      setSelectedPatient(userData.results[0]);
    }
  }, [userData]);

  if (!tokenData) {
    navigate("/");
    return null;
  }

  return (
    <PatientUserContext.Provider
      value={{
        patients,
        selectedPatient,
        setSelectedPatient,
        tokenData: tokenData,
      }}
    >
      {children}
    </PatientUserContext.Provider>
  );
}
