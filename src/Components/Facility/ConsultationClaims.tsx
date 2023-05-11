import * as Notification from "../../Utils/Notifications";

import { useCallback, useEffect, useState } from "react";

import ClaimCard from "../HCX/ClaimCard";
import CreateClaimCard from "../HCX/CreateClaimCard";
import { HCXActions } from "../../Redux/actions";
import { HCXClaimModel } from "../HCX/models";
import PageTitle from "../Common/PageTitle";
import { navigate } from "raviger";
import { useDispatch } from "react-redux";
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
  const [isCreateLoading, setIsCreateLoading] = useState(false);

  const fetchClaims = useCallback(async () => {
    const res = await dispatch(
      HCXActions.claims.list({
        ordering: "-modified_date",
        consultation: consultationId,
      })
    );

    if (res.data && res.data.results) {
      setClaims(res.data.results);
      if (isCreateLoading)
        Notification.Success({ msg: "Fetched Claim Approval Results" });
    } else {
      if (isCreateLoading)
        Notification.Success({ msg: "Error Fetched Claim Approval Results" });
    }
    setIsCreateLoading(false);
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
        onBackClick={() => {
          navigate(
            `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`
          );
          return false;
        }}
      />

      <div className="flex flex-col justify-center gap-16 w-full max-w-5xl mx-auto">
        <div className="p-8 bg-white rounded-lg">
          <CreateClaimCard
            consultationId={consultationId}
            patientId={patientId}
            isCreating={isCreateLoading}
            setIsCreating={setIsCreateLoading}
          />
        </div>

        <div className="flex flex-col gap-8 w-full max-w-3xl mx-auto">
          {claims?.map((claim) => (
            <div className="p-8 bg-white rounded-lg">
              <ClaimCard claim={claim} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
