import { navigate } from "raviger";
import { useCallback, useEffect, useReducer, useState } from "react";
import { useDispatch } from "react-redux";
import { DOCTOR_SPECIALIZATION } from "../../Common/constants";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { createDoctor, getDoctor, listDoctor } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { ErrorHelperText } from "../Common/HelperInputFields";
import { DoctorModal, OptionsType } from "./models";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import SelectMenuV2 from "../Form/SelectMenuV2";
import TextFormField from "../Form/FormFields/TextFormField";
import { FieldLabel } from "../Form/FormFields/FormField";
import { FieldChangeEventHandler } from "../Form/FormFields/Utils";

interface DoctorCapacityProps extends DoctorModal {
  facilityId: number;
  show: boolean;
  handleClose: () => void;
  handleUpdate: () => void;
  id?: number;
}

const initDoctorTypes: Array<OptionsType> = [...DOCTOR_SPECIALIZATION];

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

export const DoctorCapacity = (props: DoctorCapacityProps) => {
  const dispatchAction: any = useDispatch();
  const { facilityId, handleClose, handleUpdate, id } = props;
  const [state, dispatch] = useReducer(doctorCapacityReducer, initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [isLastOptionType, setIsLastOptionType] = useState(false);
  const [doctorTypes, setDoctorTypes] =
    useState<Array<OptionsType>>(initDoctorTypes);

  const headerText = !id ? "Add Doctor Capacity" : "Edit Doctor Capacity";
  const buttonText = !id
    ? `Save ${!isLastOptionType ? "& Add More" : "Doctor Capacity"}`
    : "Update Doctor Capacity";

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      if (!id) {
        // Add Form functionality
        const doctorRes = await dispatchAction(listDoctor({}, { facilityId }));
        if (!status.aborted) {
          if (doctorRes && doctorRes.data) {
            const existingData = doctorRes.data.results;
            // redirect to listing page if all options are diabled
            if (existingData.length === DOCTOR_SPECIALIZATION.length) {
              navigate(`/facility/${facilityId}`);
              return;
            }
            // disable existing doctor types
            const updatedDoctorTypes = initDoctorTypes.map(
              (type: OptionsType) => {
                const isExisting = existingData.find(
                  (i: DoctorModal) => i.area === type.id
                );
                return {
                  ...type,
                  disabled: !!isExisting,
                };
              }
            );
            setDoctorTypes(updatedDoctorTypes);
          }
        }
      } else {
        // Edit Form functionality
        const res = await dispatchAction(
          getDoctor({ facilityId: facilityId, id: id })
        );
        if (res && res.data) {
          dispatch({
            type: "set_form",
            form: { area: res.data.area, count: res.data.count },
          });
        } else {
          navigate(`/facility/${facilityId}`);
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
    const lastDoctorType =
      doctorTypes.filter((i: OptionsType) => i.disabled).length ===
      DOCTOR_SPECIALIZATION.length - 1;
    setIsLastOptionType(lastDoctorType);
  }, [doctorTypes]);

  const validateData = () => {
    const errors = { ...initForm };
    let invalidForm = false;
    Object.keys(state.form).forEach((field) => {
      if (!state.form[field]) {
        errors[field] = "Field is required";
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

  const handleSubmit = async (e: any, btnType = "Save") => {
    e.preventDefault();
    const valid = validateData();
    if (valid) {
      setIsLoading(true);
      const data = {
        area: Number(state.form.area),
        count: Number(state.form.count),
      };
      const res = await dispatchAction(createDoctor(id, data, { facilityId }));
      setIsLoading(false);
      if (res && res.data) {
        // disable last added bed type
        const updatedDoctorTypes = doctorTypes.map((type: OptionsType) => {
          return {
            ...type,
            disabled: res.data.area !== type.id ? type.disabled : true,
          };
        });
        setDoctorTypes(updatedDoctorTypes);
        // reset form
        dispatch({ type: "set_form", form: initForm });
        // show success message
        if (!id) {
          Notification.Success({
            msg: "Doctor count added successfully",
          });
          if (btnType === "Save and Exit" || isLastOptionType) {
            navigate(`/facility/${facilityId}`);
          }
        } else {
          Notification.Success({
            msg: "Doctor count updated successfully",
          });
          navigate(`/facility/${facilityId}`);
        }
      }
      handleUpdate();
    }
    if (btnType == "Save and Exit") handleClose();
  };

  return (
    <div>
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
          <form
            onSubmit={(e) => {
              !id && !isLastOptionType
                ? handleSubmit(e, "Save and Exit")
                : handleSubmit(e);
            }}
          >
            <div className="p-2">
              <FieldLabel className="mb-2" required={true}>
                Area of specialization
              </FieldLabel>
              <SelectMenuV2
                id="area-of-specialization"
                value={doctorTypes.find((type) => type.id == state.form.area)}
                options={doctorTypes.filter((type) => !type.disabled)}
                optionLabel={(option) => option.text}
                onChange={(e) =>
                  handleFormFieldChange({
                    name: "area",
                    value: (e && e.id) || "",
                  })
                }
                disabled={!!id}
              />
              <ErrorHelperText error={state.errors.area} />
            </div>
            <div className="p-2">
              <TextFormField
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
            <div className="p-2">
              <div className="flex justify-between flex-col md:flex-row">
                <div className="flex flex-row w-full sm:w-auto gap-4">
                  <Cancel onClick={() => handleClose()} />
                </div>
                <div className="flex flex-row w-full sm:w-auto flex-wrap gap-2">
                  {!isLastOptionType &&
                    headerText === "Add Doctor Capacity" && (
                      <Submit
                        onClick={(e) => handleSubmit(e, "Save and Exit")}
                        label="Save Doctor Capacity"
                      />
                    )}
                  <Submit
                    id="doctor-save"
                    onClick={(e) => handleSubmit(e)}
                    label={buttonText}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
