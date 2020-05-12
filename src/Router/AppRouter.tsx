import { useRedirect, useRoutes } from "hookrouter";
import React, { useEffect, useState } from "react";
import { navigate, usePath, A } from "hookrouter";
import { get } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import AmbulanceList from "../Components/Ambulance/AmbulanceList";
import Header from "../Components/Common/Header";
import { Analytics } from "../Components/Dashboard/Analytics";
import { BedCapacityForm } from "../Components/Facility/BedCapacityForm";
import { CareCenterJoinForm } from "../Components/Facility/CareCenterJoinForm";
import { ConsultationDetails } from "../Components/Facility/ConsultationDetails";
import { ConsultationForm } from "../Components/Facility/ConsultationForm";
import { DoctorCapacityForm } from "../Components/Facility/DoctorCapacityForm";
import { FacilityCreate } from "../Components/Facility/FacilityCreate";
import { FacilityHome } from "../Components/Facility/FacilityHome";
import { HospitalList } from "../Components/Facility/HospitalList";
import { TriageForm } from "../Components/Facility/TriageForm";
import { DailyRoundListDetails } from "../Components/Patient/DailyRoundListDetails";
import { DailyRounds } from "../Components/Patient/DailyRounds";
import { PatientManager } from "../Components/Patient/ManagePatients";
import { PatientDischarge } from "../Components/Patient/PatientDischarge";
import { PatientHome } from "../Components/Patient/PatientHome";
import { PatientRegister } from "../Components/Patient/PatientRegister";
import { SampleDetails } from "../Components/Patient/SampleDetails";
import SampleReport from "../Components/Patient/SamplePreview";
import { SampleTest } from "../Components/Patient/SampleTest";
import SampleViewAdmin from "../Components/Patient/SampleViewAdmin";
import { TeleConsultation } from "../Components/Patient/TeleConsultation";
import { TreatmentForm } from "../Components/Patient/TreatmentForm";
import ManageUsers from "../Components/Users/ManageUsers";
import { UserAdd } from "../Components/Users/UserAdd";
import AmbulanceOnboarding from "../Components/Ambulance/AmbulanceOnboarding";
const img =
  "https://care-staging-coronasafe.s3.amazonaws.com/static/images/logos/light-logo.svg";
const logoBlack =
  "https://care-staging-coronasafe.s3.amazonaws.com/static/images/logos/black-logo.svg";

