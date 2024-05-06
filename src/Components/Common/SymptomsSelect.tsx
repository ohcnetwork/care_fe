import CareIcon from "../../CAREUI/icons/CareIcon";
import { SYMPTOM_CHOICES } from "../../Common/constants";
import { AutocompleteMutliSelect } from "../Form/FormFields/AutocompleteMultiselect";
import FormField from "../Form/FormFields/FormField";
import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "../Form/FormFields/Utils";

const ASYMPTOMATIC_ID = 1;

/**
 * A `FormField` component to select symptoms.
 *
 * - If "Asymptomatic" is selected, every other selections are unselected.
 * - If any non "Asymptomatic" value is selected, ensures "Asymptomatic" is
 * unselected.
 * - For other scenarios, this simply works like a `MultiSelect`.
 */
export const SymptomsSelect = (props: FormFieldBaseProps<number[]>) => {
  const field = useFormFieldPropsResolver(props);

  const updateSelection = (value: number[]) => {
    // Skip the complexities if no initial value was present
    if (!props.value?.length) return field.handleChange(value);

    const initialValue = props.value || [];

    if (initialValue.includes(ASYMPTOMATIC_ID) && value.length > 1) {
      // If asym. already selected, and new selections have more than one value
      const asymptomaticIndex = value.indexOf(1);
      if (asymptomaticIndex > -1) {
        // unselect asym.
        value.splice(asymptomaticIndex, 1);
        return field.handleChange(value);
      }
    }

    if (!initialValue.includes(ASYMPTOMATIC_ID) && value.includes(1)) {
      // If new selections have asym., unselect everything else
      return field.handleChange([ASYMPTOMATIC_ID]);
    }

    field.handleChange(value);
  };

  const getDescription = ({ id }: { id: number }) => {
    const value = props.value || [];
    if (!value.length) return;

    if (value.includes(ASYMPTOMATIC_ID) && id !== ASYMPTOMATIC_ID)
      return (
        <div className="items-center">
          <CareIcon icon="l-exclamation-triangle" className="mr-2" />
          <span>
            also unselects <b className="font-medium">Asymptomatic</b>
          </span>
        </div>
      );

    if (!value.includes(ASYMPTOMATIC_ID) && id === ASYMPTOMATIC_ID)
      return (
        <span>
          <CareIcon icon="l-exclamation-triangle" className="mr-2" />
          {`also unselects the other ${value.length} option(s)`}
        </span>
      );
  };

  return (
    <FormField field={field}>
      <AutocompleteMutliSelect
        id={field.id}
        options={SYMPTOM_CHOICES}
        disabled={props.disabled}
        placeholder="Select symptoms"
        optionLabel={(option) => option.text}
        optionValue={(option) => option.id}
        value={props.value || []}
        optionDescription={getDescription}
        onChange={updateSelection}
      />
    </FormField>
  );
};
