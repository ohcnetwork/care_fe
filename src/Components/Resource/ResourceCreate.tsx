import React, { useReducer, useState, useEffect } from "react";
import loadable from "@loadable/component";
import { FacilitySelect } from "../Common/FacilitySelect";
import {
  TextInputField,
  MultilineInputField,
  ErrorHelperText,
  PhoneNumberField,
  SelectField,
} from "../Common/HelperInputFields";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import * as Notification from "../../Utils/Notifications.js";
import { useDispatch } from "react-redux";
import { navigate } from "raviger";
import {
  RESOURCE_CATEGORY_CHOICES,
  RESOURCE_SUBCATEGORIES,
} from "../../Common/constants";
import { parsePhoneNumberFromString } from "libphonenumber-js";
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
import { phonePreg } from "../../Common/validation";

import { createResource, getAnyFacility } from "../../Redux/actions";
const PageTitle = loadable(() => import("../Common/PageTitle"));
const Loading = loadable(() => import("../Common/Loading"));

interface resourceProps {
  facilityId: number;
}

const initForm: any = {
  category: "OXYGEN",
  sub_category: 1000,
  approving_facility: null,
  assigned_facility: null,
  emergency: "false",
  title: "",
  reason: "",
  refering_facility_contact_name: "",
  refering_facility_contact_number: "",
  required_quantity: null,
};

const requiredFields: any = {
  category: {
    errorText: "Category",
  },
  sub_category: {
    errorText: "Subcategory",
  },
  approving_facility: {
    errorText: "Name of the referring facility",
  },
  refering_facility_contact_name: {
    errorText: "Name of contact of the referring facility",
  },
  refering_facility_contact_number: {
    errorText: "Phone number of contact of the referring facility",
    invalidText: "Please enter valid phone number",
  },
  title: {
    errorText: "Title for resource request is mandatory",
    invalidText: "Please enter title for resource request",
  },
  reason: {
    errorText: "Description of resource request is mandatory",
    invalidText: "Please enter Description of resource request",
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

export default function ResourceCreate(props: resourceProps) {
  const { facilityId } = props;

  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [facilityName, setFacilityName] = useState("");

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

  const validateForm = () => {
    let errors = { ...initError };
    let isInvalidForm = false;
    Object.keys(requiredFields).forEach((field) => {
      switch (field) {
        case "refering_facility_contact_number": {
          const phoneNumber = parsePhoneNumberFromString(state.form[field]);
          if (!state.form[field]) {
            errors[field] = requiredFields[field].errorText;
            isInvalidForm = true;
          } else if (
            !phoneNumber?.isPossible() ||
            !phonePreg(String(phoneNumber?.number))
          ) {
            errors[field] = requiredFields[field].invalidText;
            isInvalidForm = true;
          }
          return;
        }
        default: {
          if (!state.form[field]) {
            errors[field] = requiredFields[field].errorText;
            isInvalidForm = true;
          }
        }
      }
    });

    dispatch({ type: "set_error", errors });
    return !isInvalidForm;
  };

  const handleChange = (e: any) => {
    const form = { ...state.form };
    const { name, value } = e.target;
    form[name] = value;
    dispatch({ type: "set_form", form });
  };

  const handleValueChange = (value: any, name: string) => {
    const form = { ...state.form };
    form[name] = value;
    dispatch({ type: "set_form", form });
  };

  const handleSubmit = async () => {
    const validForm = validateForm();

    if (validForm) {
      setIsLoading(true);

      const data = {
        status: "PENDING",
        category: state.form.category,
        sub_category: state.form.sub_category,
        orgin_facility: props.facilityId,
        approving_facility: (state.form.approving_facility || {}).id,
        assigned_facility: (state.form.assigned_facility || {}).id,
        emergency: state.form.emergency === "true",
        title: state.form.title,
        reason: state.form.reason,
        refering_facility_contact_name:
          state.form.refering_facility_contact_name,
        refering_facility_contact_number: parsePhoneNumberFromString(
          state.form.refering_facility_contact_number
        )?.format("E.164"),
        requested_quantity: state.form.requested_quantity || 0,
      };

      const res = await dispatchAction(createResource(data));
      setIsLoading(false);

      if (res && res.data && (res.status === 201 || res.status === 200)) {
        await dispatch({ type: "set_form", form: initForm });
        Notification.Success({
          msg: "Resource request created successfully",
        });

        navigate(`/resource/${res.data.id}`);
      }
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="px-2 pb-2">
      <PageTitle
        title={"Create Resource Request"}
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          resource: { style: "pointer-events-none" },
        }}
      />
      <div className="mt-4">
        <Card>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
                <InputLabel>Name of Contact Person at Facility*</InputLabel>
                <TextInputField
                  fullWidth
                  name="refering_facility_contact_name"
                  variant="outlined"
                  margin="dense"
                  value={state.form.refering_facility_contact_name}
                  onChange={handleChange}
                  errors={state.errors.refering_facility_contact_name}
                />
              </div>

              <div>
                <PhoneNumberField
                  label="Contact person phone*"
                  onlyIndia={true}
                  value={state.form.refering_facility_contact_number}
                  onChange={(value: any) =>
                    handleValueChange(value, "refering_facility_contact_number")
                  }
                  errors={state.errors.refering_facility_contact_number}
                />
              </div>

              <div>
                <InputLabel>Name of approving facility*</InputLabel>
                <FacilitySelect
                  multiple={false}
                  facilityType={1500}
                  name="approving_facility"
                  selected={state.form.approving_facility}
                  setSelected={(value: any) =>
                    handleValueChange(value, "approving_facility")
                  }
                  errors={state.errors.approving_facility}
                />
              </div>

              <div>
                <InputLabel>Is this an emergency?</InputLabel>
                <RadioGroup
                  aria-label="emergency"
                  name="emergency"
                  value={state.form.emergency === "true"}
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

              <div>
                <InputLabel>Category</InputLabel>
                <SelectField
                  name="category"
                  variant="outlined"
                  margin="dense"
                  optionArray={true}
                  value={state.form.category}
                  options={RESOURCE_CATEGORY_CHOICES}
                  onChange={handleChange}
                  className="bg-white h-14 w-1/3 mt-2 shadow-sm md:text-sm md:leading-5"
                />
              </div>

              <div>
                <InputLabel>Subcategory</InputLabel>
                <SelectField
                  name="sub_category"
                  variant="outlined"
                  margin="dense"
                  value={state.form.sub_category}
                  options={RESOURCE_SUBCATEGORIES}
                  onChange={handleChange}
                  className="bg-white h-14 w-1/3 mt-2 shadow-sm md:text-sm md:leading-5"
                />
              </div>

              <div>
                <InputLabel>Required Quantity</InputLabel>
                <TextInputField
                  name="requested_quantity"
                  variant="outlined"
                  margin="dense"
                  type="number"
                  value={state.form.required_quantity}
                  onChange={handleChange}
                  errors=""
                />
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
                  onClick={() => handleSubmit()}
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
}
