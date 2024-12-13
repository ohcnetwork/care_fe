import { useReducer, useState } from "react";
import { useTranslation } from "react-i18next";

import Form from "@/components/Form/Form";
import {
  FieldErrorText,
  FieldLabel,
} from "@/components/Form/FormFields/FormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import SelectMenuV2 from "@/components/Form/SelectMenuV2";

import { DOCTOR_SPECIALIZATION } from "@/common/constants";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useTanStackQueryInstead from "@/Utils/request/useQuery";

import { DoctorModal } from "./models";

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

  const specializationsQuery = useTanStackQueryInstead(routes.listDoctor, {
    pathParams: { facilityId },
    query: {
      limit: DOCTOR_SPECIALIZATION.length - 1,
    },
  });

  const { loading } = useTanStackQueryInstead(routes.getDoctor, {
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

  let doctorTypes = getAllowedDoctorTypes(specializationsQuery.data?.results);

  const validateData = (form: typeof initForm, fieldName?: string) => {
    const errors = { ...initForm };
    let validForm = true;
    const fieldsToValidate = fieldName ? [fieldName] : Object.keys(form);
    fieldsToValidate.forEach((field) => {
      if (!form[field]) {
        errors[field] = t("field_required");
        validForm = false;
      } else if (field === "count" && Number(form[field]) < 0) {
        if (Number(form[field]) < 0) {
          errors[field] = "Staff count cannot be negative";
          validForm = false;
        } else if (isNaN(form[field])) {
          errors[field] = "Only numbers are allowed";
          validForm = false;
        }
      }
    });
    dispatch({ type: "set_error", errors });
    return validForm;
  };

  const isLastOptionType =
    doctorTypes.filter((i) => i.disabled).length ===
    DOCTOR_SPECIALIZATION.length - 1;

  const headerText = !id ? "Add Staff Capacity" : "Edit Staff Capacity";
  const buttonText = !id ? "Save Staff Capacity" : "Update Staff Capacity";
  const additionalButtonLabel =
    !isLastOptionType && headerText === "Add Staff Capacity"
      ? "Save & Add More"
      : "";

  const handleSubmit = async (form: typeof initForm, source?: string) => {
    if (!validateData(form)) return;
    setIsLoading(true);
    const data = {
      area: Number(form.area),
      count: Number(form.count),
    };
    let updatedStaffTypes;
    try {
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
        updatedStaffTypes = doctorTypes.map((type) => {
          return {
            ...type,
            disabled: data.area !== type.id ? type.disabled : true,
          };
        });
        doctorTypes = updatedStaffTypes;

        specializationsQuery.refetch();
        Notification.Success({
          msg: id
            ? "Staff count updated successfully"
            : "Staff count added successfully",
        });
        handleUpdate();
      }
    } catch (error) {
      Notification.Error({
        msg: "Failed to update staff capacity",
      });
    } finally {
      setIsLoading(false);
    }
    const disabledStaffTypesLength = updatedStaffTypes?.filter(
      (item) => item.disabled,
    ).length;

    if (
      source !== "doctor-save" ||
      disabledStaffTypesLength === doctorTypes.length
    )
      handleClose();
  };

  return (
    <div className={className}>
      {isLoading || loading || specializationsQuery.loading ? (
        <div>Loading...</div>
      ) : (
        <Form
          defaults={state.form}
          onSubmit={handleSubmit}
          submitBtnId="save-and-exit"
          onCancel={handleClose}
          submitLabel={buttonText}
          className="my-auto p-0"
          noPadding
          hideRestoreDraft
          additionalButtons={
            isLastOptionType || headerText !== "Add Staff Capacity"
              ? []
              : [
                  {
                    id: "doctor-save",
                    type: "submit",
                    label: additionalButtonLabel,
                  },
                ]
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