const routes = {
  "/": () => <HospitalList />,
  "/users": () => <ManageUsers />,
  "/user/add": () => <UserAdd />,
  "/join": () => <CareCenterJoinForm />,
  "/analytics": () => <Analytics />,
  "/ambulance": () => <AmbulanceList />,
  "/ambulance/add": () => <AmbulanceOnboarding />,
  "/patients": () => <PatientManager />,
  "/patient/:id": ({ id }: any) => <PatientHome id={id} />,
  "/patient/tele-consult": () => <TeleConsultation />,
  "/patient/discharge": () => <PatientDischarge />,
  "/patient/treatment": () => <TreatmentForm />,
  "/sample": () => <SampleViewAdmin />,
  "/sample/:id": ({ id }: any) => <SampleDetails id={id} />,
  '/sample/report/:patientId': ({ patientId }: any) => <SampleReport id={patientId} />,
  "/facility": () => <HospitalList />,
  "/facility/create": () => <FacilityCreate />,
  "/facility/:facilityId/update": ({ facilityId }: any) => (
    <FacilityCreate facilityId={facilityId} />
  ),
  "/facility/:facilityId": ({ facilityId }: any) => (
    <FacilityHome facilityId={facilityId} />
  ),
  "/facility/:facilityId/triage": ({ facilityId }: any) => (
    <TriageForm facilityId={facilityId} />
  ),
  "/facility/:facilityId/bed": ({ facilityId }: any) => (
    <BedCapacityForm facilityId={facilityId} />
  ),
  "/facility/:facilityId/doctor": ({ facilityId }: any) => (
    <DoctorCapacityForm facilityId={facilityId} />
  ),
  "/facility/:facilityId/patients": ({ facilityId }: any) => (
    <PatientManager facilityId={facilityId} />
  ),
  "/facility/:facilityId/patient": ({ facilityId }: any) => (
    <PatientRegister facilityId={facilityId} />
  ),
  "/facility/:facilityId/patient/:id": ({ facilityId, id }: any) => (
    <PatientHome facilityId={facilityId} id={id} />
  ),
  "/facility/:facilityId/patient/:id/update": ({ facilityId, id }: any) => (
    <PatientRegister facilityId={facilityId} id={id} />
  ),
  "/facility/:facilityId/patient/:patientId/sample-test": ({ facilityId, patientId }: any) => (
    <SampleTest facilityId={facilityId} patientId={patientId} />
  ),
  "/facility/:facilityId/patient/:patientId/sample/:id": ({ id }: any) => (
    <SampleDetails id={id} />
  ),
  "/facility/:facilityId/patient/:id/treatment": ({ facilityId, id }: any) => (
    <TreatmentForm facilityId={facilityId} id={id} />
  ),
  "/facility/:facilityId/triage/:id": ({ facilityId, id }: any) => (
    <TriageForm facilityId={facilityId} id={id} />
  ),
  "/facility/:facilityId/bed/:id": ({ facilityId, id }: any) => (
    <BedCapacityForm facilityId={facilityId} id={id} />
  ),
  "/facility/:facilityId/doctor/:id": ({ facilityId, id }: any) => (
    <DoctorCapacityForm facilityId={facilityId} id={id} />
  ),
  "/facility/:facilityId/patient/:patientId/consultation": ({ facilityId, patientId }: any) => (
    <ConsultationForm facilityId={facilityId} patientId={patientId} />
  ),
  "/facility/:facilityId/patient/:patientId/consultation/:id/update": ({ facilityId, patientId, id }: any) => (
    <ConsultationForm facilityId={facilityId} patientId={patientId} id={id} />
  ),
  "/facility/:facilityId/patient/:patientId/consultation/:id/": ({ facilityId, patientId, id }: any) => (
    <ConsultationDetails facilityId={facilityId} patientId={patientId} consultationId={id} />
  ),
  "/facility/:facilityId/patient/:patientId/consultation/:id/daily-rounds": ({ facilityId, patientId, id }: any) => (
    <DailyRounds facilityId={facilityId} patientId={patientId} consultationId={id} />
  ),
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/daily-rounds/:id/update": ({ facilityId, patientId, consultationId, id }: any) => (
    <DailyRounds facilityId={facilityId} patientId={patientId} consultationId={consultationId} id={id} />
  ),
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/daily-rounds/:id": ({ facilityId, patientId, consultationId, id }: any) => (
    <DailyRoundListDetails facilityId={facilityId} patientId={patientId} consultationId={consultationId} id={id} />
  ),
};

let menus = [
  {
    title: "Facilities",
    link: "/facility",
    icon: "fas fa-hospital"
  },
  {
    title: 'Patients / Suspects',
    link: '/patients',
    icon: "fas fa-user-injured"
  },
  {
    title: "Ambulances",
    link: "/ambulance",
    icon: "fas fa-ambulance"
  },
  {
    title: "Sample Test",
    link: "/sample",
    icon: "fas fa-cog"
  },
  {
    title: "Users",
    link: "/users",
    icon: "fas fa-user-friends"
  }
];


