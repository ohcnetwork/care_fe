import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { createContext, useEffect, useState } from "react";

import { useAuthContext } from "@/hooks/useAuthUser";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { TokenData } from "@/types/auth/otpToken";
import { Patient } from "@/types/emr/newPatient";

export type PatientUserContextType = {
  patients?: Patient[];
  selectedPatient: Patient | null;
  setSelectedPatient: (patient: Patient) => void;
  tokenData: TokenData;
};

export const PatientUserContext = createContext<PatientUserContextType | null>(
  null,
);

interface Props {
  children: React.ReactNode;
}

export default function PatientUserProvider({ children }: Props) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const { patientToken: tokenData } = useAuthContext();

  const { data: userData } = useQuery({
    queryKey: ["patients", tokenData],
    queryFn: query(routes.otp.getPatient, {
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
