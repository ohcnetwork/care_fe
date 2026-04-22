import query from "@/Utils/request/query";
import Loading from "@/components/Common/Loading";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";
import { useQuery } from "@tanstack/react-query";
import { Redirect } from "raviger";

interface MedicationDispenseRedirectProps {
  facilityId: string;
  medicationDispenseId: string;
}

const MedicationDispenseRedirect = ({
  facilityId,
  medicationDispenseId,
}: MedicationDispenseRedirectProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ["medication_dispense", medicationDispenseId],
    queryFn: query(medicationDispenseApi.get, {
      pathParams: { id: medicationDispenseId },
    }),
  });

  if (isLoading) {
    return <Loading />;
  }
  const locationId = data?.location?.id;
  const dispenseOrderId = data?.order?.id;
  if (facilityId && locationId && dispenseOrderId) {
    return (
      <Redirect
        to={`/facility/${facilityId}/locations/${locationId}/medication_dispense/order/${dispenseOrderId}`}
      />
    );
  }
  return <ErrorPage />;
};

export default MedicationDispenseRedirect;
