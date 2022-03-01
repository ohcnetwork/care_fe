import React, { useReducer, useEffect, useState, useCallback } from "react";
import loadable from "@loadable/component";

import { FacilitySelect } from "../Common/FacilitySelect";
import {
  TextInputField,
  MultilineInputField,
  ErrorHelperText,
} from "../Common/HelperInputFields";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";

import * as Notification from "../../Utils/Notifications.js";
import { useDispatch } from "react-redux";
import { navigate } from "raviger";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  getResourceDetails,
  updateResource,
  getUserList,
} from "../../Redux/actions";
import { SelectField } from "../Common/HelperInputFields";
import { RESOURCE_CHOICES } from "../../Common/constants";
import { UserSelect } from "../Common/UserSelect";
import { CircularProgress } from "@material-ui/core";
import {
  Card,
  CardContent,
  InputLabel,
  Radio,
  RadioGroup,
  Box,
  FormControlLabel,
  Button,
} from "@material-ui/core";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

interface resourceProps {
  id: string;
}

const resourceStatusOptions = RESOURCE_CHOICES.map((obj) => obj.text);

const initForm: any = {
  approving_facility_object: null,
  assigned_facility_object: null,
  emergency: "false",
  title: "",
  reason: "",
  assigned_facility_type: "",
  assigned_to: "",
  requested_quantity: null,
  assigned_quantity: null,
};

const requiredFields: any = {
  approving_facility_object: {
    errorText: "Resource approving facility can not be empty.",
  },
  assigned_facility_type: {
    errorText: "Please Select Facility Type",
  },
};

const initError = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" }))
);

const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};

const goBack = () => {
  window.history.go(-1);
};

