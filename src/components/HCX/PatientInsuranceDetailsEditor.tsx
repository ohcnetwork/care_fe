import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2, { Cancel, Submit } from "@/components/Common/ButtonV2";
import InsuranceDetailsBuilder from "@/components/HCX/InsuranceDetailsBuilder";
import { HCXPolicyModel } from "@/components/HCX/models";
import HCXPolicyValidator from "@/components/HCX/validators";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";

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
  const { t } = useTranslation();

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
        policy.id
          ? await request(routes.hcx.policies.update, {
              pathParams: { external_id: policy.id },
              body: policy,
            })
          : await request(routes.hcx.policies.create, {
              body: policy,
            });
      }),
    );
    setIsUpdating(false);
    onSubmitted?.();
    onCancel?.();
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
          <span>{t("add_policy")}</span>
        </ButtonV2>
        <div className="md:flex-1" />
        <Cancel border disabled={isUpdating} onClick={onCancel} />
        <Submit border disabled={isUpdating} onClick={handleSubmit}>
          {isUpdating ? (
            <>
              <CareIcon icon="l-spinner" className="animate-spin text-lg" />
              <span>{t("updating")}</span>
            </>
          ) : (
            <span>{t("update")}</span>
          )}
        </Submit>
      </div>
    </div>
  );
}
