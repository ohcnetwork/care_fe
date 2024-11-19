import { useEffect, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";

import { Cancel, Submit } from "@/components/Common/ButtonV2";
import { CapacityModal, OptionsType } from "@/components/Facility/models";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import { FieldChangeEvent } from "@/components/Form/FormFields/Utils";

import { BED_TYPES } from "@/common/constants";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";

interface BedCapacityProps extends CapacityModal {
  facilityId: string;
  handleClose: () => void;
  handleUpdate: () => void;
  className?: string;
  id?: number;
}

const initForm: any = {
  bedType: "",
  totalCapacity: "",
  currentOccupancy: "",
};

const initialState = {
  form: { ...initForm },
  errors: { ...initForm },
};

const bedCountReducer = (state = initialState, action: any) => {
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

export const BedCapacity = (props: BedCapacityProps) => {
  const { t } = useTranslation();
  const { facilityId, handleClose, handleUpdate, className, id } = props;
  const [state, dispatch] = useReducer(bedCountReducer, initialState);
  const [isLastOptionType, setIsLastOptionType] = useState(false);
  const [bedTypes, setBedTypes] = useState<OptionsType[]>(
    BED_TYPES.map((o) => ({ id: o, text: t(`bed_type__${o}`) })),
  );
  const [isLoading, setIsLoading] = useState(false);

  const headerText = !id ? "Add Bed Capacity" : "Edit Bed Capacity";
  const buttonText = !id
    ? `Save ${!isLastOptionType ? "& Add More" : "Bed Capacity"}`
    : "Update Bed Capacity";

  async function fetchCapacityBed() {
    setIsLoading(true);
    if (!id) {
      // Add Form functionality
      const capacityQuery = await request(routes.getCapacity, {
        pathParams: { facilityId: props.facilityId },
      });
      if (capacityQuery?.data) {
        const existingData = capacityQuery.data?.results;
        // if all options are diabled
        if (existingData.length === BED_TYPES.length) {
          setBedTypes([]);
          setIsLoading(false);
          return;
        }
        // disable existing bed types
        const updatedBedTypes = BED_TYPES.map((type) => {
          const isExisting = existingData.find(
            (i: CapacityModal) => i.room_type === type,
          );
          return {
            id: type,
            text: t(`bed_type__${type}`),
            disabled: !!isExisting,
          };
        });
        setBedTypes(updatedBedTypes);
      }
    } else {
      // Edit Form functionality
      const capacityQuery = await request(routes.getCapacityBed, {
        pathParams: { facilityId: props.facilityId, bed_id: id.toString() },
      });
      if (capacityQuery.data) {
        dispatch({
          type: "set_form",
          form: {
            bedType: capacityQuery.data.room_type,
            totalCapacity: capacityQuery.data.total_capacity,
            currentOccupancy: capacityQuery.data.current_capacity,
          },
        });
      }
    }
    setIsLoading(false);
  }

  useEffect(() => {
    fetchCapacityBed();
  }, []);

  useEffect(() => {
    const lastBedType =
      bedTypes.filter((i: OptionsType) => i.disabled).length ===
      BED_TYPES.length - 1;
    setIsLastOptionType(lastBedType);
  }, [bedTypes]);

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
        errors[field] = t("field_required");
        invalidForm = true;
      } else if (
        field === "currentOccupancy" &&
        Number(state.form[field] < 0)
      ) {
        errors[field] = "Occupied cannot be negative";
        invalidForm = true;
      } else if (
        field === "currentOccupancy" &&
        Number(state.form[field]) > Number(state.form.totalCapacity)
      ) {
        errors[field] = "Occupied must be less than or equal to total capacity";
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
        room_type: Number(state.form.bedType),
        total_capacity: Number(state.form.totalCapacity),
        current_capacity: Number(state.form.currentOccupancy),
      };
      const { data } = await request(
        id ? routes.updateCapacity : routes.createCapacity,
        {
          pathParams: { facilityId, ...(id ? { bed_id: id.toString() } : {}) },
          body: bodyData,
        },
      );
      setIsLoading(false);
      if (data) {
        const updatedBedTypes = bedTypes.map((type) => {
          return {
            ...type,
            disabled: data.room_type !== type.id ? type.disabled : true,
          };
        });
        setBedTypes(updatedBedTypes);
        // reset form
        dispatch({ type: "set_form", form: initForm });
        // show success message
        if (!id) {
          Notification.Success({
            msg: "Bed capacity added successfully",
          });
        } else {
          Notification.Success({
            msg: "Bed capacity updated successfully",
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
          <SelectFormField
            name="bedType"
            id="bed-type"
            label="Bed Type"
            required
            value={state.form.bedType}
            options={bedTypes.filter((type) => !type.disabled)}
            optionLabel={(option) => option.text}
            optionValue={(option) => option.id}
            onChange={handleChange}
            disabled={!!id}
            error={state.errors.bedType}
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
              error={state.errors.totalCapacity}
              min={1}
            />
            <TextFormField
              className="w-full"
              id="currently-occupied"
              label="Currently Occupied"
              required
              name="currentOccupancy"
              type="number"
              value={state.form.currentOccupancy}
              onChange={handleChange}
              error={state.errors.currentOccupancy}
              min={0}
              max={state.form.totalCapacity}
            />
          </div>

          <div className="cui-form-button-group mt-4">
            <Cancel onClick={handleClose} />
            {headerText === "Add Bed Capacity" && (
              <Submit
                id="bed-capacity-save-and-exit"
                onClick={(e) => handleSubmit(e, "Save and Exit")}
                label="Save Bed Capacity"
              />
            )}
            {!isLastOptionType && (
              <Submit
                id="bed-capacity-save"
                onClick={(e) => handleSubmit(e)}
                label={buttonText}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
