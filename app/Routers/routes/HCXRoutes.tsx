import ConsultationClaims from "../../Components/Facility/ConsultationClaims";

export default {
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/claims":
    (pathParams: any) => <ConsultationClaims {...pathParams} />,
};
