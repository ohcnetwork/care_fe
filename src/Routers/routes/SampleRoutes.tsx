import { SampleDetails } from "@/components/Patient/SampleDetails";
import SampleReport from "@/components/Patient/SamplePreview";
import { SampleTest } from "@/components/Patient/SampleTest";
import SampleViewAdmin from "@/components/Patient/SampleViewAdmin";

import { AppRoutes } from "@/Routers/AppRouter";

const SampleRoutes: AppRoutes = {
  "/sample": () => <SampleViewAdmin />,
  "/sample/:id": ({ id }) => <SampleDetails id={id} />,
  "/patient/:patientId/test_sample/:sampleId/icmr_sample": ({
    patientId,
    sampleId,
  }) => <SampleReport id={patientId} sampleId={sampleId} />,
  "/facility/:facilityId/patient/:patientId/sample-test": ({
    facilityId,
    patientId,
  }) => <SampleTest facilityId={facilityId} patientId={patientId} />,
  "/facility/:facilityId/patient/:patientId/sample/:id": ({ id }) => (
    <SampleDetails id={id} />
  ),
};

export default SampleRoutes;
