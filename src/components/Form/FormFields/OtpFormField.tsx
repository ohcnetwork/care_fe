import { useRef } from "react";

import FormField from "@/components/Form/FormFields/FormField";
import { FormFieldBaseProps } from "@/components/Form/FormFields/Utils";

type TextAreaFormFieldProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
} & FormFieldBaseProps<string>;

const OtpFormField = ({ length = 6, ...props }: TextAreaFormFieldProps) => {
  // const [autoFocusIndex, setAutoFocusIndex] = useState(0); // TODO: navigate using arrow keys, backspace
  const inputs = useRef<Record<number, HTMLInputElement | null>>({});

  return (
    <FormField field={props}>
      <div className="flex items-center justify-evenly">
        {new Array(length).fill(null).map((_, i) => (
          <input
            key={i}
            ref={(element) => (inputs.current[i] = element)}
            className="form-control m-2 h-10 w-10 rounded border border-secondary-600 text-center"
            maxLength={1}
            value={props.value[i]}
            onChange={(e) => {
              if (e.target.value === "") inputs.current[i - 1]?.focus();
              else inputs.current[i + 1]?.focus();

              let value = "";
              Object.values(inputs.current).forEach(
                (el) => (value += el?.value),
              );
              props.onChange(value);
            }}
            autoFocus={i === 0}
            disabled={props.disabled}
          />
        ))}
      </div>
    </FormField>
  );
};

export default OtpFormField;
