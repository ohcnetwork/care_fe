import { navigate } from "raviger";
import loadable from "@loadable/component";
import { useCallback, useEffect, useReducer, useState } from "react";
import { useDispatch } from "react-redux";
import { BED_TYPES } from "../../Common/constants";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  createCapacity,
  listCapacity,
  getCapacityBed,
  getAnyFacility,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { ErrorHelperText } from "../Common/HelperInputFields";
import { CapacityModal, OptionsType } from "./models";
import { goBack } from "../../Utils/utils";
import SelectMenuV2 from "../Form/SelectMenuV2";
import TextFormField from "../Form/FormFields/TextFormField";
import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
const Loading = loadable(() => import("../../Components/Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

interface BedCapacityProps extends CapacityModal {
  facilityId: number;
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

export const BedCapacityForm = (props: BedCapacityProps) => {
  const dispatchAction: any = useDispatch();
  const { facilityId, id } = props;
  const [state, dispatch] = useReducer(bedCountReducer, initialState);
  const [isLastOptionType, setIsLastOptionType] = useState(false);
  const [bedTypes, setBedTypes] = useState<Array<OptionsType>>(initBedTypes);
  const [isLoading, setIsLoading] = useState(false);
  const [facilityName, setFacilityName] = useState("");

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
      }
    }
  };

  if (isLoading) {
    return <Loading />;
  }
  return (
    <div className="px-2">
      <PageTitle
        title={headerText}
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          [id || "????"]: {
            name: bedTypes.find((type) => type.id == id)?.text,
          },
        }}
      />
      <div>
        <div className="mt-4 shadow-md rounded bg-white">
          <div>
            <div className="p-4">
              <label htmlFor="bed-type">Bed Type*</label>
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
            <div className="flex flex-col md:flex-row gap-2 p-4">
              <div className="w-full">
                <label htmlFor="total-capacity">Total Capacity*</label>
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
                <label htmlFor="currently-occupied">Currently Occupied*</label>
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
                  <ButtonV2
                    id="bed-capacity-cancel"
                    className="w-full md:w-auto"
                    type="submit"
                    variant="secondary"
                    onClick={() => goBack(!id && `/facility/${facilityId}`)}
                  >
                    Cancel
                  </ButtonV2>
                </div>
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                  {!isLastOptionType && headerText === "Add Bed Capacity" && (
                    <ButtonV2
                      id="bed-capacity-save-and-exit"
                      className="w-full md:w-auto"
                      type="submit"
                      onClick={(e) => handleSubmit(e, "Save and Exit")}
                    >
                      <CareIcon className="care-l-check-circle text-lg"></CareIcon>{" "}
                      Save Bed Capacity
                    </ButtonV2>
                  )}
                  <ButtonV2
                    id="bed-capacity-save"
                    className="w-full md:w-auto"
                    type="submit"
                    onClick={(e) => handleSubmit(e)}
                  >
                    <CareIcon className="care-l-check-circle text-lg"></CareIcon>{" "}
                    {buttonText}
                  </ButtonV2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
