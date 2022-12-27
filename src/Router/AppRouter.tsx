import { useRedirect, useRoutes, usePath, Redirect } from "raviger";
import { useState, useEffect } from "react";
import { BedCapacityForm } from "../Components/Facility/BedCapacityForm";
import { ConsultationDetails } from "../Components/Facility/ConsultationDetails";
import TreatmentSummary from "../Components/Facility/TreatmentSummary";
import { ConsultationForm } from "../Components/Facility/ConsultationForm";
import { DoctorCapacityForm } from "../Components/Facility/DoctorCapacityForm";
import { FacilityCreate } from "../Components/Facility/FacilityCreate";
import { FacilityHome } from "../Components/Facility/FacilityHome";
import { HospitalList } from "../Components/Facility/HospitalList";
import { TriageForm } from "../Components/Facility/TriageForm";
import { DailyRounds } from "../Components/Patient/DailyRounds";
import { PatientManager } from "../Components/Patient/ManagePatients";
import PatientNotes from "../Components/Patient/PatientNotes";
import { PatientHome } from "../Components/Patient/PatientHome";
import { PatientRegister } from "../Components/Patient/PatientRegister";
import { SampleDetails } from "../Components/Patient/SampleDetails";
import SampleReport from "../Components/Patient/SamplePreview";
import { SampleTest } from "../Components/Patient/SampleTest";
import SampleViewAdmin from "../Components/Patient/SampleViewAdmin";
import ManageUsers from "../Components/Users/ManageUsers";
import { UserAdd } from "../Components/Users/UserAdd";
import InventoryList from "../Components/Facility/InventoryList";
import InventoryLog from "../Components/Facility/InventoryLog";
import { AddInventoryForm } from "../Components/Facility/AddInventoryForm";
import { SetInventoryForm } from "../Components/Facility/SetInventoryForm";
import MinQuantityList from "../Components/Facility/MinQuantityList";
import { UpdateMinQuantity } from "../Components/Facility/UpdateMinQuantity";
import { ShiftCreate } from "../Components/Patient/ShiftCreate";
import UserProfile from "../Components/Users/UserProfile";
import ShiftBoardView from "../Components/Shifting/BoardView";
import ShiftListView from "../Components/Shifting/ListView";
import ShiftDetails from "../Components/Shifting/ShiftDetails";
import { ShiftDetailsUpdate } from "../Components/Shifting/ShiftDetailsUpdate";
import ResourceCreate from "../Components/Resource/ResourceCreate";
import ResourceBoardView from "../Components/Resource/ResourceBoardView";
import ResourceListView from "../Components/Resource/ListView";
import ResourceDetails from "../Components/Resource/ResourceDetails";
import { ResourceDetailsUpdate } from "../Components/Resource/ResourceDetailsUpdate";
import ResultList from "../Components/ExternalResult/ResultList";
import ResultItem from "../Components/ExternalResult/ResultItem";
import ExternalResultUpload from "../Components/ExternalResult/ExternalResultUpload";
import ResultUpdate from "../Components/ExternalResult/ResultUpdate";
import { FileUpload } from "../Components/Patient/FileUpload";
import Investigation from "../Components/Facility/Investigations";
import ShowInvestigation from "../Components/Facility/Investigations/ShowInvestigation";
import InvestigationReports from "../Components/Facility/Investigations/Reports";
import AssetCreate from "../Components/Facility/AssetCreate";
import DeathReport from "../Components/DeathReport/DeathReport";
import { make as CriticalCareRecording } from "../Components/CriticalCareRecording/CriticalCareRecording.gen";
import ShowPushNotification from "../Components/Notifications/ShowPushNotification";
import { NoticeBoard } from "../Components/Notifications/NoticeBoard";
import { AddLocationForm } from "../Components/Facility/AddLocationForm";
import { AddBedForm } from "../Components/Facility/AddBedForm";
import { LocationManagement } from "../Components/Facility/LocationManagement";
import { BedManagement } from "../Components/Facility/BedManagement";
import AssetsList from "../Components/Assets/AssetsList";
import AssetManage from "../Components/Assets/AssetManage";
import AssetConfigure from "../Components/Assets/AssetConfigure";
import { DailyRoundListDetails } from "../Components/Patient/DailyRoundListDetails";
import HubDashboard from "../Components/Dashboard/HubDashboard";
import Error404 from "../Components/ErrorPages/404";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import FacilityUsers from "../Components/Facility/FacilityUsers";
import {
  DesktopSidebar,
  MobileSidebar,
} from "../Components/Common/Sidebar/Sidebar";
import { BLACKLISTED_PATHS } from "../Common/constants";
import { UpdateFacilityMiddleware } from "../Components/Facility/UpdateFacilityMiddleware";

