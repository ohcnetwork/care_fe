import { ConsultationForm } from "../../Components/Facility/ConsultationForm";
import Investigation from "../../Components/Facility/Investigations";
import ShowInvestigation from "../../Components/Facility/Investigations/ShowInvestigation";
import ManagePrescriptions from "../../Components/Medicine/ManagePrescriptions";
import { DailyRoundListDetails } from "../../Components/Patient/DailyRoundListDetails";
import { DailyRounds } from "../../Components/Patient/DailyRounds";
import { FileUpload } from "../../Components/Patient/FileUpload";
import { make as CriticalCareRecording } from "../../Components/CriticalCareRecording/CriticalCareRecording.bs";
import { ConsultationDetails } from "../../Components/Facility/ConsultationDetails";
import TreatmentSummary from "../../Components/Facility/TreatmentSummary";

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
};
