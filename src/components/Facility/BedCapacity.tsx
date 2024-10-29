import { useEffect, useReducer, useState } from "react";
import * as Notification from "../../Utils/Notifications";
import { CapacityModal, OptionsType } from "./models";
import TextFormField from "../Form/FormFields/TextFormField";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import { BED_TYPES } from "@/common/constants";
import routes from "../../Redux/api";
import request from "../../Utils/request/request";
import { useTranslation } from "react-i18next";
import Form from "../Form/Form";

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
  const [bedTypes, setBedTypes] = useState<OptionsType[]>(
    BED_TYPES.map((o) => ({ id: o, text: t(`bed_type__${o}`) })),
  );
  const [isLoading, setIsLoading] = useState(false);

  async function fetchCapacityBed() {
    setIsLoading(true);
    if (!id) {
      // Add Form functionality
      const capacityQuery = await request(routes.getCapacity, {
        pathParams: { facilityId: props.facilityId },
      });
      if (capacityQuery?.data) {
        const existingData = capacityQuery.data?.results;
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

  //checking validation of the new form data comming from handle submit
  const validateData = (form: typeof initForm) => {
    const errors = { ...initForm };
    let validForm = true;
    Object.keys(form).forEach((field) => {
      if (!form[field]) {
        errors[field] = t("field_required");
        validForm = false;
      } else if (field === "currentOccupancy" && Number(form[field] < 0)) {
        errors[field] = "Occupied cannot be negative";
        validForm = false;
      } else if (
        field === "currentOccupancy" &&
        Number(form[field]) > Number(form.totalCapacity)
      ) {
        errors[field] = "Occupied must be less than or equal to total capacity";
        validForm = false;
      }
      if (field === "totalCapacity" && Number(form[field]) === 0) {
        errors[field] = "Total capacity cannot be 0";
        validForm = false;
      } else if (field === "totalCapacity" && Number(form[field]) < 0) {
        errors[field] = "Total capacity cannot be negative";
        validForm = false;
      }
    });
    if (!validForm) {
      dispatch({ type: "set_error", errors });
      return false;
    }
    dispatch({ type: "set_error", errors });
    return true;
  };

  const handleSubmit = async (form: typeof initForm, btnType?: string) => {
    const valid = validateData(form);
    if (valid) {
      setIsLoading(true);
      //Converting new data from string to Number
      const bodyData = {
        room_type: Number(form.bedType),
        total_capacity: Number(form.totalCapacity),
        current_capacity: Number(form.currentOccupancy),
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
      if (
        btnType !== "save-and-add-more" ||
        bedTypes.length === BED_TYPES.length
      )
        handleClose();
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
          <Form
            defaults={state.form}
            onSubmit={handleSubmit}
            onCancel={handleClose}
            submitLabel={!id ? "Save Bed Capacity" : "Update Bed Capacity"}
            className="my-auto p-0"
            noPadding
            hideRestoreDraft
            showSaveAndAddMoreBtn
          >
            {(field) => (
              <>
                <SelectFormField
                  name="bedType"
                  id="bed-type"
                  label="Bed Type"
                  required
                  value={field("bedType").value}
                  options={bedTypes.filter((type) => !type.disabled)}
                  optionLabel={(option) => option.text}
                  optionValue={(option) => option.id}
                  onChange={(e: any) => field("bedType").onChange(e)}
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
                    value={field("totalCapacity").value}
                    onChange={(e: any) => field("totalCapacity").onChange(e)}
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
                    value={field("currentOccupancy").value}
                    onChange={(e: any) => field("currentOccupancy").onChange(e)}
                    error={state.errors.currentOccupancy}
                    min={0}
                    max={state.form.totalCapacity}
                  />
                </div>
              </>
            )}
          </Form>
        </div>
      )}
    </div>
  );
};