const AppRouter = () => {
  useRedirect("/", "/facility");
  const pages = useRoutes(routes);
  const path = usePath();
  const url = path.split("/");
  const state: any = useSelector(state => state);
  const { currentUser } = state;
  const [drawer, setDrawer] = useState(false);
  const loginUser = `${get(currentUser, "data.first_name", "")} ${get(
    currentUser,
    "data.last_name",
    ""
  )}`;

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {
        drawer &&
        <div className="md:hidden">
          <div className="fixed inset-0 flex z-40">
            <div className="fixed inset-0">
              <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
            </div>
            <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-green-800">
              <div className="absolute top-0 right-0 -mr-14 p-1">
                <button onClick={_ => setDrawer(false)} className="flex items-center justify-center h-12 w-12 rounded-full focus:outline-none focus:bg-gray-600" aria-label="Close sidebar">
                  <svg className="h-6 w-6 text-white" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-shrink-0 flex items-center px-4">
                <a href="/">
                  <img className="h-8 w-auto" src={img} alt="care logo" />
                </a>
              </div>
              <div className="mt-5 flex-1 h-0 overflow-y-auto">
                <nav className="px-2">
                  {menus.map(item => {
                    const parts = item.link.split("/");
                    const selectedClasses = url.includes(parts && parts[1])
                      ? "group flex items-center px-2 py-2 text-sm leading-5 font-medium text-white rounded-md bg-green-900 focus:outline-none focus:bg-green-700 transition ease-in-out duration-150"
                      : "mt-1 group flex items-center px-2 py-2 text-md leading-5 font-medium text-green-300 rounded-md hover:text-white hover:bg-green-700 focus:outline-none focus:text-white focus:bg-green-700 transition ease-in-out duration-150";
                    return (
                      <a
                        key={item.title}
                        onClick={() => navigate(item.link)}
                        className={selectedClasses}
                      >
                        <i className={item.icon + (url.includes(parts && parts[1]) ? " text-white" : " text-green-400") + " mr-3 text-md group-hover:text-green-300 group-focus:text-green-300 transition ease-in-out duration-150"}>
                        </i>
                        {item.title}
                      </a>
                    );
                  })}
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-green-700 p-4">
                <a href="#" className="flex-shrink-0 w-full group block">
                  <div className="flex items-center">
                    <div>
                      <div className="rounded-full h-8 w-8 flex items-center bg-white justify-center">
                        <i className="inline-block fas fa-user text-xl text-green-700"></i>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm leading-5 font-medium text-white">
                        {loginUser}
                      </p>
                      <p onClick={() => {
                        localStorage.removeItem("care_access_token");
                        localStorage.removeItem("care_refresh_token");
                        navigate("/login");
                        window.location.reload();
                      }} className="text-xs leading-4 font-medium text-green-300 group-hover:text-green-100 transition ease-in-out duration-150">
                        Sign Out
                  </p>
                    </div>
                  </div>
                </a>
              </div>
            </div>
            <div className="flex-shrink-0 w-14">
            </div>
          </div>
        </div>
      }

      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-green-800 pt-5 pb-4">
          <div className="flex items-center flex-shrink-0 px-4">
            <a href="/">
              <img className="h-8 w-auto" src={img} alt="care logo" />
            </a>
          </div>
          <div className="mt-5 h-0 flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 bg-green-800">
              {menus.map(item => {
                const parts = item.link.split("/");
                const selectedClasses = url.includes(parts && parts[1])
                  ? "group flex items-center px-2 py-2 text-sm leading-5 font-medium text-white rounded-md bg-green-900 focus:outline-none focus:bg-green-700 transition ease-in-out duration-150"
                  : "mt-1 group flex items-center px-2 py-2 text-md leading-5 font-medium text-green-300 rounded-md hover:text-white hover:bg-green-700 focus:outline-none focus:text-white focus:bg-green-700 transition ease-in-out duration-150";
                return (
                  <a
                    key={item.title}
                    onClick={() => navigate(item.link)}
                    className={selectedClasses}
                  >
                    <i className={item.icon + (url.includes(parts && parts[1]) ? " text-white" : " text-green-400") + " mr-3 text-md group-hover:text-green-300 group-focus:text-green-300 transition ease-in-out duration-150"}>
                    </i>
                    {item.title}
                  </a>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-green-700 p-4">
            <a href="#" className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div>
                  <div className="rounded-full h-8 w-8 flex items-center bg-white justify-center">
                    <i className="inline-block fas fa-user text-xl text-green-700"></i>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm leading-5 font-medium text-white">
                    {loginUser}
                  </p>
                  <p onClick={() => {
                    localStorage.removeItem("care_access_token");
                    localStorage.removeItem("care_refresh_token");
                    navigate("/login");
                    window.location.reload();
                  }} className="text-xs leading-4 font-medium text-green-300 group-hover:text-green-100 transition ease-in-out duration-150">
                    Sign Out
                  </p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
      <div className="flex flex-col w-full flex-1 overflow-hidden">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button onClick={_ => setDrawer(true)} className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:bg-gray-100 focus:text-gray-600 md:hidden" aria-label="Open sidebar">
            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
          <a href="/" className="md:hidden flex h-full w-full items-center px-4">
            <img className="h-8 w-auto" src={logoBlack} alt="care logo" />
          </a>
        </div>

        <main className="flex-1 relative z-0 overflow-y-auto py-6 focus:outline-none" >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            {pages}
          </div>
        </main>
      </div>
    </div>

  );
};

export default AppRouter;
