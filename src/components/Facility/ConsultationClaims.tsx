import * as Notification from "../../Utils/Notifications";

import ClaimCard from "../HCX/ClaimCard";
import CreateClaimCard from "../HCX/CreateClaimCard";
import PageTitle from "@/components/Common/PageTitle";
import { navigate } from "raviger";
import routes from "../../Redux/api";
import { useMessageListener } from "@/common/hooks/useMessageListener";
import useQuery from "../../Utils/request/useQuery";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export interface IConsultationClaimsProps {
  facilityId: string;
  patientId: string;
  consultationId: string;
}

export default function ConsultationClaims({
  facilityId,
  consultationId,
  patientId,
}: IConsultationClaimsProps) {
  const { t } = useTranslation();

  const [isCreateLoading, setIsCreateLoading] = useState(false);

  const { data: claimsResult, refetch: refetchClaims } = useQuery(
    routes.hcx.claims.list,
    {
      query: {
        ordering: "-modified_date",
        consultation: consultationId,
      },
      onResponse: (res) => {
        if (!isCreateLoading) return;

        if (res.data?.results) {
          Notification.Success({
            msg: t("claim__fetched_claim_approval_results"),
          });
          return;
        }

        Notification.Error({
          msg: t("claim__error_fetching_claim_approval_results"),
        });
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
        title={t("Claims")}
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
