import { InputErrors } from "./errors";
import { Label } from "./label";

export default function InputWithError(props: {
  label?: string;
  required?: boolean;
  errors?: string[];
  children: React.ReactNode;
}) {
  const { label, errors, children, required } = props;

  return (
    <>
      {label && (
        <Label className="mb-2">
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      {children}
      <InputErrors errors={errors} />
    </>
  );
}
