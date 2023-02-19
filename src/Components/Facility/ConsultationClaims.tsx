import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { HCXActions } from "../../Redux/actions";
import PageTitle from "../Common/PageTitle";
import ClaimDetailCard from "../HCX/ClaimDetailCard";
import CreateClaimCard from "../HCX/CreateClaimCard";
import { HCXClaimModel } from "../HCX/models";
import { useMessageListener } from "../../Common/hooks/useMessageListener";

interface Props {
  facilityId: string;
  patientId: string;
  consultationId: string;
}

export default function ConsultationClaims({
  facilityId,
  consultationId,
  patientId,
}: Props) {
  const dispatch = useDispatch<any>();
  const [claims, setClaims] = useState<HCXClaimModel[]>();

  const fetchClaims = useCallback(async () => {
    const res = await dispatch(
      HCXActions.claims.list({
        consultation: consultationId,
      })
    );

    if (res.data && res.data.results) {
      setClaims(res.data.results);
    }
  }, [dispatch, consultationId]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  useMessageListener((data) => {
    if (
      data.type === "MESSAGE" &&
      (data.from === "claim/on_submit" || data.from === "preauth/on_submit") &&
      data.message === "success"
    ) {
      fetchClaims();
    }
  });

  return (
    <div className="pb-2 relative flex flex-col">
      <PageTitle
        title="Claims"
        className="pl-6 flex-grow-0"
        backUrl={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`}
      />

      <div className="flex flex-col gap-16 w-full max-w-3xl mx-auto">
        <div className="p-8 bg-white rounded-lg">
          <CreateClaimCard
            consultationId={consultationId}
            patientId={patientId}
          />
        </div>

        <div className="flex flex-col gap-8">
          {claims?.map((claim) => (
            <div className="p-8 bg-white rounded-lg">
              <ClaimDetailCard claim={claim} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
