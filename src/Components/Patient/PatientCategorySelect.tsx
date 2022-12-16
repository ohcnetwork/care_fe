import { PatientCategoryID, PATIENT_CATEGORIES } from "../../Common/constants";
import FormField from "../Form/FormFields/FormField";
import {
  FormFieldBaseProps,
  resolveFormFieldChangeEventHandler,
} from "../Form/FormFields/Utils";
import SelectMenuV2 from "../Form/SelectMenuV2";

type Props = FormFieldBaseProps<PatientCategoryID> & {
  placeholder?: string;
  /**
   * Voluntarily restricting `required` prop to false, as Patient Category is a
   * required field.
   */
  required: true;
};

/**
 * A `FormField` component to select patient category and is always a mandatory
 * field.
 */
export default function PatientCategorySelect(props: Props) {
  const { name } = props;
  const handleChange = resolveFormFieldChangeEventHandler(props);
  return (
    <FormField props={props}>
      <SelectMenuV2
        id={props.id}
        placeholder={props.placeholder}
        disabled={props.disabled}
        required
        value={props.value}
        options={PATIENT_CATEGORIES}
        optionValue={(option) => option.id}
        optionLabel={(option) => option.text}
        onChange={(value: PatientCategoryID) => handleChange({ name, value })}
      />
    </FormField>
  );
}
