import {
  Button,
  Card,
  CardActions,
  CardContent,
  InputLabel,
} from "@material-ui/core";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
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
import {
  ErrorHelperText,
  NativeSelectField,
  TextInputField,
} from "../Common/HelperInputFields";
import { CapacityModal, OptionsType } from "./models";
const Loading = loadable(() => import("../../Components/Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

interface BedCapacityProps extends CapacityModal {
  facilityId: number;
}

const initBedTypes: Array<OptionsType> = [
  {
    id: 0,
    text: "Select",
  },
  ...BED_TYPES,
];

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

  const goBack = () => {
    if (!id) {
      navigate(`/facility/${facilityId}/doctor`);
    } else {
      window.history.go(-1);
    }
  };

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
    let form = { ...state.form };
    form[e.target.name] = e.target.value;
    dispatch({ type: "set_form", form });
  };

  const validateData = () => {
    let errors = { ...initForm };
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

  const handleSubmit = async (e: any) => {
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
          if (isLastOptionType) {
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
            name: bedTypes.find((type) => type.id === id)?.text,
          },
        }}
      />
      <div>
        <Card className="mt-4">
          <form
            onSubmit={(e) => {
              handleSubmit(e);
            }}
          >
            <CardContent>
              <InputLabel
                htmlFor="bed-type"
                id="demo-simple-select-outlined-label"
              >
                Bed Type*
              </InputLabel>
              <NativeSelectField
                id="bed-type"
                name="bedType"
                variant="outlined"
                value={state.form.bedType}
                options={bedTypes}
                onChange={handleChange}
                disabled={!!id}
              />
              <ErrorHelperText error={state.errors.bedType} />
            </CardContent>
            <CardContent>
              <InputLabel
                htmlFor="total-capacity"
                id="demo-simple-select-outlined-label"
              >
                Total Capacity*
              </InputLabel>
              <TextInputField
                id="total-capacity"
                name="totalCapacity"
                variant="outlined"
                margin="dense"
                type="number"
                InputLabelProps={{ shrink: !!state.form.totalCapacity }}
                value={state.form.totalCapacity}
                onChange={handleChange}
                errors={state.errors.totalCapacity}
              />
            </CardContent>
            <CardContent>
              <InputLabel
                htmlFor="currently-occupied"
                id="demo-simple-select-outlined-label"
              >
                Currently Occupied*
              </InputLabel>
              <TextInputField
                id="currently-occupied"
                name="currentOccupancy"
                variant="outlined"
                margin="dense"
                type="number"
                InputLabelProps={{ shrink: !!state.form.currentOccupancy }}
                value={state.form.currentOccupancy}
                onChange={handleChange}
                errors={state.errors.currentOccupancy}
              />
            </CardContent>
            <CardContent>
              <CardActions
                className="padding16"
                style={{ justifyContent: "space-between" }}
              >
                <Button
                  id="bed-capacity-cancel"
                  color="default"
                  variant="contained"
                  type="button"
                  onClick={goBack}
                >
                  Cancel
                </Button>
                <Button
                  id="bed-capacity-save"
                  color="primary"
                  variant="contained"
                  type="submit"
                  onClick={(e) => handleSubmit(e)}
                  startIcon={
                    <CheckCircleOutlineIcon>save</CheckCircleOutlineIcon>
                  }
                >
                  {buttonText}
                </Button>
              </CardActions>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
};
