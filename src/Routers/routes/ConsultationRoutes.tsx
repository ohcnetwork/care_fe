import { ConsultationForm } from "../../Components/Facility/ConsultationForm";
import Investigation from "../../Components/Facility/Investigations";
import ShowInvestigation from "../../Components/Facility/Investigations/ShowInvestigation";
import ManagePrescriptions from "../../Components/Medicine/ManagePrescriptions";
import { DailyRoundListDetails } from "../../Components/Patient/DailyRoundListDetails";
import { DailyRounds } from "../../Components/Patient/DailyRounds";
import { FileUpload } from "../../Components/Patient/FileUpload";
import { ConsultationDetails } from "../../Components/Facility/ConsultationDetails";
import TreatmentSummary from "../../Components/Facility/TreatmentSummary";
import ConsultationDoctorNotes from "../../Components/Facility/ConsultationDoctorNotes";
import PatientConsentRecords from "../../Components/Patient/PatientConsentRecords";
import CriticalCareEditor from "../../Components/LogUpdate/CriticalCareEditor";
import PrescriptionsPrintPreview from "../../Components/Medicine/PrintPreview";
import CriticalCarePreview from "../../Components/LogUpdate/CriticalCarePreview";

export default {
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
  "/facility/:facilityId/patient/:patientId/consultation/:id/consent-records":
    ({ facilityId, patientId, id }: any) => (
      <PatientConsentRecords
        facilityId={facilityId}
        patientId={patientId}
        consultationId={id}
      />
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
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/prescriptions":
    (path: any) => <ManagePrescriptions {...path} />,
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/prescriptions/print":
    () => <PrescriptionsPrintPreview />,
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
    (params: {
      facilityId: string;
      patientId: string;
      consultationId: string;
      id: string;
    }) => <CriticalCarePreview {...params} />,
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/daily_rounds/:id/update":
    (params: {
      facilityId: string;
      patientId: string;
      consultationId: string;
      id: string;
    }) => <CriticalCareEditor {...params} />,
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
  "/consultation/:consultationId": ({ consultationId }: any) => (
    <ConsultationDetails consultationId={consultationId} tab={"updates"} />
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
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/notes":
    ({ facilityId, patientId, consultationId }: any) => (
      <ConsultationDoctorNotes
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
      />
    ),
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/notes/:noteId":
    ({ facilityId, patientId, consultationId, noteId }: any) => (
      <ConsultationDoctorNotes
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
        noteId={noteId}
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
};
