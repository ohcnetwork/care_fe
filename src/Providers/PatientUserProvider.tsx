import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { createContext, useEffect, useState } from "react";

import { useAuthContext } from "@/hooks/useAuthUser";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { AppointmentPatient } from "@/pages/Patient/Utils";
import { TokenData } from "@/types/auth/otpToken";

export type PatientUserContextType = {
  patients?: AppointmentPatient[];
  selectedPatient: AppointmentPatient | null;
  setSelectedPatient: (patient: AppointmentPatient) => void;
  tokenData: TokenData;
};

export const PatientUserContext = createContext<PatientUserContextType | null>(
  null,
);

interface Props {
  children: React.ReactNode;
}

export default function PatientUserProvider({ children }: Props) {
  const [patients, setPatients] = useState<AppointmentPatient[]>([]);
  const [selectedPatient, setSelectedPatient] =
    useState<AppointmentPatient | null>(null);

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
      const localPatient: AppointmentPatient | undefined = JSON.parse(
        localStorage.getItem("selectedPatient") || "{}",
      );
      const selectedPatient =
        userData.results.find((patient) => patient.id === localPatient?.id) ||
        userData.results[0];
      setSelectedPatient(selectedPatient);
      localStorage.setItem("selectedPatient", JSON.stringify(selectedPatient));
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
