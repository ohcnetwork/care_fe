import CareIcon from "../../CAREUI/icons/CareIcon";
import Printable from "../../CAREUI/misc/Printable";
import useAppHistory from "../../Common/hooks/useAppHistory";
import useSlug from "../../Common/hooks/useSlug";
import useQuery from "../../Utils/request/useQuery";
import ButtonV2 from "../Common/components/ButtonV2";
import Loading from "../Common/Loading";
import PrescriptionDetailCard from "./PrescriptionDetailCard";
import MedicineRoutes from "./routes";

export default function PrescriptionsPrintPreview() {
  const consultation = useSlug("consultation");
  const { goBack } = useAppHistory();
  const { loading, data } = useQuery(MedicineRoutes.listPrescriptions, {
    pathParams: { consultation },
    query: { limit: 100 },
  });

  if (loading) {
    return <Loading />;
  }

  const items = data?.results || [];

  if (!items.length) {
    return (
      <div className="mx-auto h-screen">
        No prescriptions for this consultation.
        <ButtonV2 variant="secondary" onClick={() => goBack()}>
          Go Back
        </ButtonV2>
      </div>
    );
  }

  return (
    <div className="my-4 space-y-4">
      <div className="flex justify-end gap-2">
        <ButtonV2 onClick={() => window.print()}>
          <CareIcon icon="l-print" className="text-lg" />
          Print
        </ButtonV2>
        <ButtonV2 variant="secondary" onClick={() => goBack()}>
          <CareIcon icon="l-times" className="text-lg" /> Close
        </ButtonV2>
      </div>

      <Printable className="p-8">
        {/* TODO: add patient information */}
        <ul className="flex w-full flex-col gap-2">
          {items.map((item) => (
            // TODO: replace with something more suitable for print
            <PrescriptionDetailCard prescription={item} readonly />
          ))}
        </ul>
      </Printable>
    </div>
  );
}
