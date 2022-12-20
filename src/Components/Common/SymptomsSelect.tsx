import CareIcon from "../../CAREUI/icons/CareIcon";
import { SYMPTOM_CHOICES } from "../../Common/constants";
import FormField from "../Form/FormFields/FormField";
import {
  FormFieldBaseProps,
  resolveFormFieldChangeEventHandler,
} from "../Form/FormFields/Utils";
import MultiSelectMenuV2 from "../Form/MultiSelectMenuV2";

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
  const { name } = props;
  const handleChange = resolveFormFieldChangeEventHandler(props);

  const updateSelection = (value: number[]) => {
    // Skip the complexities if no initial value was present
    if (!props.value?.length) return handleChange({ name, value });

    const initialValue = props.value || [];

    if (initialValue.includes(ASYMPTOMATIC_ID) && value.length > 1) {
      // If asym. already selected, and new selections have more than one value
      const asymptomaticIndex = value.indexOf(1);
      if (asymptomaticIndex > -1) {
        // unselect asym.
        value.splice(asymptomaticIndex, 1);
        return handleChange({ name, value });
      }
    }

    if (!initialValue.includes(ASYMPTOMATIC_ID) && value.includes(1)) {
      // If new selections have asym., unselect everything else
      return handleChange({ name, value: [ASYMPTOMATIC_ID] });
    }

    handleChange({ name, value });
  };

  const getDescription = ({ id }: { id: number }) => {
    const value = props.value || [];
    if (!value.length) return;

    if (value.includes(ASYMPTOMATIC_ID) && id !== ASYMPTOMATIC_ID)
      return (
        <div className="items-center">
          <CareIcon className="care-l-exclamation-triangle mr-2" />
          <span>
            also unselects <b className="font-medium">Asymptomatic</b>
          </span>
        </div>
      );

    if (!value.includes(ASYMPTOMATIC_ID) && id === ASYMPTOMATIC_ID)
      return (
        <span>
          <CareIcon className="care-l-exclamation-triangle mr-2" />
          {`also unselects the other ${value.length} option(s)`}
        </span>
      );
  };

  return (
    <FormField props={props}>
      <MultiSelectMenuV2
        id={props.id}
        options={SYMPTOM_CHOICES}
        disabled={props.disabled}
        placeholder="Select symptoms"
        optionLabel={(option) => option.text}
        optionValue={(option) => option.id}
        optionDescription={getDescription}
        value={props.value}
        onChange={updateSelection}
      />
    </FormField>
  );
};
