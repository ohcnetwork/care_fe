import Loading from "@/components/Common/Loading";
import tokenApi from "@/types/tokens/token/tokenApi";
import query from "@/Utils/request/query";
import { useQuery } from "@tanstack/react-query";
import { Redirect } from "raviger";

const TokenEncounterRedirect = ({
  facilityId,
  tokenId,
  queueId,
}: {
  facilityId: string;
  tokenId: string;
  queueId: string;
}) => {
  const { data: token, isLoading: isTokenLoading } = useQuery({
    queryKey: ["token", tokenId],
    queryFn: query(tokenApi.get, {
      pathParams: {
        facility_id: facilityId,
        queue_id: queueId,
        id: tokenId,
      },
    }),
  });

  if (isTokenLoading || !token?.patient?.id) {
    return <Loading />;
  }

  if (token.encounter?.id && token?.patient?.id) {
    return (
      <Redirect
        to={`/facility/${facilityId}/patient/${token.patient.id}/encounter/${token.encounter.id}/updates`}
      />
    );
  }

  if (token.booking && token?.patient?.id) {
    return (
      <Redirect
        to={`/facility/${facilityId}/patient/${token?.patient?.id}/appointments/${token.booking.id}?from_queue=true`}
      />
    );
  }

  if (!token.booking && token?.patient?.id) {
    return (
      <Redirect
        to={`/facility/${facilityId}/patients/verify?${new URLSearchParams({
          phone_number: token.patient.phone_number,
          flow: "queue",
          year_of_birth: token.patient.year_of_birth?.toString() || "",
          partial_id: token.patient.id.slice(0, 5),
        }).toString()}`}
      />
    );
  }

  if (!token?.patient?.id) {
    return <Redirect to={`/facility/${facilityId}/patient/create`} />;
  }

  return <Loading />;
};

export default TokenEncounterRedirect;
