import { DOSAGE_UNITS } from "../../Medicine/models";
import NumericWithUnitsFormField from "./NumericWithUnitsFormField";
import { FormFieldBaseProps } from "./Utils";

type Props = FormFieldBaseProps<string> & {
  placeholder?: string;
  autoComplete?: string;
  min?: string | number;
  max?: string | number;
};

export default function DosageFormField(props: Props) {
  return <NumericWithUnitsFormField {...props} units={DOSAGE_UNITS} />;
}
