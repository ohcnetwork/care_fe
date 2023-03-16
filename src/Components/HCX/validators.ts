import { FieldValidator } from "../Form/FieldValidators";
import { HCXPolicyModel } from "./models";

const HCXPolicyValidator: FieldValidator<HCXPolicyModel> = (value) => {
  if (
    !value.policy_id.trim() ||
    !value.subscriber_id.trim() ||
    (JSON.parse(process.env.REACT_APP_ENABLE_HCX || "false") &&
      (!value.insurer_id.trim() || !value.insurer_name.trim()))
  )
    return "All fields are mandatory";
};

export default HCXPolicyValidator;
