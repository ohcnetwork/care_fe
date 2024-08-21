import { useState } from "react";
import PageTitle from "../Common/PageTitle";
import ClaimDetailCard from "../HCX/ClaimDetailCard";
import CreateClaimCard from "../HCX/CreateClaimCard";
import { useMessageListener } from "../../Common/hooks/useMessageListener";
import { navigate } from "raviger";
import * as Notification from "../../Utils/Notifications";
import useQuery from "../../Utils/request/useQuery";
import HcxApis from "../HCX/apis";

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
  const { data, refetch } = useQuery(HcxApis.claims.list, {
    query: {
      consultation: consultationId,
      ordering: "-modified_date",
    },
    onResponse: ({ data }) => {
      if (!isCreateLoading) {
        return;
      }
      if (data?.results) {
        Notification.Success({ msg: "Fetched Claim Approval Results" });
      } else {
        Notification.Success({ msg: "Error Fetched Claim Approval Results" });
      }
      setIsCreateLoading(false);
    },
  });

  useMessageListener((data) => {
    if (
      data.type === "MESSAGE" &&
      (data.from === "claim/on_submit" || data.from === "preauth/on_submit") &&
      data.message === "success"
    ) {
      refetch();
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
          {data?.results.map((claim) => (
            <div className="rounded-lg bg-white p-8">
              <ClaimDetailCard claim={claim} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
