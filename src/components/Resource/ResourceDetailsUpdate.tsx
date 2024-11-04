import * as Notification from "../../Utils/Notifications";
import { useReducer, useState } from "react";
import { navigate, useQueryParams } from "raviger";
import Card from "../../CAREUI/display/Card";
import CircularProgress from "@/components/Common/components/CircularProgress";
import { FacilitySelect } from "@/components/Common/FacilitySelect";
import { FieldLabel } from "../Form/FormFields/FormField";
import Page from "@/components/Common/components/Page";
import { RESOURCE_CHOICES } from "@/common/constants";
import RadioFormField from "../Form/FormFields/RadioFormField";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import TextFormField from "../Form/FormFields/TextFormField";
import UserAutocomplete from "@/components/Common/UserAutocompleteFormField";
import useAppHistory from "@/common/hooks/useAppHistory";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";
import request from "../../Utils/request/request";

import Loading from "@/components/Common/Loading";
import Form from "../Form/Form";
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

  const { loading: assignedUserLoading } = useQuery(routes.userList);

  const validateForm = (form: typeof initForm) => {
    const errors = { ...initError };
    let validForm = true;

    Object.keys(requiredFields).forEach((field) => {
      if (!form[field] || !form[field].length) {
        errors[field] = requiredFields[field].errorText;
        validForm = true;
      }
    });

    if (form.requested_quantity < 0) {
      validForm = false;
      errors.requested_quantity = "Requested quantity can not be negative";
    }
    if (form.assigned_quantity < 0) {
      validForm = false;
      errors.assigned_quantity = "Assigned quantity can not be negative";
    }

    dispatch({ type: "set_error", errors });
    return validForm;
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

  const handleSubmit = async (form: typeof initForm) => {
    const validForm = validateForm(form);

    if (validForm) {
      setIsLoading(true);

      const resourceData = {
        category: "OXYGEN",
        status: form.status,
        origin_facility: form.origin_facility_object?.id,
        approving_facility: form?.approving_facility_object?.id,
        assigned_facility: form?.assigned_facility_object?.id,
        emergency: [true, "true"].includes(form.emergency),
        title: form.title,
        reason: form.reason,
        assigned_to: form.assigned_to,
        requested_quantity: form.requested_quantity || 0,
        assigned_quantity:
          form.status === "PENDING"
            ? form.assigned_quantity
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
          <Form
            className=""
            defaults={state.form}
            onSubmit={handleSubmit}
            onCancel={() => goBack()}
            noPadding
            hideRestoreDraft
          >
            {(field) => (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-1">
                  <SelectFormField
                    label="Status"
                    name="status"
                    value={field("status").value}
                    options={resourceStatusOptions}
                    onChange={(e: any) => field("status").onChange(e)}
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
                        value={field("assigned_to_object").value}
                        onChange={(e: any) => {
                          field("assigned_to_object").onChange({
                            name: "assigned_to_object",
                            value: e.value,
                          });
                          field("assigned_to").onChange({
                            name: "assigned_to",
                            value: e.value.id,
                          });
                        }}
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
                    selected={field("approving_facility_object").value}
                    setSelected={(obj: any) => {
                      field("approving_facility_object").onChange({
                        name: "approving_facility_object",
                        value: obj,
                      });
                      field("approving_facility").onChange({
                        name: "approving_facility",
                        value: obj.id,
                      });
                    }}
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
                    selected={field("assigned_facility_object").value}
                    setSelected={(obj: any) => {
                      field("assigned_facility_object").onChange({
                        name: "assigned_facility_object",
                        value: obj,
                      });
                      field("assigned_facility").onChange({
                        name: "assigned_facility",
                        value: obj.id,
                      });
                    }}
                    errors={state.errors.assigned_facility}
                  />
                </div>
                <div>
                  <TextFormField
                    label="Required Quantity"
                    name="requested_quantity"
                    type="number"
                    value={field("requested_quantity").value}
                    onChange={(e: any) =>
                      field("requested_quantity").onChange(e)
                    }
                    error={state.errors.requested_quantity}
                  />
                </div>
                <div>
                  <TextFormField
                    name="assigned_quantity"
                    type="number"
                    label="Approved Quantity"
                    value={field("assigned_quantity").value}
                    onChange={(e: any) =>
                      field("assigned_quantity").onChange(e)
                    }
                    disabled={state.form.status !== "PENDING"}
                    error={state.errors.assigned_quantity}
                  />
                </div>

                <div className="md:col-span-2">
                  <TextFormField
                    name="title"
                    type="text"
                    label="Request Title*"
                    placeholder="Type your title here"
                    value={field("title").value}
                    onChange={(e: any) => field("title").onChange(e)}
                    error={state.errors.title}
                  />
                </div>

                <div className="md:col-span-2">
                  <TextAreaFormField
                    rows={5}
                    name="reason"
                    placeholder="Type your description here"
                    value={field("reason").value}
                    onChange={(e: any) => field("reason").onChange(e)}
                    label="Description of request*"
                    error={state.errors.reason}
                  />
                </div>

                <div>
                  <RadioFormField
                    name="emergency"
                    onChange={(e: any) => field("emergency").onChange(e)}
                    label={"Is this an emergency?"}
                    options={[true, false]}
                    optionLabel={(o) => (o ? "Yes" : "No")}
                    optionValue={(o) => String(o)}
                    value={String(field("emergency").value)}
                    error={state.errors.emergency}
                  />
                </div>
              </div>
            )}
          </Form>
        </Card>
      </div>
    </Page>
  );
};
