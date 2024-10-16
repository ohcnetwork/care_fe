import InvestigationReports from "../../Components/Facility/Investigations/Reports";
import { PatientManager } from "../../Components/Patient/ManagePatients";
import { PatientHome } from "../../Components/Patient/PatientHome";
import PatientNotes from "../../Components/Patient/PatientNotes";
import { PatientRegister } from "../../Components/Patient/PatientRegister";
import DeathReport from "../../Components/DeathReport/DeathReport";
import { InsuranceDetails } from "../../Components/Patient/InsuranceDetails";
import FileUploadPage from "../../Components/Patient/FileUploadPage";
import { AppRoutes } from "../AppRouter";

const PatientRoutes: AppRoutes = {
  "/patients": () => <PatientManager />,
  "/patient/:id": ({ id }) => <PatientHome id={id} />,
  "/patient/:id/investigation_reports": ({ id }) => (
    <InvestigationReports id={id} />
  ),
  "/facility/:facilityId/patient": ({ facilityId }) => (
    <PatientRegister facilityId={facilityId} />
  ),
  "/facility/:facilityId/patient/:id": ({ facilityId, id }) => (
    <PatientHome facilityId={facilityId} id={id} />
  ),
  "/facility/:facilityId/patient/:id/insurance": ({ facilityId, id }) => (
    <InsuranceDetails facilityId={facilityId} id={id} />
  ),
  "/facility/:facilityId/patient/:id/update": ({ facilityId, id }) => (
    <PatientRegister facilityId={facilityId} id={id} />
  ),
  "/facility/:facilityId/patient/:patientId/notes": ({
    facilityId,
    patientId,
  }) => <PatientNotes patientId={patientId} facilityId={facilityId} />,
  "/facility/:facilityId/patient/:patientId/files": ({
    facilityId,
    patientId,
  }) => (
    <FileUploadPage
      facilityId={facilityId}
      patientId={patientId}
      type="PATIENT"
    />
  ),
  "/death_report/:id": ({ id }) => <DeathReport id={id} />,
};

export default PatientRoutes;
