import DeathReport from "@/components/DeathReport/DeathReport";
import InvestigationReports from "@/components/Facility/Investigations/Reports";
import FileUploadPage from "@/components/Patient/FileUploadPage";
import { InsuranceDetails } from "@/components/Patient/InsuranceDetails";
import { PatientManager } from "@/components/Patient/ManagePatients";
import { PatientHome } from "@/components/Patient/PatientHome";
import PatientNotes from "@/components/Patient/PatientNotes";
import { PatientRegister } from "@/components/Patient/PatientRegister";

import { AppRoutes } from "@/Routers/AppRouter";

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
