import * as Notification from "../../Utils/Notifications";

import { useState } from "react";

import ClaimCard from "../HCX/ClaimCard";
import CreateClaimCard from "../HCX/CreateClaimCard";
import PageTitle from "../Common/PageTitle";
import { navigate } from "raviger";
import { useMessageListener } from "../../Common/hooks/useMessageListener";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";

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
  const [isCreateLoading, setIsCreateLoading] = useState(false);

  const { data: claimsResult, refetch: refetchClaims } = useQuery(
    routes.listHCXClaims,
    {
      query: {
        ordering: "-modified_date",
        consultation: consultationId,
      },
      onResponse: (res) => {
        if (res.data && res.data.results) {
          if (isCreateLoading)
            Notification.Success({ msg: "Fetched Claim Approval Results" });
        } else {
          if (isCreateLoading)
            Notification.Error({
              msg: "Error Fetching Claim Approval Results",
            });
        }
      },
    },
  );

  useMessageListener((data) => {
    if (
      data.type === "MESSAGE" &&
      (data.from === "claim/on_submit" || data.from === "preauth/on_submit") &&
      data.message === "success"
    ) {
      refetchClaims();
    }
  });

  return (
    <div className="relative flex flex-col pb-2">
      <PageTitle
        title="Claims"
        className="grow-0 pl-6"
        onBackClick={() => {
          navigate(
            `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`,
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
          {claimsResult?.results.map((claim) => (
            <div className="rounded-lg bg-white p-8">
              <ClaimCard claim={claim} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
