import { useReducer, useState } from "react";
import { useTranslation } from "react-i18next";

import ButtonV2, { Cancel } from "@/components/Common/ButtonV2";
import { DoctorModal } from "@/components/Facility/models";
import {
  FieldErrorText,
  FieldLabel,
} from "@/components/Form/FormFields/FormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import { FieldChangeEventHandler } from "@/components/Form/FormFields/Utils";
import SelectMenuV2 from "@/components/Form/SelectMenuV2";

import { DOCTOR_SPECIALIZATION } from "@/common/constants";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";

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
    case "set_form": {
      return {
        ...state,
        form: action.form,
      };
    }
    case "set_error": {
      return {
        ...state,
        errors: action.errors,
      };
    }
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
    query: {
      limit: DOCTOR_SPECIALIZATION.length - 1,
    },
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

  const isLastOptionType =
    doctorTypes.filter((i) => i.disabled).length ===
    DOCTOR_SPECIALIZATION.length - 1;

  const headerText = !id ? "Add Staff Capacity" : "Edit Staff Capacity";
  const buttonText = !id
    ? `Save ${!isLastOptionType ? "& Add More" : "Staff Capacity"}`
    : "Update Staff Capacity";

  const validateData = () => {
    const errors = { ...initForm };
    let invalidForm = false;
    Object.keys(state.form).forEach((field) => {
      if (!state.form[field]) {
        errors[field] = t("field_required");
        invalidForm = true;
      }
      if (field === "count" && state.form[field] < 0) {
        errors[field] = "Staff count cannot be negative";
        invalidForm = true;
      }
    });
    if (invalidForm) {
      dispatch({ type: "set_error", errors });
      return false;
    }
    dispatch({ type: "set_error", errors });
    return true;
  };

  const handleFormFieldChange: FieldChangeEventHandler<unknown> = (event) => {
    const form = { ...state.form, [event.name]: event.value };
    dispatch({ type: "set_form", form });
  };

  const handleSubmit = async (e: any) => {
    const submitBtnID = e.currentTarget?.id;
    e.preventDefault();
    const valid = validateData();
    if (valid) {
      setIsLoading(true);
      const data = {
        area: Number(state.form.area),
        count: Number(state.form.count),
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
        dispatch({ type: "set_form", form: initForm });
        if (!id) {
          Notification.Success({ msg: "Staff count added successfully" });
        } else {
          Notification.Success({ msg: "Staff count updated successfully" });
        }
      }
      handleUpdate();

      if (submitBtnID === "save-and-exit") handleClose();
    }
  };

  return (
    <div className={className}>
      {isLoading || loading || specializationsQuery.loading ? (
        <div className="flex items-center justify-center">
          <div role="status">
            <svg
              aria-hidden="true"
              className="mr-2 h-8 w-8 animate-spin fill-primary text-secondary-200 dark:text-secondary-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      ) : (
        <div className={className}>
          <div>
            <FieldLabel className="mb-2" required>
              Staff Type
            </FieldLabel>
            <SelectMenuV2
              id="area-of-specialization"
              value={doctorTypes.find((type) => type.id == state.form.area)?.id}
              options={
                id ? doctorTypes : doctorTypes.filter((type) => !type.disabled)
              }
              optionLabel={(option) => option.text}
              optionValue={(option) => option.id}
              requiredError={state.errors.area.length !== 0}
              onChange={(e) =>
                handleFormFieldChange({
                  name: "area",
                  value: e || "",
                })
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
              value={state.form.count}
              onChange={handleFormFieldChange}
              error={state.errors.count}
              min={0}
            />
          </div>
          <div className="cui-form-button-group mt-4">
            <Cancel onClick={() => handleClose()} />
            {!isLastOptionType && headerText === "Add Staff Capacity" && (
              <ButtonV2 id="save-and-exit" onClick={handleSubmit}>
                Save Staff Capacity
              </ButtonV2>
            )}
            <ButtonV2 id="doctor-save" onClick={handleSubmit}>
              {buttonText}
            </ButtonV2>
          </div>
        </div>
      )}
    </div>
  );
};
