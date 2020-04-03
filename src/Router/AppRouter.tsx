import { useRedirect, useRoutes } from "hookrouter";
import React from "react";
import AmbulanceList from "../Components/Ambulance/AmbulanceList";
import Header from "../Components/Common/Header";
import { Analytics } from "../Components/Dashboard/Analytics";
import { BedCapacityForm } from "../Components/Facility/BedCapacityForm";
import { CareCenterJoinForm } from "../Components/Facility/CareCenterJoinForm";
import { Consultation } from "../Components/Facility/Consultation";
import { DoctorCapacityForm } from "../Components/Facility/DoctorCapacityForm";
import { FacilityCreate } from "../Components/Facility/FacilityCreate";
import { FacilityHome } from "../Components/Facility/FacilityHome";
import { HospitalList } from "../Components/Facility/HospitalList";
import { TriageForm } from "../Components/Facility/TriageForm";
import { DailyRounds } from "../Components/Patient/DailyRounds";
import { DailyRoundsList } from "../Components/Patient/DailyRoundsList";
import { PatientManager } from "../Components/Patient/ManagePatients";
import { PatientDischarge } from "../Components/Patient/PatientDischarge";
import { PatientHome } from "../Components/Patient/PatientHome";
import { PatientRegister } from "../Components/Patient/PatientRegister";
import { SampleTest } from "../Components/Patient/SampleTest";
import SampleViewAdmin from "../Components/Patient/SampleViewAdmin";
import { SampleDetails } from "../Components/Patient/SampleDetails";
import { TeleConsultation } from "../Components/Patient/TeleConsultation";
import { TreatmentForm } from "../Components/Patient/TreatmentForm";
import ManageUsers from "../Components/Users/ManageUsers";

const routes = {
  "/": () => <HospitalList />,
  "/analytics": () => <Analytics />,
  "/ambulancelist": () => <AmbulanceList />,
  "/samplelist": () => <SampleViewAdmin />,
  "/samplelist/:id": ({ id }: any) => <SampleDetails id={id} />,
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
  "/facility/:facilityId/patient/:patientId/consultation": ({
    facilityId,
    patientId
  }: any) => <Consultation facilityId={facilityId} patientId={patientId} />,
  "/facility/:facilityId/patient/:patientId/consultation/:id": ({
    facilityId,
    patientId,
    id
  }: any) => (
    <Consultation facilityId={facilityId} patientId={patientId} id={id} />
  ),
  "/facility/:facilityId/patient/:patientId/sample-test": ({
    facilityId,
    patientId
  }: any) => <SampleTest facilityId={facilityId} patientId={patientId} />,
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
  "/facility/:facilityId/consultation/:id": ({ facilityId, id }: any) => (
    <Consultation facilityId={facilityId} id={id} />
  ),
  "/patients": () => <PatientManager />,
  "/patient/:id": ({ id }: any) => <PatientHome id={id} />,
  "/patient/tele-consult": () => <TeleConsultation />,
  "/patient/discharge": () => <PatientDischarge />,
  "/patient/treatment": () => <TreatmentForm />,
  "/users": () => <ManageUsers />,
  "/join": () => <CareCenterJoinForm />,
  "/daily-rounds": () => <DailyRounds />,
  "/daily-rounds-list": () => <DailyRoundsList />
};

const AppRouter = () => {
  useRedirect("/", "/facility");
  const pages = useRoutes(routes);
  return (
    <div className="min-h-full flex flex-col items-stretch">
      <div className="flex-grow bg-gray-100">
        <div className="antialiased flex flex-col md:flex-row  h-screen overflow-hidden">
          <div className="flex school-admin-navbar flex-shrink-0">
            <Header />
          </div>
          <div className="flex-1 flex flex-col bg-gray-200 overflow-y-auto">
            <div className="max-w-3xl mx-auto my-4 md:my-10 flex-1 w-full">
              {pages}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppRouter;
