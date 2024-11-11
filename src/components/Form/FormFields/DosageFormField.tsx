import NumericWithUnitsFormField from "@/components/Form/FormFields/NumericWithUnitsFormField";
import { FormFieldBaseProps } from "@/components/Form/FormFields/Utils";
import { DOSAGE_UNITS, DosageValue } from "@/components/Medicine/models";

type Props = FormFieldBaseProps<DosageValue> & {
  placeholder?: string;
  autoComplete?: string;
  min?: string | number;
  max?: string | number;
};

export default function DosageFormField(props: Props) {
  return <NumericWithUnitsFormField {...(props as any)} units={DOSAGE_UNITS} />;
}
