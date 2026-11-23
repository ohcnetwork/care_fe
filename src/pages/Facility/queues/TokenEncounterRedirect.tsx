import Loading from "@/components/Common/Loading";
import tokenApi from "@/types/tokens/token/tokenApi";
import query from "@/Utils/request/query";
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "@tanstack/react-router";

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
      <Navigate
        to="/facility/$facilityId/patient/$patientId/encounter/$encounterId/$tab"
        params={{
          facilityId,
          patientId: token.patient.id,
          encounterId: token.encounter.id,
          tab: "updates",
        }}
        replace
      />
    );
  }

  if (token.booking && token?.patient?.id) {
    return (
      <Navigate
        to="/facility/$facilityId/patient/$patientId/appointments/$appointmentId"
        params={{
          facilityId,
          patientId: token.patient.id,
          appointmentId: token.booking.id,
        }}
        search={{ from_queue: "true" }}
        replace
      />
    );
  }

  if (!token.booking && token?.patient?.id) {
    return (
      <Navigate
        to="/facility/$facilityId/patients/home"
        params={{ facilityId }}
        search={{
          phone_number: token.patient.phone_number,
          flow: "queue",
          year_of_birth: token.patient.year_of_birth?.toString() || "",
          partial_id: token.patient.id.slice(0, 5),
        }}
        replace
      />
    );
  }

  if (!token?.patient?.id) {
    return (
      <Navigate
        to="/facility/$facilityId/patient/create"
        params={{ facilityId }}
        replace
      />
    );
  }

  return <Loading />;
};

export default TokenEncounterRedirect;
