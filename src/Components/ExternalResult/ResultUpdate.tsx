import { useCallback, useState, useReducer, lazy } from "react";

import * as Notification from "../../Utils/Notifications.js";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  getLocalbodyByDistrict,
  getWardByLocalBody,
  externalResult,
  partialUpdateExternalResult,
} from "../../Redux/actions";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField.js";
import CircularProgress from "../Common/components/CircularProgress.js";
import { SelectFormField } from "../Form/FormFields/SelectFormField.js";
import RadioFormField from "../Form/FormFields/RadioFormField.js";
import { navigate } from "raviger";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import useAppHistory from "../../Common/hooks/useAppHistory";
import Page from "../Common/components/Page.js";

const Loading = lazy(() => import("../Common/Loading"));

const initForm = {
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
  const { goBack } = useAppHistory();

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
          form["patient_created"] = String(res.data.patient_created);

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
    const errors = { ...initError };
    let invalidForm = false;

    Object.keys(state.form).forEach((field) => {
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
          if (state.form[field] !== "true" && state.form[field] !== "false") {
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

  const handleChange = (e: any) => {
    const form = { ...state.form };
    form[e.name] = e.value;
    if (e.name === "local_body") {
      form["ward"] = "0";
    }
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
        patient_created: state.form.patient_created === "true",
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
      <Page
        title="Update External Result"
        className="mb-2 px-6"
        backUrl={`/external_results/${id}`}
      >
        <div className="md:p-4">
          <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
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
            <div className="grid grid-cols-1 gap-4 px-4 py-5 md:grid-cols-2">
              <div data-testid="current-address">
                <TextAreaFormField
                  rows={2}
                  name="address"
                  label="Current Address"
                  required
                  placeholder="Enter the current address"
                  value={state.form.address}
                  onChange={handleChange}
                  error={state.errors.address}
                />
              </div>
              <div data-testid="localbody">
                {isLocalbodyLoading ? (
                  <CircularProgress />
                ) : (
                  <SelectFormField
                    name="local_body"
                    label="Localbody"
                    required
                    value={state.form.local_body}
                    options={localBody}
                    optionLabel={(localBody) => localBody.name}
                    optionValue={(localBody) => localBody.id}
                    onChange={(e) => [
                      handleChange(e),
                      fetchWards(String(e.value)),
                    ]}
                    error={state.errors.local_body}
                  />
                )}
              </div>
              <div data-testid="ward-respective-lsgi">
                {isWardLoading ? (
                  <CircularProgress />
                ) : (
                  <SelectFormField
                    name="ward"
                    label="Ward/Division of respective LSGI"
                    required
                    options={ward
                      .sort((a, b) => a.number - b.number)
                      .map((e) => {
                        return { id: e.id, name: e.number + ": " + e.name };
                      })}
                    value={state.form.ward}
                    optionLabel={(ward) => ward.name}
                    optionValue={(ward) => ward.id}
                    onChange={handleChange}
                    error={state.errors.ward}
                  />
                )}
              </div>
              <div data-testid="patient_created">
                <RadioFormField
                  name="patient_created"
                  label={"Is the patient created?"}
                  options={[
                    { label: "Yes", value: "true" },
                    { label: "No", value: "false" },
                  ]}
                  value={state.form.patient_created}
                  onChange={handleChange}
                  optionDisplay={(option) => option.label}
                  optionValue={(option) => option.value}
                  error={state.errors.patient_created}
                />
              </div>
            </div>
            <div className="mt-4 flex flex-col justify-end gap-2 md:flex-row">
              <Cancel onClick={() => goBack()} />
              <Submit onClick={handleSubmit} />
            </div>
          </form>
        </div>
      </Page>
    </div>
  );
}
