import InvestigationReports from "../../Components/Facility/Investigations/Reports";
import { PatientManager } from "../../Components/Patient/ManagePatients";
import { PatientHome } from "../../Components/Patient/PatientHome";
import PatientNotes from "../../Components/Patient/PatientNotes";
import { PatientRegister } from "../../Components/Patient/PatientRegister";
import { DetailRoute } from "../types";
import DeathReport from "../../Components/DeathReport/DeathReport";
import { InsuranceDetails } from "../../Components/Patient/InsuranceDetails";
import FileUploadPage from "../../Components/Patient/FileUploadPage";

export default {
  "/patients": () => <PatientManager />,
  "/patient/:id": ({ id }: DetailRoute) => <PatientHome id={id} />,
  "/patient/:id/investigation_reports": ({ id }: DetailRoute) => (
    <InvestigationReports id={id} />
  ),

  // Facility Scoped Routes
  "/facility/:facilityId/patient": ({ facilityId }: any) => (
    <PatientRegister facilityId={facilityId} />
  ),
  "/facility/:facilityId/patient/:id": ({ facilityId, id }: any) => (
    <PatientHome facilityId={facilityId} id={id} />
  ),
  "/facility/:facilityId/patient/:id/insurance": ({ facilityId, id }: any) => (
    <InsuranceDetails facilityId={facilityId} id={id} />
  ),
  "/facility/:facilityId/patient/:id/update": ({ facilityId, id }: any) => (
    <PatientRegister facilityId={facilityId} id={id} />
  ),
  "/facility/:facilityId/patient/:patientId/notes": ({
    facilityId,
    patientId,
  }: any) => <PatientNotes patientId={patientId} facilityId={facilityId} />,
  "/facility/:facilityId/patient/:patientId/files": ({
    facilityId,
    patientId,
  }: any) => <FileUploadPage facilityId={facilityId} patientId={patientId} type="PATIENT" />,
  "/death_report/:id": ({ id }: any) => <DeathReport id={id} />,
};
