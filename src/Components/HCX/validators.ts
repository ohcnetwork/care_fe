import { FieldValidator } from "@/Components/Form/FieldValidators";
import { HCXPolicyModel } from "@/Components/HCX/models";

const HCXPolicyValidator: FieldValidator<HCXPolicyModel> = (
  value,
  enable_hcx
) => {
  if (
    !value.policy_id.trim() ||
    !value.subscriber_id.trim() ||
    (enable_hcx && (!value.insurer_id.trim() || !value.insurer_name.trim()))
  )
    return "All fields are mandatory";
};

export default HCXPolicyValidator;
