import ConsultationClaims from "@/components/Facility/ConsultationClaims";
import { AppRoutes } from "../AppRouter";

const HCXRoutes: AppRoutes = {
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/claims":
    ({ facilityId, patientId, consultationId }) => (
      <ConsultationClaims
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
      />
    ),
};

export default HCXRoutes;
