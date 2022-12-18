import { PatientCategoryID, PATIENT_CATEGORIES } from "../../Common/constants";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import { FormFieldBaseProps } from "../Form/FormFields/Utils";

/**
 * A `FormField` component to select patient category and is always a mandatory
 * field.
 */
export default function PatientCategorySelect(
  props: FormFieldBaseProps<PatientCategoryID>
) {
  return (
    <SelectFormField
      {...props}
      required
      options={PATIENT_CATEGORIES}
      optionValue={(option) => option.id}
      optionLabel={(option) => option.text}
      optionSelectedLabel={(option) => (
        <span className="flex gap-3 items-center">
          <div className={`h-2 w-2 rounded-full bg-${option.twClass}`} />
          <p>{option.text}</p>
        </span>
      )}
    />
  );
}
