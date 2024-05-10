import { useEffect, useReducer, useState } from "react";
import * as Notification from "../../Utils/Notifications.js";
import { CapacityModal, FacilityModel } from "./models";
import TextFormField from "../Form/FormFields/TextFormField";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
import { OXYGEN_TYPES } from "../../Common/constants";
import routes from "../../Redux/api";
import request from "../../Utils/request/request";

interface OxygenCapacityProps extends CapacityModal {
  facilityId: string;
  facilityData: FacilityModel;
  handleClose: () => void;
  handleUpdate: () => void;
  className?: string;
  id?: number;
  oxygen_type?: number;
}

const initForm: any = {
  oxygenType: "",
  totalCapacity: "",
  expectedBurnRate: "",
};

const initialState = {
  form: { ...initForm },
  errors: { ...initForm },
};

const oxygenCapacityReducer = (state = initialState, action: any) => {
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

export const OxygenDetails = (props: OxygenCapacityProps) => {
  const {
    facilityId,
    facilityData,
    handleClose,
    handleUpdate,
    className,
    id,
    oxygen_type,
  } = props;
  const [state, dispatch] = useReducer(oxygenCapacityReducer, initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [oxygenTypes, setOxygenTypes] = useState(OXYGEN_TYPES);
  const isLastOptionType = false;

  const headerText = !id ? "Add Oxygen Capacity" : "Edit Oxygen Capacity";
  const buttonText = !id
    ? `Save ${!isLastOptionType ? "& Add More" : "Oxygen Capacity"}`
    : "Update Oxygen Capacity";

  async function fetchOxygenCapacity() {
    setIsLoading(true);
    // Edit Form functionality
    dispatch({
      type: "set_form",
      form: {
        oxygenType: oxygen_type,
        totalCapacity:
          oxygen_type === 1
            ? facilityData?.oxygen_capacity
            : oxygen_type === 2
              ? facilityData?.type_b_cylinders
              : oxygen_type === 3
                ? facilityData?.type_c_cylinders
                : facilityData?.type_d_cylinders,
        expectedBurnRate:
          oxygen_type === 1
            ? facilityData?.expected_oxygen_requirement
            : oxygen_type === 2
              ? facilityData?.expected_type_b_cylinders
              : oxygen_type === 3
                ? facilityData?.expected_type_c_cylinders
                : facilityData?.expected_type_d_cylinders,
      },
    });

    setIsLoading(false);
  }

  useEffect(() => {
    fetchOxygenCapacity();
  }, []);

  const handleChange = (e: FieldChangeEvent<unknown>) => {
    const form = { ...state.form };
    form[e.name] = e.value;
    dispatch({ type: "set_form", form });
  };

  const validateData = () => {
    const errors = { ...initForm };
    let invalidForm = false;
    Object.keys(state.form).forEach((field) => {
      if (!state.form[field]) {
        errors[field] = "Field is required";
        invalidForm = true;
      } else if (
        field === "expectedBurnRate" &&
        Number(state.form[field] < 0)
      ) {
        errors[field] = "Burn rate cannot be negative";
        invalidForm = true;
      } else if (
        field === "expectedBurnRate" &&
        Number(state.form[field]) > Number(state.form.totalCapacity)
      ) {
        errors[field] = "Oxygen must be less than or equal to total capacity";
        invalidForm = true;
      }
      if (field === "totalCapacity" && Number(state.form[field]) === 0) {
        errors[field] = "Total capacity cannot be 0";
        invalidForm = true;
      } else if (field === "totalCapacity" && Number(state.form[field]) < 0) {
        errors[field] = "Total capacity cannot be negative";
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

  const handleSubmit = async (e: any, btnType = "Save") => {
    e.preventDefault();
    const valid = validateData();
    if (valid) {
      setIsLoading(true);
      const bodyData = {
        oxygen_type: Number(state.form.oxygenType),
        total_capacity: Number(state.form.totalCapacity),
        expected_burn_rate: Number(state.form.expectedBurnRate),
      };
      const { data } = await request(routes.partialUpdateFacility, {
        pathParams: { id: facilityId },
        body:
          bodyData.oxygen_type === 1
            ? {
                oxygen_capacity: bodyData.total_capacity,
                expected_oxygen_requirement: bodyData.expected_burn_rate,
              }
            : bodyData.oxygen_type === 2
              ? {
                  type_b_cylinders: bodyData.total_capacity,
                  expected_type_b_cylinders: bodyData.expected_burn_rate,
                }
              : bodyData.oxygen_type === 3
                ? {
                    type_c_cylinders: bodyData.total_capacity,
                    expected_type_c_cylinders: bodyData.expected_burn_rate,
                  }
                : {
                    type_d_cylinders: bodyData.total_capacity,
                    expected_type_d_cylinders: bodyData.expected_burn_rate,
                  },
      });

      setIsLoading(false);
      if (data) {
        const updatedOxygenTypes = oxygenTypes;
        setOxygenTypes(updatedOxygenTypes);
        // reset form
        dispatch({ type: "set_form", form: initForm });
        // show success message
        if (!id) {
          Notification.Success({
            msg: "Oxygen capacity added successfully",
          });
        } else {
          Notification.Success({
            msg: "Oxygen capacity updated successfully",
          });
        }
        handleUpdate();
      }
      if (btnType == "Save and Exit") handleClose();
    }
  };

  return (
    <div className={className}>
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <div role="status">
            <svg
              aria-hidden="true"
              className="mr-2 h-8 w-8 animate-spin fill-primary text-gray-200 dark:text-gray-600"
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
          <SelectFormField
            name="oxygenType"
            id="oxygen-type"
            label="Oxygen Type"
            required
            value={state.form.oxygenType}
            options={oxygenTypes}
            optionLabel={(option) => option.text}
            optionValue={(option) => option.id}
            onChange={handleChange}
            error={state.errors.oxygenType}
          />
          <div className="flex flex-col gap-7 md:flex-row">
            <TextFormField
              className="w-full"
              id="total-capacity"
              name="totalCapacity"
              label="Total Capacity"
              required
              type="number"
              value={state.form.totalCapacity}
              onChange={handleChange}
              min={0}
              error={state.errors.totalCapacity}
            />
            <TextFormField
              className="w-full"
              id="expected-burn-rate"
              label="Expected Burn Rate"
              required
              name="expectedBurnRate"
              type="number"
              value={state.form.expectedBurnRate}
              onChange={handleChange}
              error={state.errors.expectedBurnRate}
              min={0}
              max={state.form.totalCapacity}
            />
          </div>

          <div className="cui-form-button-group mt-4">
            <Cancel onClick={handleClose} />
            {!isLastOptionType && headerText === "Add Oxygen Capacity" && (
              <Submit
                id="oxygen-capacity-save-and-exit"
                onClick={(e) => handleSubmit(e, "Save and Exit")}
                label="Save Oxygen Capacity"
              />
            )}
            <Submit
              id="oxygen-capacity-save"
              onClick={(e) => handleSubmit(e)}
              label={buttonText}
            />
          </div>
        </div>
      )}
    </div>
  );
};
