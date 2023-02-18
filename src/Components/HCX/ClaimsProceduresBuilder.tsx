import CareIcon from "../../CAREUI/icons/CareIcon";
import ButtonV2 from "../Common/components/ButtonV2";
import FormField, { FieldLabel } from "../Form/FormFields/FormField";
import TextFormField from "../Form/FormFields/TextFormField";
import {
  FieldChangeEvent,
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "../Form/FormFields/Utils";
import { HCXProcedureModel } from "./models";

type Props = FormFieldBaseProps<HCXProcedureModel[]>;

export default function ClaimsProceduresBuilder(props: Props) {
  const field = useFormFieldPropsResolver(props as any);

  const handleUpdate = (index: number) => {
    return (event: FieldChangeEvent<unknown>) => {
      field.handleChange(
        (props.value || [])?.map((obj, i) =>
          i === index ? { ...obj, [event.name]: event.value } : obj
        )
      );
    };
  };

  const handleRemove = (index: number) => {
    return () => {
      field.handleChange((props.value || [])?.filter((obj, i) => i !== index));
    };
  };

  return (
    <FormField field={field}>
      <div className="flex flex-col gap-3">
        {props.value?.map((obj, index) => {
          return (
            <div
              key={index}
              className="border-2 border-gray-200 border-dashed p-4 rounded-lg"
            >
              <div className="flex justify-between items-center">
                <FieldLabel className="!font-bold my-auto">
                  Procedure {index + 1}
                </FieldLabel>
                {!props.disabled && (
                  <ButtonV2
                    variant="danger"
                    type="button"
                    ghost
                    onClick={handleRemove(index)}
                    disabled={props.disabled}
                  >
                    Delete
                    <CareIcon className="care-l-trash-alt text-lg" />
                  </ButtonV2>
                )}
              </div>

              <div className="p-2 flex flex-row gap-2">
                <TextFormField
                  className="flex-[3]"
                  required
                  name="id"
                  label="ID"
                  placeholder="Eg. PROCEDURE-001"
                  value={obj.id}
                  onChange={handleUpdate(index)}
                  disabled={props.disabled}
                  errorClassName="hidden"
                />
                <TextFormField
                  className="flex-[3]"
                  required
                  name="name"
                  label="Name"
                  placeholder="Eg. Knee Replacement"
                  value={obj.name}
                  onChange={handleUpdate(index)}
                  disabled={props.disabled}
                  errorClassName="hidden"
                />
                <TextFormField
                  className="flex-[2]"
                  required
                  type="number"
                  name="price"
                  min={0}
                  label="Price"
                  placeholder="0.00"
                  value={obj.price.toString()}
                  onChange={(event) =>
                    handleUpdate(index)({
                      name: event.name,
                      value: parseFloat(event.value),
                    })
                  }
                  disabled={props.disabled}
                  errorClassName="hidden"
                />
              </div>
            </div>
          );
        })}
      </div>
    </FormField>
  );
}
