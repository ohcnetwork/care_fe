import * as Notification from "../../Utils/Notifications.js";

import { Cancel, Submit } from "../Common/components/ButtonV2";
import { lazy, useCallback, useEffect, useReducer, useState } from "react";
import {
  getResourceDetails,
  getUserList,
  updateResource,
} from "../../Redux/actions";
import { navigate, useQueryParams } from "raviger";
import { statusType, useAbortableEffect } from "../../Common/utils";

import Card from "../../CAREUI/display/Card";
import CircularProgress from "../Common/components/CircularProgress";
import { FacilitySelect } from "../Common/FacilitySelect";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
import { FieldLabel } from "../Form/FormFields/FormField";
import Page from "../Common/components/Page";
import { RESOURCE_CHOICES } from "../../Common/constants";
import RadioFormField from "../Form/FormFields/RadioFormField";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import TextFormField from "../Form/FormFields/TextFormField";
import UserAutocompleteFormField from "../Common/UserAutocompleteFormField";

import useAppHistory from "../../Common/hooks/useAppHistory";
import { useDispatch } from "react-redux";

const Loading = lazy(() => import("../Common/Loading"));

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

export const ResourceDetailsUpdate = (props: resourceProps) => {
  const { goBack } = useAppHistory();
  const dispatchAction: any = useDispatch();
  const [qParams, _] = useQueryParams();
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
    const errors = { ...initError };
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

  const handleChange = (e: FieldChangeEvent<unknown>) => {
    dispatch({
      type: "set_form",
      form: { ...state.form, [e.name]: e.value },
    });
  };

  const handleOnSelect = (user: any) => {
    const form = { ...state.form };
    form["assigned_to"] = user?.value?.id;
    SetAssignedUser(user.value);
    dispatch({ type: "set_form", form });
  };

  const setFacility = (selected: any, name: string) => {
    const form = { ...state.form };
    form[name] = selected;
    dispatch({ type: "set_form", form });
  };

  const handleSubmit = async () => {
    const validForm = validateForm();

    if (validForm) {
      setIsLoading(true);

      const data = {
        category: "OXYGEN",
        status: state.form.status,
        origin_facility: state.form.origin_facility_object?.id,
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
          const d = res.data;
          d["status"] = qParams.status || res.data.status;
          dispatch({ type: "set_form", form: d });
        }
        setIsLoading(false);
      }
    },
    [props.id, dispatchAction, qParams.status]
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
    <Page
      title="Update Resource Request"
      backUrl={`/resource/${props.id}`}
      crumbsReplacements={{ [props.id]: { name: requestTitle } }}
    >
      <div className="mt-4">
        <Card className="flex w-full flex-col">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-1">
              <SelectFormField
                label="Status"
                name="status"
                value={state.form.status}
                options={resourceStatusOptions}
                onChange={handleChange}
                optionLabel={(option) => option}
              />
            </div>
            <div className="md:col-span-1">
              <div className="">
                {assignedUserLoading ? (
                  <CircularProgress />
                ) : (
                  <UserAutocompleteFormField
                    label="Assigned To"
                    value={assignedUser === null ? undefined : assignedUser}
                    onChange={handleOnSelect}
                    error=""
                    name="assigned_to"
                  />
                )}
              </div>
            </div>
            <div>
              <FieldLabel>Name of resource approving facility</FieldLabel>
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
              <FieldLabel>
                What facility would you like to assign the request to
              </FieldLabel>
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
              <TextFormField
                label="Required Quantity"
                name="requested_quantity"
                type="number"
                value={state.form.requested_quantity}
                onChange={handleChange}
              />
            </div>
            <div>
              <TextFormField
                name="assigned_quantity"
                type="number"
                label="Approved Quantity"
                value={state.form.assigned_quantity}
                onChange={handleChange}
                disabled={state.form.status !== "PENDING"}
              />
            </div>

            <div className="md:col-span-2">
              <TextFormField
                name="title"
                type="text"
                label="Request Title*"
                placeholder="Type your title here"
                value={state.form.title}
                onChange={handleChange}
                error={state.errors.title}
              />
            </div>

            <div className="md:col-span-2">
              <TextAreaFormField
                rows={5}
                name="reason"
                placeholder="Type your description here"
                value={state.form.reason}
                onChange={handleChange}
                label="Description of request*"
                error={state.errors.reason}
              />
            </div>

            <div>
              <RadioFormField
                name="emergency"
                onChange={handleChange}
                label={"Is this an emergency?"}
                options={[true, false]}
                optionDisplay={(o) => (o ? "Yes" : "No")}
                optionValue={(o) => String(o)}
                value={String(state.form.emergency)}
                error={state.errors.emergency}
              />
            </div>

            <div className="mt-4 flex flex-col justify-between gap-2 md:col-span-2 md:flex-row">
              <Cancel variant="secondary" onClick={() => goBack()} />
              <Submit onClick={handleSubmit} />
            </div>
          </div>
        </Card>
      </div>
    </Page>
  );
};
