import careConfig from "@careConfig";
import { usePath, useRoutes } from "raviger";
import { useEffect, useState } from "react";

import Login from "@/components/Auth/Login";
import ErrorBoundary from "@/components/Common/ErrorBoundary";
import {
  OTPPatientDesktopSidebar,
  OTPPatientMobileSidebar,
  SIDEBAR_SHRINK_PREFERENCE_KEY,
} from "@/components/Common/Sidebar/OTPPatientSidebar";
import { SidebarShrinkContext } from "@/components/Common/Sidebar/Sidebar";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import { AppointmentSuccess } from "@/pages/Appoinments/Success";
import OTPPatientHome from "@/pages/Patient/index";

const routes = {
  "/facility/:facilityId/appointments/:appointmentId/success": ({
    appointmentId,
  }: {
    appointmentId: string;
  }) => <AppointmentSuccess appointmentId={appointmentId} />,
  "/patient/home": () => <OTPPatientHome />,
};

export default function OTPPatientRouter() {
  const pages = useRoutes(routes);

  const path = usePath();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
    const pageContainer = window.document.getElementById("pages");
    pageContainer?.scroll(0, 0);
  }, [path]);

  const [shrinked, setShrinked] = useState(
    localStorage.getItem(SIDEBAR_SHRINK_PREFERENCE_KEY) === "true",
  );

  useEffect(() => {
    localStorage.setItem(
      SIDEBAR_SHRINK_PREFERENCE_KEY,
      shrinked ? "true" : "false",
    );
  }, [shrinked]);

  if (!pages) {
    return <Login />;
  }

  return (
    <SidebarShrinkContext.Provider value={{ shrinked, setShrinked }}>
      <div className="flex h-screen overflow-hidden bg-secondary-100 print:overflow-visible">
        <>
          <div className="block md:hidden">
            <OTPPatientMobileSidebar
              open={sidebarOpen}
              setOpen={setSidebarOpen}
            />{" "}
          </div>
          <div className="hidden md:block">
            <OTPPatientDesktopSidebar />
          </div>
        </>

        <div className="relative flex w-full flex-1 flex-col overflow-hidden bg-gray-100 print:overflow-visible">
          <div className="relative z-10 flex h-16 shrink-0 bg-white shadow md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="border-r border-secondary-200 px-4 text-secondary-500 focus:bg-secondary-100 focus:text-secondary-600 focus:outline-none md:hidden"
              aria-label="Open sidebar"
            >
              <svg
                className="h-6 w-6"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
            </button>
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

          <main
            id="pages"
            className="flex-1 overflow-y-auto bg-gray-100 focus:outline-none md:pb-2 md:pr-2"
          >
            <div
              className="max-w-8xl mx-auto mt-4 min-h-[96vh] rounded-lg border bg-gray-50 p-3 shadow"
              data-cui-page
            >
              <ErrorBoundary
                fallback={<ErrorPage forError="PAGE_LOAD_ERROR" />}
              >
                {pages}
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </SidebarShrinkContext.Provider>
  );
}
