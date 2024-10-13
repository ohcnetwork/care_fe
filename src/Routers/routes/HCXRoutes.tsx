import ConsultationClaims, {
  IConsultationClaimsProps,
} from "../../Components/Facility/ConsultationClaims";

export default {
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/claims":
    (pathParams: IConsultationClaimsProps) => (
      <ConsultationClaims {...pathParams} />
    ),
};
