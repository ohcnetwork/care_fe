import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { HCXActions } from "../../Redux/actions";
import ButtonV2 from "../Common/components/ButtonV2";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import { HCXPolicyModel } from "./models";
import { useMessageListener } from "../../Common/hooks/useMessageListener";
import * as Notification from "../../Utils/Notifications.js";

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
  const dispatch = useDispatch<any>();
  const [insuranceDetails, setInsuranceDetails] = useState<HCXPolicyModel[]>();
  const [policy, setPolicy] = useState<string>();
  const [eligibility, setEligibility] = useState<
    Record<string, boolean | undefined>
  >({});
  const [isChecking, setIsChecking] = useState(false);

  const fetchPatientInsuranceDetails = useCallback(async () => {
    setInsuranceDetails(undefined);
    setEligibility({});

    const res = await dispatch(HCXActions.policies.list({ patient }));

    if (res.data?.results) {
      const results = res.data.results as HCXPolicyModel[];
      setInsuranceDetails(results);
      setEligibility(
        results.reduce?.((acc: any, policy: HCXPolicyModel) => {
          if (policy.outcome)
            acc[policy.id ?? ""] =
              !policy.error_text && policy.outcome === "Processing Complete";
          return acc;
        }, {})
      );
      setIsChecking(false);
    }
  }, [patient, dispatch]);

  useEffect(() => {
    fetchPatientInsuranceDetails();
  }, [fetchPatientInsuranceDetails]);

  useMessageListener((data) => {
    if (
      data.type === "MESSAGE" &&
      data.from === "coverageelegibility/on_check"
    ) {
      fetchPatientInsuranceDetails();
    }
  });

  useEffect(() => {
    if (policy && eligibility[policy]) {
      const eligiblePolicy = insuranceDetails?.find((p) => p.id === policy);
      onEligiblePolicySelected(eligiblePolicy);
    } else {
      onEligiblePolicySelected(undefined);
    }
  }, [policy, insuranceDetails, eligibility, onEligiblePolicySelected]);

  const checkEligibility = async () => {
    if (!policy) return;

    // Skip checking eligibility if we already know the policy is eligible
    if (eligibility[policy]) return;

    setIsChecking(true);

    const res = await dispatch(HCXActions.checkEligibility(policy));
    if (res.status === 200) {
      Notification.Success({ msg: "Checking Policy Eligibility..." });
    } else {
      Notification.Error({ msg: "Something Went Wrong..." });
    }
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
          options={insuranceDetails || []}
          optionValue={(option) => option.id as string}
          optionLabel={(option) => option.policy_id}
          optionSelectedLabel={(option) =>
            option.id && eligibility[option.id] !== undefined ? (
              <div className="flex items-center gap-3">
                {option.policy_id}
                <EligibilityChip eligible={!!eligibility[option.id]} />
              </div>
            ) : (
              option.policy_id
            )
          }
          optionIcon={(option) =>
            eligibility[option.id!] !== undefined && (
              <EligibilityChip eligible={!!eligibility[option.id ?? ""]} />
            )
          }
          onChange={({ value }) => setPolicy(value)}
          value={policy}
          placeholder={
            insuranceDetails
              ? insuranceDetails.length
                ? "Select a policy to check eligibility"
                : "No policies for the patient"
              : "Loading..."
          }
          disabled={!insuranceDetails}
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
          disabled={!policy || (policy && eligibility[policy]) || isChecking}
        >
          {isChecking ? (
            <>
              <CareIcon className="care-l-spinner animate-spin text-lg" />
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
      <CareIcon
        className={`care-l-${eligible ? "check" : "times"} text-base`}
      />
      <span className="text-xs uppercase">
        {eligible ? "Eligible" : "Not Eligible"}
      </span>
    </div>
  );
};
