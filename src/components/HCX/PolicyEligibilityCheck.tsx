import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import { HCXPolicyModel } from "@/components/HCX/models";

import { useMessageListener } from "@/hooks/useMessageListener";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";

interface Props {
  className?: string;
  patient: string;
  onEligiblePolicySelected: (policy: HCXPolicyModel | undefined) => void;
}

export default function HCXPolicyEligibilityCheck({
  className,
  patient,
  onEligiblePolicySelected,
}: Props) {
  const { t } = useTranslation();

  const [selectedPolicy, setSelectedPolicy] = useState<HCXPolicyModel>();
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);

  const {
    refetch,
    data: policiesResponse,
    loading,
  } = useQuery(routes.hcx.policies.list, { query: { patient } });

  useMessageListener((data) => {
    if (
      data.type === "MESSAGE" &&
      data.from === "coverageelegibility/on_check"
    ) {
      refetch();
    }
  });

  useEffect(() => {
    onEligiblePolicySelected(
      isPolicyEligible(selectedPolicy) ? selectedPolicy : undefined,
    );
  }, [selectedPolicy]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkEligibility = async () => {
    if (!selectedPolicy || isPolicyEligible()) return;

    setIsCheckingEligibility(true);

    const { res } = await request(routes.hcx.policies.checkEligibility, {
      body: { policy: selectedPolicy.id },
    });

    if (res?.ok) {
      Notification.Success({ msg: t("checking_policy_eligibility") });
    }

    setIsCheckingEligibility(false);
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 max-sm:flex-col">
        <SelectFormField
          required
          name="policy"
          labelClassName="hidden"
          errorClassName="hidden"
          className="w-full"
          options={policiesResponse?.results ?? []}
          optionValue={(option) => option.id}
          optionLabel={(option) => option.policy_id}
          optionSelectedLabel={(option) =>
            option.outcome ? (
              <div className="flex items-center gap-3">
                {option.policy_id}
                <EligibilityChip eligible={isPolicyEligible(option) ?? false} />
              </div>
            ) : (
              option.policy_id
            )
          }
          optionIcon={(option) =>
            option.outcome && (
              <EligibilityChip eligible={isPolicyEligible(option) ?? false} />
            )
          }
          onChange={({ value }) => {
            setSelectedPolicy(
              policiesResponse?.results.find((policy) => policy.id === value),
            );
          }}
          value={selectedPolicy?.id}
          placeholder={
            loading
              ? t("loading")
              : policiesResponse?.results.length
                ? t("select_policy")
                : t("no_policy_found")
          }
          disabled={!policiesResponse?.results.length}
          optionDescription={(option) => (
            <div>
              <div className="flex flex-col">
                <span className="grid grid-cols-[100px_auto] gap-2">
                  <span>{t("policy__subscriber_id")}</span>
                  <span className="truncate font-medium">
                    {option.subscriber_id}
                  </span>
                </span>
                <span className="grid grid-cols-[100px_auto] gap-2">
                  <span>{t("policy__insurer_id")}</span>
                  <span className="truncate font-medium">
                    {option.insurer_id}
                  </span>
                </span>
                <span className="grid grid-cols-[100px_auto] gap-2">
                  <span>{t("policy__insurer_name")}</span>
                  <span className="truncate font-medium">
                    {option.insurer_name}
                  </span>
                </span>
              </div>
              {option.error_text && (
                <span className="text-sm text-red-600">
                  {option.error_text}
                </span>
              )}
            </div>
          )}
        />
        <ButtonV2
          className="whitespace-nowrap py-3 max-sm:w-full"
          onClick={checkEligibility}
          disabled={
            !selectedPolicy ||
            isPolicyEligible(selectedPolicy) ||
            isCheckingEligibility
          }
        >
          {isCheckingEligibility ? (
            <>
              <CareIcon icon="l-spinner" className="animate-spin text-lg" />
              <span>{t("checking_eligibility")}</span>
            </>
          ) : (
            t("check_eligibility")
          )}
        </ButtonV2>
      </div>
    </div>
  );
}

const EligibilityChip = ({ eligible }: { eligible: boolean }) => {
  const { t } = useTranslation();

  return (
    <div
      className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 tracking-wider ${
        eligible ? "bg-primary-100 text-primary-500" : "bg-red-500 text-white"
      }`}
    >
      <CareIcon icon={eligible ? "l-check" : "l-times"} className="text-base" />
      <span className="text-xs uppercase">
        {eligible ? t("eligible") : t("not_eligible")}
      </span>
    </div>
  );
};

const isPolicyEligible = (policy?: HCXPolicyModel) =>
  policy && !policy.error_text && policy.outcome === "Complete";
