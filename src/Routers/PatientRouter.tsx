import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { useRoutes } from "raviger";
import { createContext, useEffect, useState } from "react";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/sidebar/app-sidebar";

import ErrorBoundary from "@/components/Common/ErrorBoundary";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import { CarePatientTokenKey } from "@/common/constants";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { AppointmentSuccess } from "@/pages/Appoinments/Success";
import { AppointmentPatient } from "@/pages/Patient/Utils";
import PatientHome from "@/pages/Patient/index";
import { TokenData } from "@/types/auth/otpToken";

import SessionRouter from "./SessionRouter";

const PatientRoutes = {
  "/facility/:facilityId/appointments/:appointmentId/success": ({
    appointmentId,
  }: {
    appointmentId: string;
  }) => <AppointmentSuccess appointmentId={appointmentId} />,
  "/patient/home": () => <PatientHome />,
};

const tokenData: TokenData = JSON.parse(
  localStorage.getItem(CarePatientTokenKey) || "{}",
);

export type PatientUserContextType = {
  patients?: AppointmentPatient[];
  selectedPatient: AppointmentPatient | null;
  setSelectedPatient: (patient: AppointmentPatient) => void;
  tokenData: TokenData;
};

export const PatientUserContext = createContext<PatientUserContextType>({
  patients: undefined,
  selectedPatient: null,
  setSelectedPatient: () => {},
  tokenData: tokenData,
});

export default function PatientRouter() {
  const pages = useRoutes(PatientRoutes);
  const [patients, setPatients] = useState<AppointmentPatient[]>([]);
  const [selectedPatient, setSelectedPatient] =
    useState<AppointmentPatient | null>(null);

  const { data: userData } = useQuery({
    queryKey: ["patients", tokenData.phoneNumber],
    queryFn: query(routes.otp.getPatient, {
      headers: {
        Authorization: `Bearer ${tokenData.token}`,
      },
    }),
    enabled: !!tokenData.token,
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

  if (!pages) {
    return <SessionRouter />;
  }

  const patientUserContext: PatientUserContextType = {
    patients,
    selectedPatient,
    setSelectedPatient,
    tokenData,
  };

  return (
    <PatientUserContext.Provider value={patientUserContext}>
      <SidebarProvider>
        <AppSidebar
          patientUserContext={patientUserContext}
          facilitySidebar={false}
        />

        <main
          id="pages"
          className="flex-1 overflow-y-auto bg-gray-100 focus:outline-none md:pb-2 md:pr-2"
        >
          <div className="relative z-10 flex h-16 shrink-0 bg-white shadow md:hidden">
            <div className="flex items-center">
              <SidebarTrigger className="px-2" />
            </div>
            <a
              href="/"
              className="flex h-full w-full items-center px-4 md:hidden"
            >
              <img
                className="h-8 w-auto"
                src={careConfig.mainLogo?.dark}
                alt="care logo"
              />
            </a>
          </div>
          <div
            className="max-w-8xl mx-auto mt-4 min-h-[96vh] rounded-lg border bg-gray-50 p-3 shadow"
            data-cui-page
          >
            <ErrorBoundary fallback={<ErrorPage forError="PAGE_LOAD_ERROR" />}>
              {pages}
            </ErrorBoundary>
          </div>
        </main>
      </SidebarProvider>
    </PatientUserContext.Provider>
  );
}
