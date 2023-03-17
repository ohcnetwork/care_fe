import useConfig from "../../Common/hooks/useConfig";
import { FieldValidator } from "../Form/FieldValidators";
import { HCXPolicyModel } from "./models";

const HCXPolicyValidator: FieldValidator<HCXPolicyModel> = (value) => {
  const { enable_hcx } = useConfig();
  if (
    !value.policy_id.trim() ||
    !value.subscriber_id.trim() ||
    (enable_hcx && (!value.insurer_id.trim() || !value.insurer_name.trim()))
  )
    return "All fields are mandatory";
};

export default HCXPolicyValidator;
