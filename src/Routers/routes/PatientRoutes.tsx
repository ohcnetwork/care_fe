import InvestigationReports from "../../Components/Facility/Investigations/Reports";
import { FileUpload } from "../../Components/Patient/FileUpload";
import { PatientManager } from "../../Components/Patient/ManagePatients";
import { PatientHome } from "../../Components/Patient/PatientHome";
import PatientNotes from "../../Components/Patient/PatientNotes";
import { PatientRegister } from "../../Components/Patient/PatientRegister";
import { DetailRoute } from "../types";
import DeathReport from "../../Components/DeathReport/DeathReport";

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
  "/death_report/:id": ({ id }: any) => <DeathReport id={id} />,
};
