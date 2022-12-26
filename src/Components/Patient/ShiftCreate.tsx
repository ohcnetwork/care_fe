import { useReducer, useState, useEffect } from "react";
import loadable from "@loadable/component";
import { FacilitySelect } from "../Common/FacilitySelect";
import {
  TextInputField,
  ErrorHelperText,
  PhoneNumberField,
  SelectField,
} from "../Common/HelperInputFields";
import * as Notification from "../../Utils/Notifications.js";
import { useDispatch } from "react-redux";
import { navigate } from "raviger";
import {
  FACILITY_TYPES,
  SHIFTING_VEHICLE_CHOICES,
  BREATHLESSNESS_LEVEL,
} from "../../Common/constants";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import {
  Card,
  CardContent,
  Radio,
  RadioGroup,
  Box,
  FormControlLabel,
} from "@material-ui/core";
import { phonePreg } from "../../Common/validation";

import { createShift, getPatient } from "../../Redux/actions";
import { goBack } from "../../Utils/utils";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import { FieldLabel } from "../Form/FormFields/FormField";
const PageTitle = loadable(() => import("../Common/PageTitle"));
const Loading = loadable(() => import("../Common/Loading"));

interface patientShiftProps {
  facilityId: number;
  patientId: number;
}

const initForm: any = {
  shifting_approving_facility: null,
  assigned_facility: null,
  emergency: "false",
  is_up_shift: "true",
  reason: "",
  vehicle_preference: "",
  comments: "",
  refering_facility_contact_name: "",
  refering_facility_contact_number: "",
  assigned_facility_type: "",
  preferred_vehicle_choice: "",
  breathlessness_level: "",
};

