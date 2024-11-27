import careConfig from "@careConfig";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import FormField, { FieldLabel } from "@/components/Form/FormFields/FormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import {
  FieldChangeEvent,
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "@/components/Form/FormFields/Utils";
import InsurerAutocomplete from "@/components/HCX/InsurerAutocomplete";
import { HCXPolicyModel } from "@/components/HCX/models";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { classNames } from "@/Utils/utils";

type Props = FormFieldBaseProps<HCXPolicyModel[]> & { gridView?: boolean };

export default function InsuranceDetailsBuilder(props: Props) {
  const { t } = useTranslation();

  const field = useFormFieldPropsResolver(props);

  const handleUpdate = (index: number) => {
    return (event: FieldChangeEvent<unknown>) => {
      field.handleChange(
        (props.value || [])?.map((obj, i) =>
          i === index ? { ...obj, [event.name]: event.value } : obj,
        ),
      );
    };
  };

  const handleUpdates = (index: number) => {
    return (diffs: object) => {
      field.handleChange(
        (props.value || [])?.map((obj, i) =>
          i === index ? { ...obj, ...diffs } : obj,
        ),
      );
    };
  };

  const handleRemove = (index: number) => {
    return async () => {
      const updatedPolicies = [...(props.value || [])];
      const policyToRemove = updatedPolicies[index];

      if (policyToRemove?.id) {
        try {
          await request(routes.hcx.policies.delete, {
            pathParams: { external_id: policyToRemove.id },
          });

          updatedPolicies.splice(index, 1);
          field.handleChange(updatedPolicies);
        } catch (error) {
          console.error("Failed to delete the policy", error);
        }
      } else {
        updatedPolicies.splice(index, 1);
        field.handleChange(updatedPolicies);
      }
    };
  };

  return (
    <FormField field={field}>
      <ul className="flex flex-col gap-3">
        {props.value?.length === 0 && (
          <span className="py-16 text-center text-secondary-500">
            {t("no_policy_added")}
          </span>
        )}
        {props.value?.map((policy, index) => (
          <li
            id={`insurance-details-${index}`}
            key={`insurance-details-${index}`}
          >
            <InsuranceDetailEditCard
              policy={policy}
              handleUpdate={handleUpdate(index)}
              handleUpdates={handleUpdates(index)}
              handleRemove={handleRemove(index)}
              gridView={props.gridView}
            />
          </li>
        ))}
      </ul>
    </FormField>
  );
}

const InsuranceDetailEditCard = ({
  policy,
  handleUpdate,
  handleUpdates,
  handleRemove,
  gridView,
}: {
  policy: HCXPolicyModel;
  handleUpdate: (event: FieldChangeEvent<unknown>) => void;
  handleUpdates: (diffs: object) => void;
  handleRemove: () => void;
  gridView?: boolean;
}) => {
  const { t } = useTranslation();
  const seletedInsurer =
    policy.insurer_id && policy.insurer_name
      ? { code: policy.insurer_id, name: policy.insurer_name }
      : undefined;

  return (
    <div className="rounded-lg border-2 border-dashed border-secondary-200 p-4">
      <div className="flex items-center justify-between">
        <FieldLabel className="my-auto !font-bold">{t("policy")}</FieldLabel>
        <ButtonV2 variant="danger" type="button" ghost onClick={handleRemove}>
          <span>{t("remove")}</span>
          <CareIcon icon="l-trash-alt" className="text-lg" />
        </ButtonV2>
      </div>

      <div
        className={classNames(
          "p-2",
          gridView
            ? "grid grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-2"
            : "flex flex-col gap-2",
        )}
      >
        <TextFormField
          required
          name="subscriber_id"
          label={t("policy__subscriber_id")}
          placeholder={t("policy__subscriber_id__example")}
          value={policy.subscriber_id}
          onChange={handleUpdate}
        />
        <TextFormField
          required
          name="policy_id"
          label={t("policy__policy_id")}
          placeholder={t("policy__policy_id__example")}
          value={policy.policy_id}
          onChange={handleUpdate}
        />
        {careConfig.hcx.enabled ? (
          <InsurerAutocomplete
            required
            name="insurer"
            label={t("policy__insurer")}
            placeholder={t("policy__insurer__example")}
            value={seletedInsurer}
            onChange={({ value }) =>
              handleUpdates({
                insurer_id: value.code,
                insurer_name: value.name,
              })
            }
          />
        ) : (
          <>
            <TextFormField
              name="insurer_id"
              label={t("policy__insurer_id")}
              placeholder={t("policy__insurer_id__example")}
              value={policy.insurer_id}
              onChange={handleUpdate}
            />
            <TextFormField
              name="insurer_name"
              label={t("policy__insurer_name")}
              placeholder={t("policy__insurer_name__example")}
              value={policy.insurer_name}
              onChange={handleUpdate}
            />
          </>
        )}
      </div>
    </div>
  );
};
