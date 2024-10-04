import { FieldValidator } from "../Form/FieldValidators";
import { HCXPolicyModel } from "./models";

const HCXPolicyValidator: FieldValidator<HCXPolicyModel> = (
  value,
  enable_hcx,
) => {
  if (!value.subscriber_id.trim()) {
    return "Member Id is required";
  } else if (!value.policy_id.trim()) {
    return "Policy Id or Policy Name is required";
  }
  if (enable_hcx) {
    if (!value.insurer_id?.trim() || !value.insurer_name?.trim()) {
      return "Insurer Name is required";
    }
  }
};

export default HCXPolicyValidator;
