import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { HCXActions } from "../../Redux/actions";
import PageTitle from "../Common/PageTitle";
import ClaimDetailCard from "../HCX/ClaimDetailCard";
import CreateClaimCard from "../HCX/CreateClaimCard";
import { HCXClaimModel } from "../HCX/models";
import { useMessageListener } from "../../Common/hooks/useMessageListener";
import { navigate } from "raviger";
import * as Notification from "../../Utils/Notifications";

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
    <div className="relative flex flex-col pb-2">
      <PageTitle
        title="Claims"
        className="grow-0 pl-6"
        onBackClick={() => {
          navigate(
            `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`
          );
          return false;
        }}
      />

      <div className="mx-auto flex w-full max-w-5xl flex-col justify-center gap-16">
        <div className="rounded-lg bg-white p-8">
          <CreateClaimCard
            consultationId={consultationId}
            patientId={patientId}
            isCreating={isCreateLoading}
            setIsCreating={setIsCreateLoading}
          />
        </div>

        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
          {claims?.map((claim) => (
            <div className="rounded-lg bg-white p-8">
              <ClaimDetailCard claim={claim} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
