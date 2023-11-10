import NumericWithUnitsFormField from "./NumericWithUnitsFormField";
import { FormFieldBaseProps } from "./Utils";

type Props = FormFieldBaseProps<string> & {
  placeholder?: string;
  value?: string;
  autoComplete?: string;
  className?: string | undefined;
  disabled?: boolean;
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
