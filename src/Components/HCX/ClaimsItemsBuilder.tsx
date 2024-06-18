import CareIcon from "../../CAREUI/icons/CareIcon";
import ButtonV2 from "../Common/components/ButtonV2";
import PMJAYProcedurePackageAutocomplete from "../Common/PMJAYProcedurePackageAutocomplete";
import AutocompleteFormField from "../Form/FormFields/Autocomplete";
import FormField, { FieldLabel } from "../Form/FormFields/FormField";
import TextFormField from "../Form/FormFields/TextFormField";
import {
  FieldChangeEvent,
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "../Form/FormFields/Utils";
import { ITEM_CATEGORIES } from "./constants";
import { HCXItemModel } from "./models";

type Props = FormFieldBaseProps<HCXItemModel[]>;

export default function ClaimsItemsBuilder(props: Props) {
  const field = useFormFieldPropsResolver(props);

  const handleUpdate = (index: number) => {
    return (event: FieldChangeEvent<any>) => {
      if (event.name === "hbp") {
        field.handleChange(
          (props.value || [])?.map((obj, i) =>
            i === index
              ? {
                  ...obj,
                  id: event.value.code,
                  name: event.value.name,
                  price: event.value.price,
                }
              : obj,
          ),
        );
      } else {
        field.handleChange(
          (props.value || [])?.map((obj, i) =>
            i === index ? { ...obj, [event.name]: event.value } : obj,
          ),
        );
      }
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
              className="rounded-lg border-2 border-dashed border-gray-200 p-4"
            >
              <div className="flex items-center justify-between">
                <FieldLabel className="my-auto !font-bold">
                  Item {index + 1}
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
                    <CareIcon icon="l-trash-alt" className="text-lg" />
                  </ButtonV2>
                )}
              </div>

              <div className="flex flex-row gap-2 p-2">
                <AutocompleteFormField
                  className="flex-[2]"
                  required
                  name="category"
                  label="Category"
                  options={ITEM_CATEGORIES}
                  optionLabel={(o) => o.display}
                  optionValue={(o) => o.code}
                  value={obj.category}
                  onChange={handleUpdate(index)}
                  disabled={props.disabled}
                  errorClassName="hidden"
                />
                {obj.category === "HBP" && !obj.id ? (
                  <>
                    <PMJAYProcedurePackageAutocomplete
                      required
                      className="flex-[7]"
                      labelClassName="text-sm text-gray-700"
                      label="Procedure"
                      name="hbp"
                      value={obj}
                      onChange={handleUpdate(index)}
                      errorClassName="hidden"
                    />
                  </>
                ) : (
                  <>
                    <TextFormField
                      className="flex-[2]"
                      required
                      name="id"
                      label="ID"
                      placeholder="Eg. PROCEDURE-001"
                      // options={PROCEDURES}
                      // optionLabel={(o) => o.code}
                      // optionDescription={(o) => o.name || ""}
                      // optionValue={(o) => o.code}
                      onChange={handleUpdate(index)}
                      value={obj.id}
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
                      // optionLabel={(o) => o.name || o.code}
                      // optionDescription={(o) => o.code}
                      // optionValue={(o) => o.name || o.code}
                      disabled={props.disabled}
                      errorClassName="hidden"
                      // options={PROCEDURES}
                    />
                    <TextFormField
                      className="flex-[2]"
                      required
                      type="number"
                      name="price"
                      min={0}
                      label="Price"
                      placeholder="0.00"
                      value={obj.price?.toString()}
                      onChange={(event) =>
                        handleUpdate(index)({
                          name: event.name,
                          value: parseFloat(event.value),
                        })
                      }
                      disabled={props.disabled}
                      errorClassName="hidden"
                    />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </FormField>
  );
}
