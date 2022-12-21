import { navigate } from "raviger";
import loadable from "@loadable/component";
import { useCallback, useEffect, useReducer, useState } from "react";
import { useDispatch } from "react-redux";
import { DOCTOR_SPECIALIZATION } from "../../Common/constants";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  createDoctor,
  getDoctor,
  listDoctor,
  getAnyFacility,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { ErrorHelperText } from "../Common/HelperInputFields";
import { DoctorModal, OptionsType } from "./models";
import { goBack } from "../../Utils/utils";
import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import SelectMenuV2 from "../Form/SelectMenuV2";
import TextFormField from "../Form/FormFields/TextFormField";
import { FieldLabel } from "../Form/FormFields/FormField";
import { FieldChangeEventHandler } from "../Form/FormFields/Utils";

const Loading = loadable(() => import("../../Components/Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

interface DoctorCapacityProps extends DoctorModal {
  facilityId: number;
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

export const DoctorCapacityForm = (props: DoctorCapacityProps) => {
  const dispatchAction: any = useDispatch();
  const { facilityId, id } = props;
  const [state, dispatch] = useReducer(doctorCapacityReducer, initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [isLastOptionType, setIsLastOptionType] = useState(false);
  const [doctorTypes, setDoctorTypes] =
    useState<Array<OptionsType>>(initDoctorTypes);
  const [facilityName, setFacilityName] = useState("");

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
    async function fetchFacilityName() {
      if (facilityId) {
        const res = await dispatchAction(getAnyFacility(facilityId));

        setFacilityName(res?.data?.name || "");
      } else {
        setFacilityName("");
      }
    }
    fetchFacilityName();
  }, [dispatchAction, facilityId]);

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
    }
  };

  if (isLoading) {
    return <Loading />;
  }
  return (
    <div className="px-2 pb-2">
      <PageTitle
        title={headerText}
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          [id || "????"]: {
            name: DOCTOR_SPECIALIZATION.find((type) => type.id == id)?.text,
          },
        }}
      />
      <div>
        <div className="mt-4 shadow-md rounded bg-white">
          <form
            onSubmit={(e) => {
              !id && !isLastOptionType
                ? handleSubmit(e, "Save and Exit")
                : handleSubmit(e);
            }}
          >
            <div className="p-4">
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
            <div className="p-4">
              <TextFormField
                id="count"
                label="Count"
                name="count"
                type="number"
                value={state.form.count}
                onChange={handleFormFieldChange}
                error={state.errors.count}
              />
            </div>
            <div className="p-4">
              <div className="flex justify-between flex-col md:flex-row">
                <div className="flex flex-row w-full sm:w-auto gap-4">
                  <ButtonV2
                    id="doctor-cancel"
                    type="button"
                    variant="secondary"
                    className="w-full sm:w-auto"
                    onClick={() => goBack(!id && `/facility/${facilityId}`)}
                  >
                    Cancel
                  </ButtonV2>
                </div>
                <div className="flex flex-row w-full sm:w-auto flex-wrap">
                  {!id && !isLastOptionType && (
                    <ButtonV2
                      id="doctor-save-and-exit"
                      className="w-full sm:w-auto"
                      type="submit"
                      onClick={(e) => handleSubmit(e, "Save and Exit")}
                    >
                      <CareIcon className="care-l-check-circle text-lg" />
                      <span>Save Doctor Capacity</span>
                    </ButtonV2>
                  )}
                  <ButtonV2
                    id="doctor-save"
                    className="w-full sm:w-auto"
                    type="submit"
                    onClick={(e) => handleSubmit(e)}
                  >
                    <CareIcon className="care-l-check-circle text-lg" />
                    <span>{buttonText}</span>
                  </ButtonV2>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
