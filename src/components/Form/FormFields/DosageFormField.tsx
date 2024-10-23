import { DOSAGE_UNITS, DosageValue } from "../../Medicine/models";
import NumericWithUnitsFormField from "./NumericWithUnitsFormField";
import { FormFieldBaseProps } from "./Utils";

type Props = FormFieldBaseProps<DosageValue> & {
  placeholder?: string;
  autoComplete?: string;
  min?: string | number;
  max?: string | number;
};

export default function DosageFormField(props: Props) {
  return <NumericWithUnitsFormField {...(props as any)} units={DOSAGE_UNITS} />;
}