const logoBlack = process.env.REACT_APP_BLACK_LOGO;

const routes = {
  "/hub": () => <HubDashboard />,
  "/": () => <HospitalList />,
  "/users": () => <ManageUsers />,
  "/users/add": () => <UserAdd />,
  "/user/profile": () => <UserProfile />,
  "/patients": () => <PatientManager />,
  "/patient/:id": ({ id }: any) => <PatientHome id={id} />,
  "/patient/:id/investigation_reports": ({ id }: any) => (
    <InvestigationReports id={id} />
  ),
  "/sample": () => <SampleViewAdmin />,
  "/sample/:id": ({ id }: any) => <SampleDetails id={id} />,
  "/patient/:patientId/test_sample/:sampleId/icmr_sample": ({
    patientId,
    sampleId,
  }: any) => <SampleReport id={patientId} sampleId={sampleId} />,
  "/facility": () => <HospitalList />,
  "/facility/create": () => <FacilityCreate />,
  "/facility/:facilityId/update": ({ facilityId }: any) => (
    <FacilityCreate facilityId={facilityId} />
  ),
  "/facility/:facilityId/middleware/update": ({ facilityId }: any) => (
    <UpdateFacilityMiddleware facilityId={facilityId} />
  ),
  "/facility/:facilityId": ({ facilityId }: any) => (
    <FacilityHome facilityId={facilityId} />
  ),
  "/facility/:facilityId/users": ({ facilityId }: any) => (
    <FacilityUsers facilityId={facilityId} />
  ),
  "/facility/:facilityId/resource/new": ({ facilityId }: any) => (
    <ResourceCreate facilityId={facilityId} />
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
  "/facility/:facilityId/patient/:patientId/sample-test": ({
    facilityId,
    patientId,
  }: any) => <SampleTest facilityId={facilityId} patientId={patientId} />,
  "/facility/:facilityId/patient/:patientId/sample/:id": ({ id }: any) => (
    <SampleDetails id={id} />
  ),
  "/facility/:facilityId/patient/:patientId/notes": ({
    facilityId,
    patientId,
  }: any) => <PatientNotes patientId={patientId} facilityId={facilityId} />,
  "/facility/:facilityId/patient/:patientId/files": ({
    facilityId,
    patientId,
  }: any) => (
    <FileUpload
      patientId={patientId}
      facilityId={facilityId}
      consultationId=""
      type="PATIENT"
      hideBack={false}
      audio={true}
      unspecified={true}
    />
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
  "/facility/:facilityId/patient/:patientId/consultation": ({
    facilityId,
    patientId,
  }: any) => <ConsultationForm facilityId={facilityId} patientId={patientId} />,
  "/facility/:facilityId/patient/:patientId/consultation/:id/update": ({
    facilityId,
    patientId,
    id,
  }: any) => (
    <ConsultationForm facilityId={facilityId} patientId={patientId} id={id} />
  ),
  "/facility/:facilityId/patient/:patientId/consultation/:id/files/": ({
    facilityId,
    patientId,
    id,
  }: any) => (
    <FileUpload
      facilityId={facilityId}
      patientId={patientId}
      consultationId={id}
      type="CONSULTATION"
      hideBack={false}
      audio={true}
      unspecified={true}
    />
  ),
  "/facility/:facilityId/patient/:patientId/consultation/:id/investigation": ({
    facilityId,
    patientId,
    id,
  }: any) => (
    <Investigation
      consultationId={id}
      facilityId={facilityId}
      patientId={patientId}
    />
  ),
  "/facility/:facilityId/patient/:patientId/consultation/:id/investigation/:sessionId":
    ({ facilityId, patientId, id, sessionId }: any) => (
      <ShowInvestigation
        consultationId={id}
        facilityId={facilityId}
        patientId={patientId}
        sessionId={sessionId}
      />
    ),
  "/facility/:facilityId/patient/:patientId/consultation/:id/daily-rounds": ({
    facilityId,
    patientId,
    id,
  }: any) => (
    <DailyRounds
      facilityId={facilityId}
      patientId={patientId}
      consultationId={id}
    />
  ),
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/daily-rounds/:id/update":
    ({ facilityId, patientId, consultationId, id }: any) => (
      <DailyRounds
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
        id={id}
      />
    ),
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/daily-rounds/:id":
    ({ facilityId, patientId, consultationId, id }: any) => (
      <DailyRoundListDetails
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
        id={id}
      />
    ),

  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/daily_rounds/:id":
    ({ facilityId, patientId, consultationId, id }: any) => (
      <CriticalCareRecording
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
        id={id}
        preview={true}
      />
    ),
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/daily_rounds/:id/update":
    ({ facilityId, patientId, consultationId, id }: any) => (
      <CriticalCareRecording
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
        id={id}
        preview={false}
      />
    ),
  "/facility/:facilityId/patient/:patientId/shift/new": ({
    facilityId,
    patientId,
  }: any) => <ShiftCreate facilityId={facilityId} patientId={patientId} />,
  "/facility/:facilityId/inventory": ({ facilityId }: any) => (
    <InventoryList facilityId={facilityId} />
  ),
  "/facility/:facilityId/location": ({ facilityId }: any) => (
    <LocationManagement facilityId={facilityId} />
  ),
  "/facility/:facilityId/location/:locationId/beds": ({
    facilityId,
    locationId,
  }: any) => <BedManagement facilityId={facilityId} locationId={locationId} />,
  "/facility/:facilityId/inventory/add": ({ facilityId }: any) => (
    <AddInventoryForm facilityId={facilityId} />
  ),
  "/facility/:facilityId/location/add": ({ facilityId }: any) => (
    <AddLocationForm facilityId={facilityId} />
  ),
  "/facility/:facilityId/location/:locationId/update": ({
    facilityId,
    locationId,
  }: any) => (
    <AddLocationForm facilityId={facilityId} locationId={locationId} />
  ),
  "/facility/:facilityId/location/:locationId/beds/add": ({
    facilityId,
    locationId,
  }: any) => <AddBedForm facilityId={facilityId} locationId={locationId} />,
  "/facility/:facilityId/location/:locationId/beds/:bedId/update": ({
    facilityId,
    locationId,
    bedId,
  }: any) => (
    <AddBedForm facilityId={facilityId} locationId={locationId} bedId={bedId} />
  ),
  "/facility/:facilityId/inventory/min_quantity/set": ({ facilityId }: any) => (
    <SetInventoryForm facilityId={facilityId} />
  ),
  "/facility/:facilityId/inventory/min_quantity/list": ({
    facilityId,
  }: any) => <MinQuantityList facilityId={facilityId} />,
  "/facility/:facilityId/inventory/min_quantity": ({ facilityId }: any) => (
    <Redirect to={`/facility/${facilityId}/inventory/min_quantity/list`} />
  ),
  "/facility/:facilityId/inventory/:inventoryId": ({
    facilityId,
    inventoryId,
  }: any) => <InventoryLog facilityId={facilityId} inventoryId={inventoryId} />,
  "/facility/:facilityId/inventory/:inventoryId/update/:itemId": ({
    facilityId,
    inventoryId,
    itemId,
  }: any) => (
    <UpdateMinQuantity
      facilityId={facilityId}
      inventoryId={inventoryId}
      itemId={itemId}
    />
  ),
  "/facility/:facilityId/assets/new": ({ facilityId }: any) => (
    <AssetCreate facilityId={facilityId} />
  ),
  "/facility/:facilityId/assets/:assetId/update": ({
    facilityId,
    assetId,
  }: any) => <AssetCreate facilityId={facilityId} assetId={assetId} />,
  "/assets": () => <AssetsList />,
  "/facility/:facilityId/assets/:assetId": ({ assetId, facilityId }: any) => (
    <AssetManage assetId={assetId} facilityId={facilityId} />
  ),
  "/facility/:facilityId/assets/:assetId/configure": ({
    assetId,
    facilityId,
  }: any) => <AssetConfigure assetId={assetId} facilityId={facilityId} />,

  "/shifting": () =>
    localStorage.getItem("defaultShiftView") === "list" ? (
      <ShiftListView />
    ) : (
      <DndProvider backend={HTML5Backend}>
        <ShiftBoardView />
      </DndProvider>
    ),
  "/shifting/board-view": () => (
    <DndProvider backend={HTML5Backend}>
      <ShiftBoardView />
    </DndProvider>
  ),
  "/shifting/list-view": () => <ShiftListView />,
  "/shifting/:id": ({ id }: any) => <ShiftDetails id={id} />,
  "/shifting/:id/update": ({ id }: any) => <ShiftDetailsUpdate id={id} />,
  "/resource": () =>
    localStorage.getItem("defaultResourceView") === "list" ? (
      <ResourceListView />
    ) : (
      <DndProvider backend={HTML5Backend}>
        <ResourceBoardView />
      </DndProvider>
    ),

  "/resource/board-view": () => (
    <DndProvider backend={HTML5Backend}>
      <ResourceBoardView />
    </DndProvider>
  ),
  "/resource/list-view": () => <ResourceListView />,
  "/resource/:id": ({ id }: any) => <ResourceDetails id={id} />,
  "/resource/:id/update": ({ id }: any) => <ResourceDetailsUpdate id={id} />,
  "/external_results": () => <ResultList />,
  "/external_results/upload": () => <ExternalResultUpload />,
  "/external_results/:id": ({ id }: any) => <ResultItem id={id} />,
  "/external_results/:id/update": ({ id }: any) => <ResultUpdate id={id} />,
  "/death_report/:id": ({ id }: any) => <DeathReport id={id} />,
  "/notifications/:id": (id: any) => <ShowPushNotification external_id={id} />,
  "/notice_board": () => <NoticeBoard />,
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId": ({
    facilityId,
    patientId,
    consultationId,
  }: any) => (
    <ConsultationDetails
      facilityId={facilityId}
      patientId={patientId}
      consultationId={consultationId}
      tab={"updates"}
    />
  ),
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/treatment-summary":
    ({ facilityId, patientId, consultationId }: any) => (
      <TreatmentSummary
        facilityId={facilityId}
        consultationId={consultationId}
        patientId={patientId}
        dailyRoundsListData={[]}
      />
    ),
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/:tab":
    ({ facilityId, patientId, consultationId, tab }: any) => (
      <ConsultationDetails
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
        tab={tab}
      />
    ),
  "/not-found": () => <Error404 />,
};

