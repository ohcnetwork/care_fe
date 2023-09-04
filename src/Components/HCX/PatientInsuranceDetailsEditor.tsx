import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { HCXActions } from "../../Redux/actions";
import * as Notifications from "../../Utils/Notifications";
import ButtonV2, { Cancel, Submit } from "../Common/components/ButtonV2";
import InsuranceDetailsBuilder from "./InsuranceDetailsBuilder";
import { HCXPolicyModel } from "./models";
import HCXPolicyValidator from "./validators";

interface Props {
  patient: string;
  onSubmitted?: () => void;
  onCancel?: () => void;
}

export default function PatientInsuranceDetailsEditor({
  patient,
  onSubmitted,
  onCancel,
}: Props) {
  const dispatch = useDispatch<any>();
  const [insuranceDetails, setInsuranceDetails] = useState<HCXPolicyModel[]>();
  const [insuranceDetailsError, setInsuranceDetailsError] = useState<string>();
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchPatientInsuranceDetails = async () => {
      const res = await dispatch(HCXActions.policies.list({ patient }));
      if (res && res.data) {
        if (res.data.results.length) {
          setInsuranceDetails(res.data.results);
        } else {
          setInsuranceDetails([
            {
              subscriber_id: "",
              policy_id: "",
              insurer_id: "",
              insurer_name: "",
            },
          ]);
        }
      } else {
        Notifications.Error({ msg: "Something went wrong " });
      }
    };

    fetchPatientInsuranceDetails();
  }, [dispatch, patient]);

  const handleSubmit = async () => {
    // Validate
    if (!insuranceDetails) return;
    const insuranceDetailsError = insuranceDetails
      .map(HCXPolicyValidator)
      .find((error) => !!error);
    setInsuranceDetailsError(insuranceDetailsError);
    if (insuranceDetailsError) return;

    // Submit
    setIsUpdating(true);
    await Promise.all(
      insuranceDetails.map(async (obj) => {
        const policy: HCXPolicyModel = { ...obj, patient };
        const policyRes = await (policy.id
          ? dispatch(HCXActions.policies.update(policy.id, policy))
          : dispatch(HCXActions.policies.create(policy)));

        const eligibilityCheckRes = await dispatch(
          HCXActions.checkEligibility(policyRes.data.id)
        );
        if (eligibilityCheckRes.status === 200) {
          Notifications.Success({ msg: "Checking Policy Eligibility..." });
        } else {
          Notifications.Error({ msg: "Something Went Wrong..." });
        }
      })
    );
    setIsUpdating(false);
    onSubmitted?.();
  };

  return (
    <div className="flex w-full flex-col gap-6 rounded bg-white p-4">
      <InsuranceDetailsBuilder
        name="insurance_details"
        value={insuranceDetails}
        onChange={({ value }) => setInsuranceDetails(value)}
        error={insuranceDetailsError}
        gridView
        disabled={isUpdating}
      />

      <div className="flex flex-col gap-2 md:flex-row">
        <ButtonV2
          border
          type="button"
          variant="alert"
          ghost={insuranceDetails?.length !== 0}
          disabled={isUpdating}
          onClick={() =>
            setInsuranceDetails([
              ...(insuranceDetails || []),
              {
                id: "",
                subscriber_id: "",
                policy_id: "",
                insurer_id: "",
                insurer_name: "",
              },
            ])
          }
        >
          <CareIcon className="care-l-plus text-lg" />
          <span>Add Insurance Details</span>
        </ButtonV2>
        <div className="md:flex-1" />
        <Cancel border disabled={isUpdating} onClick={onCancel} />
        <Submit border disabled={isUpdating} onClick={handleSubmit}>
          {isUpdating ? (
            <>
              <CareIcon className="care-l-spinner animate-spin text-lg" />
              <span>Updating...</span>
            </>
          ) : (
            "Update"
          )}
        </Submit>
      </div>
    </div>
  );
}
