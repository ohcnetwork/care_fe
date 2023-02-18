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
}

export default function HCXPolicyEligibilityCheck({
  patient,
  className,
}: Props) {
  const dispatch = useDispatch<any>();
  const [insuranceDetails, setInsuranceDetails] = useState<HCXPolicyModel[]>();
  const [policy, setPolicy] = useState<string>();
  const [eligibility, setEligibility] = useState<
    Record<string, boolean | undefined>
  >({});
  const [isChecking, setIsChecking] = useState(false);

  console.log(insuranceDetails, eligibility);

  const fetchPatientInsuranceDetails = useCallback(async () => {
    setInsuranceDetails(undefined);
    setEligibility({});

    const res = await dispatch(HCXActions.policies.list({ patient }));

    if (res.data) {
      setInsuranceDetails(res.data.results);
      setEligibility(
        res.data?.results?.reduce?.((acc: any, policy: HCXPolicyModel) => {
          if (policy.outcome)
            acc[policy.id] = policy.outcome === "Processing Complete";
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
    if (data.type === "MESSAGE" && data.from === "coverageelegibility/on_check")
      fetchPatientInsuranceDetails();
  });

  const checkEligibility = async () => {
    if (!policy) return;

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
      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-medium">
          Check Insurance Policy Eligibility
        </h1>

        <div className="flex gap-2 items-center">
          <SelectFormField
            name="policy"
            labelClassName="hidden"
            errorClassName="hidden"
            className="w-full"
            options={insuranceDetails || []}
            optionValue={(option) => option.id as string}
            optionLabel={(option) =>
              option.id && eligibility[option.id] !== undefined ? (
                <div className="flex items-center gap-2">
                  {option.policy_id}
                  <EligibilityChip eligible={!!eligibility[option.id]} />
                </div>
              ) : (
                option.policy_id
              )
            }
            onChange={({ value }) => setPolicy(value)}
            value={policy}
            placeholder={
              insuranceDetails
                ? insuranceDetails.length
                  ? "Select a policy"
                  : "No Policies"
                : "Loading..."
            }
            disabled={!insuranceDetails}
            optionDescription={(option) => (
              <div className="flex flex-wrap gap-3">
                <span>
                  {"Subscriber ID "}
                  <span className="text-black">{option.subscriber_id}</span>
                </span>
                <span>
                  {"Insurer ID "}
                  <span className="text-black">{option.insurer_id}</span>
                </span>
                <span>
                  {"Insurer Name "}
                  <span className="text-black">{option.insurer_name}</span>
                </span>
              </div>
            )}
          />
          <ButtonV2
            className="py-3 w-16"
            onClick={checkEligibility}
            disabled={isChecking}
          >
            {isChecking ? (
              <CareIcon className="care-l-spinner text-lg animate-spin" />
            ) : (
              "Check"
            )}
          </ButtonV2>
        </div>
      </div>
    </div>
  );
}

const EligibilityChip = ({ eligible }: { eligible: boolean }) => {
  return (
    <div
      className={`px-1.5 py-0.5 rounded-full text-sm font-bold ${
        eligible ? "text-primary-500 bg-primary-200" : "text-red-500 bg-red-200"
      }`}
    >
      {eligible ? "Eligible" : "Not Eligible"}
    </div>
  );
};