export default function AppRouter() {
  useRedirect("/", "/facility");
  useRedirect("/user", "/users");
  const pages = useRoutes(routes) || <Error404 />;
  const path = usePath();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
    let flag = false;
    if (path) {
      BLACKLISTED_PATHS.forEach((regex: RegExp) => {
        flag = flag || regex.test(path);
      });
      if (!flag) {
        const pageContainer = window.document.getElementById("pages");
        pageContainer?.scroll(0, 0);
      }
    }
  }, [path]);

  return (
    <div className="absolute inset-0 h-screen flex overflow-hidden bg-gray-100">
      <>
        <div className="block md:hidden">
          <MobileSidebar open={sidebarOpen} setOpen={setSidebarOpen} />{" "}
        </div>
        <div className="md:block hidden">
          <DesktopSidebar />
        </div>
      </>

      <div className="flex flex-col w-full flex-1 overflow-hidden">
        <div className="flex md:hidden relative z-10 shrink-0 h-16 bg-white shadow">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:bg-gray-100 focus:text-gray-600 md:hidden"
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
            className="md:hidden flex h-full w-full items-center px-4"
          >
            <img className="h-6 w-auto" src={logoBlack} alt="care logo" />
          </a>
        </div>

        <main
          id="pages"
          className="flex-1 overflow-y-scroll pb-4 md:py-0 focus:outline-none"
        >
          <div className="max-w-8xl mx-auto px-3 py-3">{pages}</div>
        </main>
      </div>
    </div>
  );
}