export const ResourceDetailsUpdate = (props: resourceProps) => {
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [assignedQuantity, setAssignedQuantity] = useState(0);
  const [requestTitle, setRequestTitle] = useState("");
  const [assignedUser, SetAssignedUser] = useState(null);
  const [assignedUserLoading, setAssignedUserLoading] = useState(false);
  const resourceFormReducer = (state = initialState, action: any) => {
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

  const [state, dispatch] = useReducer(resourceFormReducer, initialState);

  useEffect(() => {
    async function fetchData() {
      if (state.form.assigned_to) {
        setAssignedUserLoading(true);

        const res = await dispatchAction(
          getUserList({ id: state.form.assigned_to })
        );

        if (res && res.data && res.data.count)
          SetAssignedUser(res.data.results[0]);

        setAssignedUserLoading(false);
      }
    }
    fetchData();
  }, [dispatchAction, state.form.assigned_to]);

  const validateForm = () => {
    let errors = { ...initError };
    let isInvalidForm = false;
    Object.keys(requiredFields).forEach((field) => {
      if (!state.form[field] || !state.form[field].length) {
        errors[field] = requiredFields[field].errorText;
        isInvalidForm = true;
      }
    });

    dispatch({ type: "set_error", errors });
    return isInvalidForm;
  };

  const handleChange = (e: any) => {
    const form = { ...state.form };
    const { name, value } = e.target;
    form[name] = value;
    dispatch({ type: "set_form", form });
  };

  const handleOnSelect = (user: any) => {
    const form = { ...state.form };
    form["assigned_to"] = user?.id;
    SetAssignedUser(user);
    dispatch({ type: "set_form", form });
  };

  const setFacility = (selected: any, name: string) => {
    const form = { ...state.form };
    form[name] = selected;
    dispatch({ type: "set_form", form });
  };

  const handleSubmit = async (e: any) => {
    const validForm = validateForm();

    if (validForm) {
      setIsLoading(true);

      const data = {
        category: "OXYGEN",
        status: state.form.status,
        orgin_facility: state.form.orgin_facility_object?.id,
        approving_facility: state.form?.approving_facility_object?.id,
        assigned_facility: state.form?.assigned_facility_object?.id,
        emergency: [true, "true"].includes(state.form.emergency),
        title: state.form.title,
        reason: state.form.reason,
        assigned_to: state.form.assigned_to,
        requested_quantity: state.form.requested_quantity || 0,
        assigned_quantity:
          state.form.status === "PENDING"
            ? state.form.assigned_quantity
            : assignedQuantity,
      };

      const res = await dispatchAction(updateResource(props.id, data));
      setIsLoading(false);

      if (res && res.status == 200 && res.data) {
        dispatch({ type: "set_form", form: res.data });
        Notification.Success({
          msg: "Resource request updated successfully",
        });

        navigate(`/resource/${props.id}`);
      } else {
        setIsLoading(false);
      }
    }
  };

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(getResourceDetails({ id: props.id }));
      if (!status.aborted) {
        if (res && res.data) {
          setRequestTitle(res.data.title);
          setAssignedQuantity(res.data.assigned_quantity);
          dispatch({ type: "set_form", form: res.data });
        }
        setIsLoading(false);
      }
    },
    [props.id, dispatchAction]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="px-2 pb-2">
      <PageTitle
        title={"Update Resource Request"}
        crumbsReplacements={{ [props.id]: { name: requestTitle } }}
      />
      <div className="mt-4">
        <Card>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="md:col-span-1">
                <InputLabel>Status</InputLabel>
                <SelectField
                  name="status"
                  variant="outlined"
                  margin="dense"
                  optionArray={true}
                  value={state.form.status}
                  options={resourceStatusOptions}
                  onChange={handleChange}
                  className="bg-white h-14 w-1/3 mt-2 shadow-sm md:text-sm md:leading-5"
                />
              </div>
              <div className="md:col-span-1">
                <InputLabel>Assigned To</InputLabel>
                <div className="">
                  {assignedUserLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <UserSelect
                      multiple={false}
                      selected={assignedUser}
                      setSelected={handleOnSelect}
                      errors={""}
                      facilityId={state.form?.approving_facility_object?.id}
                    />
                  )}
                </div>
              </div>
              <div>
                <InputLabel>Name of resource approving facility</InputLabel>
                <FacilitySelect
                  multiple={false}
                  name="approving_facility"
                  facilityType={1500}
                  selected={state.form.approving_facility_object}
                  setSelected={(obj) =>
                    setFacility(obj, "approving_facility_object")
                  }
                  errors={state.errors.approving_facility}
                />
              </div>

              <div>
                <InputLabel>
                  What facility would you like to assign the request to
                </InputLabel>
                <FacilitySelect
                  multiple={false}
                  name="assigned_facility"
                  facilityType={1510}
                  selected={state.form.assigned_facility_object}
                  setSelected={(obj) =>
                    setFacility(obj, "assigned_facility_object")
                  }
                  errors={state.errors.assigned_facility}
                />
              </div>
              <div>
                <InputLabel>Required Quantity</InputLabel>
                <TextInputField
                  name="requested_quantity"
                  variant="outlined"
                  margin="dense"
                  type="number"
                  value={state.form.requested_quantity}
                  onChange={handleChange}
                  errors=""
                />
              </div>
              <div>
                <InputLabel>Approved Quantity</InputLabel>
                <TextInputField
                  name="assigned_quantity"
                  variant="outlined"
                  margin="dense"
                  type="number"
                  value={state.form.assigned_quantity}
                  onChange={handleChange}
                  disabled={state.form.status !== "PENDING"}
                  errors=""
                />
              </div>
              <div>
                <InputLabel>Is this an emergency?</InputLabel>
                <RadioGroup
                  aria-label="emergency"
                  name="emergency"
                  value={[true, "true"].includes(state.form.emergency)}
                  onChange={handleChange}
                  style={{ padding: "0px 5px" }}
                >
                  <Box>
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
                <ErrorHelperText error={state.errors.emergency} />
              </div>

              <div className="md:col-span-2">
                <InputLabel>Request Title*</InputLabel>
                <TextInputField
                  rows={5}
                  name="title"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  placeholder="Type your title here"
                  value={state.form.title}
                  onChange={handleChange}
                  errors={state.errors.title}
                />
              </div>

              <div className="md:col-span-2">
                <InputLabel>Description of request*</InputLabel>
                <MultilineInputField
                  rows={5}
                  name="reason"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  placeholder="Type your description here"
                  value={state.form.reason}
                  onChange={handleChange}
                  errors={state.errors.reason}
                />
              </div>

              <div className="md:col-span-2 flex justify-between mt-4">
                <Button color="default" variant="contained" onClick={goBack}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  variant="contained"
                  type="submit"
                  style={{ marginLeft: "auto" }}
                  onClick={(e) => handleSubmit(e)}
                  startIcon={
                    <CheckCircleOutlineIcon>save</CheckCircleOutlineIcon>
                  }
                >
                  Submit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
