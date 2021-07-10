import React, { useCallback, useState, useReducer } from "react";
import {
  Button,
  CardContent,
  CircularProgress,
  InputLabel,
  Radio,
  RadioGroup,
  Box,
  FormControlLabel,
} from "@material-ui/core";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import loadable from "@loadable/component";
import * as Notification from "../../Utils/Notifications.js";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  getLocalbodyByDistrict,
  getWardByLocalBody,
  externalResult,
  partialUpdateExternalResult,
} from "../../Redux/actions";
import {
  MultilineInputField,
  SelectField,
  TextInputField,
} from "../Common/HelperInputFields";
import { navigate } from "raviger";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

const initForm: any = {
  //name: "",
  //phone_number: "",
  address: "",
  local_body: "",
  ward: "",
  patient_created: "false",
};

const initError = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" }))
);

const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};

const FormReducer = (state = initialState, action: any) => {
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

const initialLocalbodies = [{ id: 0, name: "Choose Localbody", number: 0 }];
const initialWard = [{ id: 0, name: "Choose Ward", number: 0 }];

export default function UpdateResult(props: any) {
  const { id } = props;

  const dispatchAction: any = useDispatch();
  const [state, dispatch] = useReducer(FormReducer, initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocalbodyLoading, setIsLocalbodyLoading] = useState(false);
  const [isWardLoading, setIsWardLoading] = useState(false);
  const [localBody, setLocalBody] = useState(initialLocalbodies);
  const [ward, setWard] = useState(initialLocalbodies);

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(externalResult({ id: id }));
      if (!status.aborted) {
        if (res && res.data) {
          const form = { ...state.form };
          form["name"] = res.data.name;
          form["age"] = res.data.age;
          form["age_in"] = res.data.age_in;
          form["srf_id"] = res.data.srf_id;
          form["address"] = res.data.address;
          form["district"] = res.data.district_object.name;
          form["local_body"] = String(res.data.local_body);
          form["ward"] = String(res.data.ward);
          form["patient_created"] = res.data.patient_created;

          dispatch({ type: "set_form", form });

          Promise.all([
            fetchLocalBody(res.data.district),
            fetchWards(res.data.local_body),
          ]);
        }
        setIsLoading(false);
      }
    },
    [props.id, dispatchAction]
  );

  const fetchLocalBody = useCallback(
    async (id: string) => {
      if (Number(id) > 0) {
        setIsLocalbodyLoading(true);
        const localBodyList = await dispatchAction(
          getLocalbodyByDistrict({ id })
        );
        setIsLocalbodyLoading(false);
        setLocalBody([...initialLocalbodies, ...localBodyList.data]);
      } else {
        setLocalBody(initialLocalbodies);
      }
    },
    [dispatchAction]
  );

  const fetchWards = useCallback(
    async (id: string) => {
      if (Number(id) > 0) {
        setIsWardLoading(true);
        const wardList = await dispatchAction(getWardByLocalBody({ id }));
        setIsWardLoading(false);
        setWard([...initialWard, ...wardList.data.results]);
      } else {
        setWard(initialLocalbodies);
      }
    },
    [dispatchAction]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  const validateForm = () => {
    let errors = { ...initError };
    let invalidForm = false;

    Object.keys(state.form).forEach((field, i) => {
      switch (field) {
        case "address":
          if (!state.form[field]) {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          return;
        case "local_body":
          if (!state.form[field] || state.form[field] === "0") {
            errors[field] = "Please select local body";

            invalidForm = true;
          }

          return;
        case "ward":
          if (!state.form[field] || state.form[field] === "0") {
            errors[field] = "Please select ward";
            invalidForm = true;
          }
          return;
        case "patient_created":
          if (!state.form[field] || state.form[field] === "0") {
            errors[field] = "Please select an option if the patient is created";
            invalidForm = true;
          }
          return;
        default:
          return;
      }
    });

    if (invalidForm) {
      dispatch({ type: "set_error", errors });
      return false;
    }
    dispatch({ type: "set_error", errors });
    return true;
  };

  const goBack = () => {
    window.history.go(-1);
  };

  const handleChange = (e: any) => {
    const form = { ...state.form };
    form[e.target.name] = e.target.value;
    dispatch({ type: "set_form", form });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const validForm = validateForm();

    if (validForm) {
      setIsLoading(true);
      const data = {
        address: state.form.address ? state.form.address : undefined,
        local_body: state.form.local_body ? state.form.local_body : undefined,
        ward: state.form.ward,
        patient_created: [true, "true"].includes(state.form.patient_created),
      };

      const res = await dispatchAction(partialUpdateExternalResult(id, data));
      setIsLoading(false);
      if (res && res.data) {
        dispatch({ type: "set_form", form: initForm });
        Notification.Success({
          msg: "External Result updated successfully",
        });
        navigate(`/external_results/${id}`);
      }
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div>
      <PageTitle title="Update External Result" className="px-6 mb-2" />
      <CardContent>
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {state.form.name} - {state.form.age} {state.form.age_in}
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-5 text-gray-500">
            SRF ID: {state.form.srf_id}
          </p>
          <p className="mt-1 max-w-2xl text-sm leading-5 text-gray-500">
            Care external results ID: {id}
          </p>
        </div>
        <form onSubmit={(e) => handleSubmit(e)}>
          <div className="px-4 py-5 grid gap-4 grid-cols-1 md:grid-cols-2">
            <div data-testid="current-address">
              <InputLabel id="address-label">Current Address*</InputLabel>
              <MultilineInputField
                rows={2}
                name="address"
                variant="outlined"
                margin="dense"
                type="text"
                placeholder="Enter the current address"
                value={state.form.address}
                onChange={handleChange}
                errors={state.errors.address}
              />
            </div>
            <div data-testid="localbody">
              <InputLabel id="local_body-label">Localbody*</InputLabel>
              {isLocalbodyLoading ? (
                <CircularProgress size={20} />
              ) : (
                <SelectField
                  name="local_body"
                  variant="outlined"
                  margin="dense"
                  value={state.form.local_body}
                  options={localBody}
                  optionValue="name"
                  onChange={(e) => [
                    handleChange(e),
                    fetchWards(String(e.target.value)),
                  ]}
                  errors={state.errors.local_body}
                />
              )}
            </div>
            <div data-testid="ward-respective-lsgi">
              <InputLabel id="ward-label">
                Ward/Division of respective LSGI*
              </InputLabel>
              {isWardLoading ? (
                <CircularProgress size={20} />
              ) : (
                <SelectField
                  name="ward"
                  variant="outlined"
                  margin="dense"
                  options={ward
                    .sort((a, b) => a.number - b.number)
                    .map((e) => {
                      return { id: e.id, name: e.number + ": " + e.name };
                    })}
                  value={state.form.ward}
                  optionValue="name"
                  onChange={handleChange}
                  errors={state.errors.ward}
                />
              )}
            </div>
            <div data-testid="patient_created">
              <InputLabel id="patient_created-label">
                Is the patient created?
              </InputLabel>

              <RadioGroup
                aria-label="patient_created"
                name="patient_created"
                value={[true, "true"].includes(state.form.patient_created)}
                onChange={handleChange}
                style={{ padding: "0px 5px" }}
              >
                <Box display="flex" flexDirection="row">
                  <FormControlLabel
                    value={true}
                    control={<Radio />}
                    label="Yes"
                  />
                  <FormControlLabel
                    value={false}
                    control={<Radio />}
                    label="No"
                  />
                </Box>
              </RadioGroup>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button
              color="default"
              variant="contained"
              type="button"
              onClick={goBack}
            >
              {" "}
              Cancel{" "}
            </Button>

            <Button
              color="primary"
              variant="contained"
              type="submit"
              style={{ marginLeft: "10px" }}
              startIcon={<CheckCircleOutlineIcon>save</CheckCircleOutlineIcon>}
              onClick={(e) => handleSubmit(e)}
              data-testid="submit-button"
            >
              {" "}
              Submit{" "}
            </Button>
          </div>
        </form>
      </CardContent>
    </div>
  );
}
