import {
  FieldChangeEvent,
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "../Form/FormFields/Utils";
import FormField, { FieldLabel } from "../Form/FormFields/FormField";
import { HCXPolicyModel } from "./models";
import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import TextFormField from "../Form/FormFields/TextFormField";
import { useDispatch } from "react-redux";
import { HCXActions } from "../../Redux/actions";

type Props = FormFieldBaseProps<HCXPolicyModel[]>;

export default function InsuranceDetailsBuilder(props: Props) {
  const field = useFormFieldPropsResolver(props as any);
  const dispatch = useDispatch<any>();

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
      field.handleChange(
        (props.value || [])?.filter((obj, i) => {
          if (obj.id && i === index) {
            dispatch(HCXActions.policies.delete(obj.id));
          }
          return i !== index;
        })
      );
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
                  Policy {index + 1}
                </FieldLabel>
                <ButtonV2
                  variant="danger"
                  type="button"
                  ghost
                  onClick={handleRemove(index)}
                >
                  Delete
                  <CareIcon className="care-l-trash-alt text-lg" />
                </ButtonV2>
              </div>

              <div className="p-2 grid gap-x-8 gap-y-2 grid-cols-1 md:grid-cols-2">
                <TextFormField
                  required
                  name="subscriber_id"
                  label="Subscriber ID"
                  placeholder="Eg. SUB001"
                  value={obj.subscriber_id}
                  onChange={handleUpdate(index)}
                />
                <TextFormField
                  required
                  name="policy_id"
                  label="Policy ID"
                  placeholder="Eg. P001"
                  value={obj.policy_id}
                  onChange={handleUpdate(index)}
                />
                <TextFormField
                  required
                  name="insurer_id"
                  label="Insurer ID"
                  placeholder="Eg. GICOFINDIA"
                  value={obj.insurer_id}
                  onChange={handleUpdate(index)}
                />
                <TextFormField
                  required
                  name="insurer_name"
                  label="Insurer Name"
                  placeholder="Eg. GICOFINDIA"
                  value={obj.insurer_name}
                  onChange={handleUpdate(index)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </FormField>
  );
}
