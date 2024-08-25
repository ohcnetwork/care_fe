import * as Notification from "../../Utils/Notifications";

import ButtonV2, { Cancel, Submit } from "../Common/components/ButtonV2";

import CareIcon from "../../CAREUI/icons/CareIcon";
import { HCXPolicyModel } from "./models";
import HCXPolicyValidator from "./validators";
import InsuranceDetailsBuilder from "./InsuranceDetailsBuilder";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import { useState } from "react";

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
  const [insuranceDetails, setInsuranceDetails] = useState<HCXPolicyModel[]>(
    [],
  );
  const [insuranceDetailsError, setInsuranceDetailsError] = useState<string>();
  const [isUpdating, setIsUpdating] = useState(false);

  useQuery(routes.hcx.policies.list, {
    query: { patient },
    onResponse(res) {
      if (res?.res?.ok && res.data) {
        if (res.data.results.length) {
          setInsuranceDetails(res.data.results);
        }
      }
    },
  });

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
        const { data: policyData } = policy.id
          ? await request(routes.hcx.policies.update, {
              pathParams: { external_id: policy.id },
              body: policy,
            })
          : await request(routes.hcx.policies.create, {
              body: policy,
            });

        if (policyData?.id) {
          await request(routes.hcx.policies.checkEligibility, {
            body: { policy: policyData?.id },
            onResponse: ({ res }) => {
              if (res?.ok) {
                Notification.Success({
                  msg: "Checking Policy Eligibility...",
                });
              } else {
                Notification.Error({ msg: "Something Went Wrong..." });
              }
            },
          });
        }
      }),
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
          <CareIcon icon="l-plus" className="text-lg" />
          <span>Add Insurance Details</span>
        </ButtonV2>
        <div className="md:flex-1" />
        <Cancel border disabled={isUpdating} onClick={onCancel} />
        <Submit border disabled={isUpdating} onClick={handleSubmit}>
          {isUpdating ? (
            <>
              <CareIcon icon="l-spinner" className="animate-spin text-lg" />
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
