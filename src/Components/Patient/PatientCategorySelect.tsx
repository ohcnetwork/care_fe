import { PatientCategoryID, PATIENT_CATEGORIES } from "../../Common/constants";
import { classNames } from "../../Utils/utils";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import { FormFieldBaseProps } from "../Form/FormFields/Utils";

/**
 * A `FormField` component to select patient category and is by default a mandatory
 * field.
 */
export default function PatientCategorySelect(
  props: FormFieldBaseProps<PatientCategoryID>
) {
  return (
    <SelectFormField
      {...props}
      required={props.required ?? true}
      options={PATIENT_CATEGORIES}
      optionValue={(option) => option.id}
      optionLabel={(option) => option.text}
      optionSelectedLabel={(option) => (
        <span className="flex items-center gap-3">
          <div
            className={classNames(
              "h-2 w-2 rounded-full",
              {
                Comfort: "bg-patient-comfort",
                Stable: "bg-patient-stable",
                Moderate: "bg-patient-abnormal",
                Critical: "bg-patient-critical",
              }[option.id]
            )}
          />
          <p>{option.text}</p>
        </span>
      )}
    />
  );
}
