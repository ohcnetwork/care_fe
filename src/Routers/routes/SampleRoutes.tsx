import { SampleDetails } from "../../Components/Patient/SampleDetails";
import SampleReport from "../../Components/Patient/SamplePreview";
import { SampleTest } from "../../Components/Patient/SampleTest";
import SampleViewAdmin from "../../Components/Patient/SampleViewAdmin";
import { DetailRoute, RouteParams } from "../types";

export default {
  "/sample": () => <SampleViewAdmin />,
  "/sample/:id": ({ id }: DetailRoute) => <SampleDetails id={id} />,
  "/patient/:patientId/test_sample/:sampleId/icmr_sample": ({
    patientId,
    sampleId,
  }: RouteParams<"patientId" | "sampleId">) => (
    <SampleReport id={patientId} sampleId={sampleId} />
  ),
  "/facility/:facilityId/patient/:patientId/sample-test": ({
    facilityId,
    patientId,
  }: RouteParams<"facilityId" | "patientId">) => (
    <SampleTest facilityId={facilityId} patientId={patientId} />
  ),
  "/facility/:facilityId/patient/:patientId/sample/:id": ({
    id,
  }: DetailRoute) => <SampleDetails id={id} />,
};
