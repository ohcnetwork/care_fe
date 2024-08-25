import * as Notification from "../../Utils/Notifications.js";

import { useEffect, useState } from "react";

import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { HCXPolicyModel } from "./models";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import request from "../../Utils/request/request.js";
import routes from "../../Redux/api";
import { useMessageListener } from "../../Common/hooks/useMessageListener";
import useQuery from "../../Utils/request/useQuery";

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
  }, [selectedPolicy, onEligiblePolicySelected]);

  const checkEligibility = async () => {
    if (!selectedPolicy || isPolicyEligible()) return;

    setIsCheckingEligibility(true);

    const { res } = await request(routes.hcx.policies.checkEligibility, {
      body: { policy: selectedPolicy.id },
    });

    if (res?.ok) {
      Notification.Success({ msg: "Checking Policy Eligibility..." });
    } else {
      Notification.Error({ msg: "Something Went Wrong..." });
    }

    setIsCheckingEligibility(false);
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <SelectFormField
          required
          name="policy"
          labelClassName="hidden"
          errorClassName="hidden"
          className="w-full"
          options={policiesResponse?.results ?? []}
          optionValue={(option) => option}
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
          onChange={({ value }) => setSelectedPolicy(value)}
          value={selectedPolicy}
          placeholder={
            loading
              ? "Loading..."
              : policiesResponse?.results.length
                ? "Select a policy to check eligibility"
                : "No policies for the patient"
          }
          disabled={!policiesResponse?.results.length}
          optionDescription={(option) => (
            <div>
              <div className="flex flex-col">
                <span className="flex w-full gap-2">
                  <span className="w-24">Member ID</span>
                  <span className="font-medium tracking-wide">
                    {option.subscriber_id}
                  </span>
                </span>
                <span className="flex w-full gap-2">
                  <span className="w-24">Insurer ID</span>
                  <span className="font-medium tracking-wide">
                    {option.insurer_id}
                  </span>
                </span>
                <span className="flex w-full gap-2">
                  <span className="w-24">Insurer Name</span>
                  <span className="font-medium tracking-wide">
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
          className="whitespace-nowrap py-3"
          onClick={checkEligibility}
          disabled={isPolicyEligible(selectedPolicy) || isCheckingEligibility}
        >
          {isCheckingEligibility ? (
            <>
              <CareIcon icon="l-spinner" className="animate-spin text-lg" />
              <span>Checking ...</span>
            </>
          ) : (
            "Check Eligibility"
          )}
        </ButtonV2>
      </div>
    </div>
  );
}

const EligibilityChip = ({ eligible }: { eligible: boolean }) => {
  return (
    <div
      className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 tracking-wider ${
        eligible ? "bg-primary-100 text-primary-500" : "bg-red-500 text-white"
      }`}
    >
      <CareIcon icon={eligible ? "l-check" : "l-times"} className="text-base" />
      <span className="text-xs uppercase">
        {eligible ? "Eligible" : "Not Eligible"}
      </span>
    </div>
  );
};

const isPolicyEligible = (policy?: HCXPolicyModel) =>
  policy && !policy.error_text && policy.outcome === "Processing Complete";
