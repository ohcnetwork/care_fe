import { navigate, useQueryParams } from "raviger";
import { useReducer, useState } from "react";

import Card from "@/CAREUI/display/Card";

import { Cancel, Submit } from "@/components/Common/ButtonV2";
import CircularProgress from "@/components/Common/CircularProgress";
import { FacilitySelect } from "@/components/Common/FacilitySelect";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import UserAutocomplete from "@/components/Common/UserAutocompleteFormField";
import { FieldLabel } from "@/components/Form/FormFields/FormField";
import RadioFormField from "@/components/Form/FormFields/RadioFormField";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import TextAreaFormField from "@/components/Form/FormFields/TextAreaFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import { FieldChangeEvent } from "@/components/Form/FormFields/Utils";
import { UserModel } from "@/components/Users/models";

import useAppHistory from "@/hooks/useAppHistory";

import { RESOURCE_CHOICES } from "@/common/constants";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";

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
  ...Object.keys(initForm).map((k) => ({ [k]: "" })),
);

const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};

export const ResourceDetailsUpdate = (props: resourceProps) => {
  const { goBack } = useAppHistory();
  const [qParams, _] = useQueryParams();
  const [isLoading, setIsLoading] = useState(true);
  const [assignedUser, SetAssignedUser] = useState<UserModel>();
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

  const { loading: assignedUserLoading } = useQuery(routes.userList, {
    onResponse: ({ res, data }) => {
      if (res?.ok && data && data.count) {
        SetAssignedUser(data.results[0]);
      }
    },
  });

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

  const { data: resourceDetails } = useQuery(routes.getResourceDetails, {
    pathParams: { id: props.id },
    onResponse: ({ res, data }) => {
      if (res && data) {
        const d = data;
        d["status"] = qParams.status || data.status;
        dispatch({ type: "set_form", form: d });
      }
      setIsLoading(false);
    },
  });

  const handleSubmit = async () => {
    const validForm = validateForm();

    if (validForm) {
      setIsLoading(true);

      const resourceData = {
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
            : resourceDetails?.assigned_quantity || 0,
      };

      const { res, data } = await request(routes.updateResource, {
        pathParams: { id: props.id },
        body: resourceData,
      });
      setIsLoading(false);

      if (res && res.status == 200 && data) {
        dispatch({ type: "set_form", form: data });
        Notification.Success({
          msg: "Resource request updated successfully",
        });

        navigate(`/resource/${props.id}`);
      } else {
        setIsLoading(false);
      }
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Page
      title="Update Resource Request"
      backUrl={`/resource/${props.id}`}
      crumbsReplacements={{ [props.id]: { name: resourceDetails?.title } }}
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
                  <UserAutocomplete
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
                optionLabel={(o) => (o ? "Yes" : "No")}
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
