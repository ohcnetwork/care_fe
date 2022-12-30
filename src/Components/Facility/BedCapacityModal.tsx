import { navigate } from "raviger";
import { useCallback, useEffect, useReducer, useState } from "react";
import { useDispatch } from "react-redux";
import { BED_TYPES } from "../../Common/constants";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  createCapacity,
  listCapacity,
  getCapacityBed,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { ErrorHelperText } from "../Common/HelperInputFields";
import { CapacityModal, OptionsType } from "./models";
import SelectMenuV2 from "../Form/SelectMenuV2";
import TextFormField from "../Form/FormFields/TextFormField";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import DialogModal from "../Common/Dialog";
import { FieldLabel } from "../Form/FormFields/FormField";

interface BedCapacityProps extends CapacityModal {
  facilityId: number;
  show: boolean;
  handleClose: () => void;
  handleUpdate: () => void;
  id?: number;
}

const initBedTypes: Array<OptionsType> = [...BED_TYPES];

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

export const BedCapacityModal = (props: BedCapacityProps) => {
  const dispatchAction: any = useDispatch();
  const { facilityId, show, handleClose, handleUpdate, id } = props;
  const [state, dispatch] = useReducer(bedCountReducer, initialState);
  const [isLastOptionType, setIsLastOptionType] = useState(false);
  const [bedTypes, setBedTypes] = useState<Array<OptionsType>>(initBedTypes);
  const [isLoading, setIsLoading] = useState(false);

  const headerText = !id ? "Add Bed Capacity" : "Edit Bed Capacity";
  const buttonText = !id
    ? `Save ${!isLastOptionType ? "& Add More" : "Bed Capacity"}`
    : "Update Bed Capacity";

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      if (!id) {
        // Add Form functionality
        const capacityRes = await dispatchAction(
          listCapacity({}, { facilityId })
        );
        if (!status.aborted) {
          if (capacityRes && capacityRes.data) {
            const existingData = capacityRes.data.results;
            // redirect to listing page if all options are diabled
            if (existingData.length === BED_TYPES.length) {
              navigate(`/facility/${facilityId}`);
              return;
            }
            // disable existing bed types
            const updatedBedTypes = initBedTypes.map((type: OptionsType) => {
              const isExisting = existingData.find(
                (i: CapacityModal) => i.room_type === type.id
              );
              return {
                ...type,
                disabled: !!isExisting,
              };
            });
            setBedTypes(updatedBedTypes);
          }
        }
      } else {
        // Edit Form functionality
        const res = await dispatchAction(
          getCapacityBed({ facilityId: facilityId, bed_id: id })
        );
        if (res && res.data) {
          dispatch({
            type: "set_form",
            form: {
              bedType: res.data.room_type,
              totalCapacity: res.data.total_capacity,
              currentOccupancy: res.data.current_capacity,
            },
          });
        }
      }
      setIsLoading(false);
    },
    [dispatchAction, facilityId, id]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [dispatch, fetchData, id]
  );

  useEffect(() => {
    const lastBedType =
      bedTypes.filter((i: OptionsType) => i.disabled).length ===
      BED_TYPES.length - 1;
    setIsLastOptionType(lastBedType);
  }, [bedTypes]);

  const handleChange = (e: any) => {
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
        field === "currentOccupancy" &&
        Number(state.form[field]) > Number(state.form.totalCapacity)
      ) {
        errors[field] = "Occupied must be less than or equal to total capacity";
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
      const data = {
        room_type: Number(state.form.bedType),
        total_capacity: Number(state.form.totalCapacity),
        current_capacity: Number(state.form.currentOccupancy),
      };
      const res = await dispatchAction(
        createCapacity(id, data, { facilityId })
      );
      setIsLoading(false);
      if (res && res.data) {
        // disable last added bed type
        const updatedBedTypes = bedTypes.map((type: OptionsType) => {
          return {
            ...type,
            disabled: res.data.room_type !== type.id ? type.disabled : true,
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
          if (btnType == "Save and Exit") {
            navigate(`/facility/${facilityId}`);
          } else if (isLastOptionType) {
            navigate(`/facility/${facilityId}/doctor`);
          }
        } else {
          Notification.Success({
            msg: "Bed capacity updated successfully",
          });
          navigate(`/facility/${facilityId}`);
        }
        handleUpdate();
      }
      if (btnType == "Save and Exit") handleClose();
    }
  };

  return (
    <DialogModal
      show={show}
      onClose={handleClose}
      title={headerText}
      className="max-w-lg md:min-w-[650px]"
    >
      {isLoading ? (
        <div className="flex justify-center items-center p-4">
          <div role="status">
            <svg
              aria-hidden="true"
              className="mr-2 w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-primary"
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
        <div>
          <div className="p-2">
            <FieldLabel htmlFor="bed-type" required={true}>
              Bed Type
            </FieldLabel>
            <SelectMenuV2
              id="bed-type"
              value={bedTypes.find((type) => type.id == state.form.bedType)}
              options={bedTypes.filter((type) => !type.disabled)}
              optionLabel={(option) => option.text}
              onChange={(e) =>
                handleChange({ name: "bedType", value: (e && e.id) || "" })
              }
              disabled={!!id}
              className="mt-2"
            />
            <ErrorHelperText error={state.errors.bedType} />
          </div>
          <div className="flex flex-col md:flex-row gap-7 p-2">
            <div className="w-full">
              <FieldLabel htmlFor="total-capacity" required={true}>
                Total Capacity
              </FieldLabel>
              <TextFormField
                id="total-capacity"
                name="totalCapacity"
                type="number"
                value={state.form.totalCapacity}
                onChange={handleChange}
                error={state.errors.totalCapacity}
              />
            </div>
            <div className="w-full">
              <FieldLabel htmlFor="currently-occupied" required={true}>
                Currently Occupied
              </FieldLabel>
              <TextFormField
                id="currently-occupied"
                name="currentOccupancy"
                type="number"
                value={state.form.currentOccupancy}
                onChange={handleChange}
                error={state.errors.currentOccupancy}
              />
            </div>
          </div>
          <div className="p-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
              <div className="w-full md:w-auto">
                <Cancel onClick={handleClose} />
              </div>
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                {!isLastOptionType && headerText === "Add Bed Capacity" && (
                  <Submit
                    id="bed-capacity-save-and-exit"
                    onClick={(e) => handleSubmit(e, "Save and Exit")}
                    label="Save Bed Capacity"
                  />
                )}
                <Submit
                  id="bed-capacity-save"
                  onClick={(e) => handleSubmit(e)}
                  label={buttonText}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </DialogModal>
  );
};
