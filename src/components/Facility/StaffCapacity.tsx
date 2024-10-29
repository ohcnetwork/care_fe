import { useReducer, useState } from "react";
import { DOCTOR_SPECIALIZATION } from "@/common/constants";
import * as Notification from "../../Utils/Notifications";
import SelectMenuV2 from "../Form/SelectMenuV2";
import TextFormField from "../Form/FormFields/TextFormField";
import { useTranslation } from "react-i18next";
import Form from "../Form/Form";
import { DoctorModal } from "./models";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";
import request from "../../Utils/request/request";
import { FieldErrorText, FieldLabel } from "../Form/FormFields/FormField";

interface DoctorCapacityProps extends DoctorModal {
  facilityId: string;
  handleClose: () => void;
  handleUpdate: () => void;
  className?: string;
  id?: number;
}

const initForm: any = {
  area: "",
  count: "",
};

const initialState = {
  form: { ...initForm },
  errors: { ...initForm },
};

const doctorCapacityReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case "set_form":
      return { ...state, form: action.form };
    case "set_error":
      return { ...state, errors: action.errors };
    case "set_field":
      return {
        ...state,
        form: { ...state.form, [action.name]: action.value },
        errors: { ...state.errors, [action.name]: action.error || "" },
      };
    default:
      return state;
  }
};

const getAllowedDoctorTypes = (existing?: DoctorModal[]) => {
  if (!existing) return [...DOCTOR_SPECIALIZATION];
  return DOCTOR_SPECIALIZATION.map((specialization) => {
    const disabled = existing.some((i) => i.area === specialization.id);
    return { ...specialization, disabled };
  });
};

export const StaffCapacity = (props: DoctorCapacityProps) => {
  const { t } = useTranslation();
  const { facilityId, handleClose, handleUpdate, className, id } = props;
  const [state, dispatch] = useReducer(doctorCapacityReducer, initialState);
  const [isLoading, setIsLoading] = useState(false);

  const specializationsQuery = useQuery(routes.listDoctor, {
    pathParams: { facilityId },
  });

  const { loading } = useQuery(routes.getDoctor, {
    pathParams: { facilityId, id: `${id}` },
    prefetch: !!id,
    onResponse: ({ data }) => {
      if (!data) return;
      dispatch({
        type: "set_form",
        form: { area: data.area, count: data.count },
      });
    },
  });

  const doctorTypes = getAllowedDoctorTypes(specializationsQuery.data?.results);

  const validateData = (form: typeof initForm, fieldName?: string) => {
    const errors = { ...initForm };
    let validForm = true;
    const fieldsToValidate = fieldName ? [fieldName] : Object.keys(form);
    fieldsToValidate.forEach((field) => {
      if (!form[field]) {
        errors[field] = t("field_required");
        validForm = false;
      } else if (field === "count" && form[field] < 0) {
        errors[field] = "Staff count cannot be negative";
        validForm = false;
      }
    });
    dispatch({ type: "set_error", errors });
    return validForm;
  };

  const isLastOptionType =
    doctorTypes.filter((i) => i.disabled).length ===
    DOCTOR_SPECIALIZATION.length - 1;

  const headerText = !id ? "Add Staff Capacity" : "Edit Staff Capacity";
  const buttonText = !id
    ? `Save ${!isLastOptionType ? "& Add More" : "Staff Capacity"}`
    : "Update Staff Capacity";

  const handleSubmit = async (form: typeof initForm, btnType?: string) => {
    if (!validateData(form)) return;
    setIsLoading(true);
    const data = {
      area: Number(form.area),
      count: Number(form.count),
    };
    const { res } = await (id
      ? request(routes.updateDoctor, {
          pathParams: { facilityId, id: `${id}` },
          body: data,
        })
      : request(routes.createDoctor, {
          pathParams: { facilityId },
          body: data,
        }));
    setIsLoading(false);
    if (res?.ok) {
      specializationsQuery.refetch();
      Notification.Success({
        msg: id
          ? "Staff count updated successfully"
          : "Staff count added successfully",
      });
      handleUpdate();
    }
    if (btnType !== "save-and-add-more") handleClose();
  };

  return (
    <div className={className}>
      {isLoading || loading || specializationsQuery.loading ? (
        <div>Loading...</div>
      ) : (
        <Form
          defaults={state.form}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          submitLabel={buttonText}
          className="my-auto p-0"
          noPadding
          hideRestoreDraft
          showSaveAndAddMoreBtn={
            !isLastOptionType && headerText === "Add Staff Capacity"
              ? "Save Staff Capacity"
              : ""
          }
        >
          {(field) => (
            <>
              <div>
                <FieldLabel required>Staff Type</FieldLabel>
                <SelectMenuV2
                  id="area-of-specialization"
                  value={field("area").value}
                  options={
                    id
                      ? doctorTypes
                      : doctorTypes.filter((type) => !type.disabled)
                  }
                  optionLabel={(option) => option.text}
                  optionValue={(option) => option.id}
                  onChange={(e: any) =>
                    field("area").onChange({ name: "area", value: e })
                  }
                  disabled={!!id}
                />
                <FieldErrorText error={state.errors.area} />
              </div>
              <div>
                <TextFormField
                  required
                  id="count"
                  label="Count"
                  name="count"
                  type="number"
                  value={field("count").value}
                  onChange={(e: any) => field("count").onChange(e)}
                />
                <FieldErrorText error={state.errors.count} />
              </div>
            </>
          )}
        </Form>
      )}
    </div>
  );
};
