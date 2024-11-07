import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import { FormFieldBaseProps } from "@/components/Form/FormFields/Utils";

import { PATIENT_CATEGORIES, PatientCategoryID } from "@/common/constants";

import { classNames } from "@/Utils/utils";

/**
 * A `FormField` component to select patient category and is by default a mandatory
 * field.
 */
export default function PatientCategorySelect(
  props: FormFieldBaseProps<PatientCategoryID>,
) {
  return (
    <SelectFormField
      {...props}
      required={props.required ?? true}
      options={
        props.value === "Comfort"
          ? PATIENT_CATEGORIES
          : PATIENT_CATEGORIES.filter((c) => c.id !== "Comfort")
      } // Comfort Care is discontinued
      optionValue={(option) => option.id}
      optionLabel={(option) => option.text}
      optionDescription={(option) => option.description}
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
                ActivelyDying: "bg-patient-activelydying",
              }[option.id],
            )}
          />
          <p>{option.text}</p>
        </span>
      )}
    />
  );
}