const requiredFields: any = {
  shifting_approving_facility: {
    errorText: "Name of the referring facility",
  },
  refering_facility_contact_name: {
    errorText: "Name of contact of the referring facility",
  },
  refering_facility_contact_number: {
    errorText: "Phone number of contact of the referring facility",
    invalidText: "Please enter valid phone number",
  },
  reason: {
    errorText: "Reason for shifting in mandatory",
    invalidText: "Please enter reason for shifting",
  },
  assigned_facility_type: {
    errorText: "Please Select Facility Type",
  },
  preferred_vehicle_choice: {
    errorText: "Please Preferred Vehicle Type",
  },
  breathlessness_level: {
    errorText: "Severity of Breathlessness is required",
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

export const ShiftCreate = (props: patientShiftProps) => {
  const { facilityId, patientId } = props;
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [facilityName, setFacilityName] = useState("");
  const [patientName, setPatientName] = useState("");

  useEffect(() => {
    async function fetchPatientName() {
      if (patientId) {
        const res = await dispatchAction(getPatient({ id: patientId }));
        if (res.data) {
          setPatientName(res.data.name);
          setFacilityName(res.data.facility_object.name);
        }
      } else {
        setPatientName("");
        setFacilityName("");
      }
    }
    fetchPatientName();
  }, [dispatchAction, patientId]);

  const shiftFormReducer = (state = initialState, action: any) => {
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

  const [state, dispatch] = useReducer(shiftFormReducer, initialState);

  const validateForm = () => {
    const errors = { ...initError };
    let isInvalidForm = false;
    Object.keys(requiredFields).forEach((field) => {
      const phoneNumber = parsePhoneNumberFromString(state.form[field]);
      switch (field) {
        case "refering_facility_contact_number":
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
        default:
          if (!state.form[field]) {
            errors[field] = requiredFields[field].errorText;
            isInvalidForm = true;
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

  const handleTextAreaChange = (e: any) => {
    const form = { ...state.form };
    const { name, value } = e;
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
        orgin_facility: props.facilityId,
        shifting_approving_facility: (
          state.form.shifting_approving_facility || {}
        ).id,
        assigned_facility: (state.form.assigned_facility || {}).id,
        patient: props.patientId,
        emergency: state.form.emergency === "true",
        is_up_shift: state.form.is_up_shift === "true",
        reason: state.form.reason,
        vehicle_preference: state.form.vehicle_preference,
        comments: state.form.comments,
        assigned_facility_type: state.form.assigned_facility_type,
        preferred_vehicle_choice: state.form.preferred_vehicle_choice,
        refering_facility_contact_name:
          state.form.refering_facility_contact_name,
        refering_facility_contact_number: parsePhoneNumberFromString(
          state.form.refering_facility_contact_number
        )?.format("E.164"),
        breathlessness_level: state.form.breathlessness_level,
      };

      const res = await dispatchAction(createShift(data));
      setIsLoading(false);

      if (res && res.data && (res.status == 201 || res.status == 200)) {
        await dispatch({ type: "set_form", form: initForm });
        Notification.Success({
          msg: "Shift request created successfully",
        });

        navigate(`/shifting/${res.data.id}`);
      }
    }
  };
  const vehicleOptions = SHIFTING_VEHICLE_CHOICES.map((obj) => obj.text);
  const facilityOptions = FACILITY_TYPES.map((obj) => obj.text);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="px-2 pb-2">
      <PageTitle
        title={"Create Shift Request"}
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          [patientId]: { name: patientName },
        }}
      />
      <div className="mt-4">
        <Card>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
                <FieldLabel>Contact person at the facility*</FieldLabel>
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
                <FieldLabel>Name of shifting approving facility*</FieldLabel>
                <FacilitySelect
                  multiple={false}
                  facilityType={1300}
                  name="shifting_approving_facility"
                  selected={state.form.shifting_approving_facility}
                  setSelected={(value: any) =>
                    handleValueChange(value, "shifting_approving_facility")
                  }
                  errors={state.errors.shifting_approving_facility}
                />
              </div>

              <div>
                <FieldLabel>
                  What facility would you like to assign the patient to
                </FieldLabel>
                <FacilitySelect
                  multiple={false}
                  name="assigned_facility"
                  selected={state.form.assigned_facility}
                  setSelected={(value: any) =>
                    handleValueChange(value, "assigned_facility")
                  }
                  errors={state.errors.assigned_facility}
                />
              </div>

              <div>
                <FieldLabel>Is this an emergency?</FieldLabel>
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
                <FieldLabel>Is this an upshift?</FieldLabel>
                <RadioGroup
                  aria-label="is it upshift"
                  name="is_up_shift"
                  value={state.form.is_up_shift === "true"}
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
                <ErrorHelperText error={state.errors.is_up_shift} />
              </div>
              <div className="md:col-span-1">
                <FieldLabel>Preferred Vehicle*</FieldLabel>
                <SelectField
                  name="preferred_vehicle_choice"
                  variant="outlined"
                  margin="dense"
                  optionArray={true}
                  value={state.form.preferred_vehicle_choice}
                  options={["", ...vehicleOptions]}
                  onChange={handleChange}
                  className="bg-white h-11 w-fit mt-2 shadow-sm md:leading-5"
                  errors={state.errors.preferred_vehicle_choice}
                />
              </div>
              <div className="md:col-span-1">
                <FieldLabel>Preferred Facility Type*</FieldLabel>
                <SelectField
                  name="assigned_facility_type"
                  variant="outlined"
                  margin="dense"
                  optionArray={true}
                  value={state.form.assigned_facility_type}
                  options={["", ...facilityOptions]}
                  onChange={handleChange}
                  className="bg-white h-11 w-fit mt-2 shadow-sm md:leading-5"
                  errors={state.errors.assigned_facility_type}
                />
              </div>
              <div className="md:col-span-1">
                <FieldLabel>Severity of Breathlessness*</FieldLabel>
                <SelectField
                  name="breathlessness_level"
                  variant="outlined"
                  margin="dense"
                  optionArray={true}
                  value={state.form.breathlessness_level}
                  options={["", ...BREATHLESSNESS_LEVEL]}
                  onChange={handleChange}
                  className="bg-white h-11 w-fit mt-2 shadow-sm md:leading-5"
                  errors={state.errors.breathlessness_level}
                />
              </div>

              <div className="md:col-span-2">
                <TextAreaFormField
                  rows={5}
                  name="reason"
                  label="Reason for shift*"
                  placeholder="Type your reason here"
                  value={state.form.reason}
                  onChange={handleTextAreaChange}
                  error={state.errors.reason}
                />
              </div>

              <div className="md:col-span-2">
                <TextAreaFormField
                  rows={5}
                  name="comments"
                  label="Any other comments"
                  placeholder="type any extra comments here"
                  value={state.form.comments}
                  onChange={handleTextAreaChange}
                  error={state.errors.comments}
                />
              </div>

              <div className="md:col-span-2 flex justify-between mt-4">
                <Cancel onClick={() => goBack()} />
                <Submit onClick={handleSubmit} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
