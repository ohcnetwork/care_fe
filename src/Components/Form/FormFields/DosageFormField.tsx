import NumericWithUnitsFormField from "./NumericWithUnitsFormField";
import { FormFieldBaseProps } from "./Utils";

type Props = FormFieldBaseProps<string> & {
  placeholder?: string;
  autoComplete?: string;
  min?: string | number;
  max?: string | number;
};

export default function DosageFormField(props: Props) {
  return (
    <NumericWithUnitsFormField
      {...props}
      units={["mg", "g", "ml", "drop(s)", "ampule(s)", "tsp"]}
    />
  );
}
