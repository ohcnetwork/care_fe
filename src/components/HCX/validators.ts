import { t } from "i18next";
import { FieldValidator } from "../Form/FieldValidators";
import { HCXPolicyModel } from "./models";

const HCXPolicyValidator: FieldValidator<HCXPolicyModel> = (
  value,
  enable_hcx,
) => {
  if (!value.subscriber_id.trim()) {
    return t("member_id_required");
  } else if (!value.policy_id.trim()) {
    return t("policy_id_required");
  }
  if (enable_hcx) {
    if (!value.insurer_id?.trim() || !value.insurer_name?.trim()) {
      return t("insurer_name_required");
    }
  }
};

export default HCXPolicyValidator;
