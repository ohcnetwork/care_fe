import { Box, Button, Card, CardActions, CardContent, FormControlLabel, Grid, InputLabel, Radio, RadioGroup } from "@material-ui/core";
import { navigate } from "hookrouter";
import React, { useReducer, useState } from "react";
import { useDispatch } from "react-redux";
import { CONSULTATION_SUGGESTION } from "../../Common/constants";
import { createConsultation } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { DateInputField, ErrorHelperText, MultilineInputField, NativeSelectField } from "../Common/HelperInputFields";
import { Loading } from "../Common/Loading";
import PageTitle from "../Common/PageTitle";

const initForm: any = {
  suggestion: "",
  patient: "",
  facility: "",
  admitted: "false",
  admission_date: null,
  discharge_date: null,
  referred_to: "",
  examination_details: "",
  existing_medication: "",
  prescribed_medication: ""
};

const initialState = {
  form: { ...initForm },
  errors: { ...initForm }
};

const consultationFormReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case "set_form": {
      return {
        ...state,
        form: action.form
      };
    }
    case "set_error": {
      return {
        ...state,
        errors: action.errors
      };
    }
    default:
      return state;
  }
};

const suggestionTypes = [
  {
    id: 0,
    text: "Select"
  },
  ...CONSULTATION_SUGGESTION
];

export const Consultation = (props: any) => {
  const dispatchAction: any = useDispatch();
  const { facilityId, patientId, id } = props;
  const [state, dispatch] = useReducer(consultationFormReducer, initialState);
  const [isLoading, setIsLoading] = useState(false);

  const headerText = !id ? "OP Triage / Consultation" : "Consultation";
  const buttonText = !id ? "Save" : "Update";

  const validateForm = () => {
    let errors = { ...initForm };
    let invalidForm = false;
    Object.keys(state.form).forEach((field, i) => {
      switch (field) {
        case "suggestion":
          if (!state.form[field]) {
            errors[field] = "Field is required";
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

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const validForm = validateForm();
    if (validForm) {
      setIsLoading(true);
      const data = {
        examination_details: state.form.examination_details,
        existing_medication: state.form.existing_medication,
        prescribed_medication: state.form.prescribed_medication,
        suggestion: state.form.suggestion,
        admitted: JSON.parse(state.form.admitted),
        admission_date: state.form.admission_date,
        discharge_date: state.form.discharge_date,
        patient: Number(patientId),
        facility: Number(facilityId),
        referred_to: null
      };

      console.log("data: ", data);
      const res = await dispatchAction(createConsultation(data));
      console.log("res: ", res);
      setIsLoading(false);
      if (res && res.data) {
        dispatch({ type: "set_form", form: initForm });
        if (id) {
          Notification.Success({
            msg: "Consultation updated successfully"
          });
        } else {
          Notification.Success({
            msg: "Consultation created successfully"
          });
          navigate(`/facility/${facilityId}/patient/${patientId}`);
        }
      }
    }
  };

  const handleChange = (e: any) => {
    let form = { ...state.form };
    form[e.target.name] = e.target.value;
    dispatch({ type: "set_form", form });
  };

  const handleDateChange = (date: any, key: string) => {
    let form = { ...state.form };
    form[key] = date;
    dispatch({ type: "set_form", form });
  };

  const handleCancel = () => {
    navigate(`/facility/${facilityId}/patient/${patientId}`);
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div>
      <PageTitle title={headerText} />
      <div className="mt-4">
        <Card>
          <form onSubmit={e => handleSubmit(e)}>
            <CardContent>
              <InputLabel id="demo-simple-select-outlined-label" style={{ fontWeight: 'bold', fontSize: '18px' }}>
                Decision after OP Triage/Consultation
              </InputLabel>
              <NativeSelectField
                name="suggestion"
                variant="outlined"
                value={state.form.suggestion}
                options={suggestionTypes}
                onChange={handleChange}
              />
              <ErrorHelperText error={state.errors.suggestion} />
            </CardContent>

            <CardContent>
              <InputLabel id="admitted-label">Admitted</InputLabel>
              <RadioGroup
                aria-label="covid"
                name="admitted"
                value={state.form.admitted}
                onChange={handleChange}
                style={{ padding: "0px 5px" }}
              >
                <Box display="flex" flexDirection="row">
                  <FormControlLabel
                    value="true"
                    control={<Radio />}
                    label="Yes"
                  />
                  <FormControlLabel
                    value="false"
                    control={<Radio />}
                    label="No"
                  />
                </Box>
              </RadioGroup>
              <ErrorHelperText error={state.errors.contact_with_carrier} />
            </CardContent>

            <CardContent>
              <Grid
                container
                justify="space-between"
                alignItems="center"
                spacing={1}
              >
                <Grid item xs={6}>
                  <DateInputField
                    label="Admission Date"
                    value={state.form.admission_date}
                    onChange={date => handleDateChange(date, "admission_date")}
                    errors={state.errors.admission_date}
                  />
                </Grid>
                <Grid item xs={6}>
                  <DateInputField
                    label="Discharge Date"
                    value={state.form.discharge_date}
                    onChange={date => handleDateChange(date, "discharge_date")}
                    errors={state.errors.discharge_date}
                  />
                </Grid>
              </Grid>
            </CardContent>

            <CardContent>
              <InputLabel id="existing-medication-label">
                Medication, if any for the above-mentioned symptoms
              </InputLabel>
              <MultilineInputField
                rows={5}
                name="existing_medication"
                variant="outlined"
                margin="dense"
                type="text"
                placeholder="Information optional"
                InputLabelProps={{ shrink: !!state.form.existing_medication }}
                value={state.form.existing_medication}
                onChange={handleChange}
                errors={state.errors.existing_medication}
              />
            </CardContent>

            <CardContent>
              <InputLabel id="exam-details-label">
                Examination Details
              </InputLabel>
              <MultilineInputField
                rows={5}
                name="examination_details"
                variant="outlined"
                margin="dense"
                type="text"
                placeholder="Information optional"
                InputLabelProps={{ shrink: !!state.form.examination_details }}
                value={state.form.examination_details}
                onChange={handleChange}
                errors={state.errors.examination_details}
              />
            </CardContent>

            <CardContent>
              <InputLabel id="prescribed-medication-label">
                Prescribed Medication
              </InputLabel>
              <MultilineInputField
                rows={5}
                name="prescribed_medication"
                variant="outlined"
                margin="dense"
                type="text"
                placeholder="Information optional"
                InputLabelProps={{ shrink: !!state.form.prescribed_medication }}
                value={state.form.prescribed_medication}
                onChange={handleChange}
                errors={state.errors.prescribed_medication}
              />
            </CardContent>

            {/*<CardContent>*/}
            {/*    <InputLabel id="refered-label">Referred To Facility</InputLabel>*/}
            {/*    <TextInputField*/}
            {/*        name="referred_to"*/}
            {/*        variant="outlined"*/}
            {/*        margin="dense"*/}
            {/*        type="number"*/}
            {/*        InputLabelProps={{ shrink: !!state.form.referred_to}}*/}
            {/*        value={state.form.referred_to}*/}
            {/*        onChange={handleChange}*/}
            {/*        errors={state.errors.referred_to}*/}
            {/*    />*/}
            {/*</CardContent>*/}

            <CardActions
              className="padding16"
              style={{ justifyContent: "space-between" }}
            >
              <Button
                color="default"
                variant="contained"
                type="button"
                onClick={e => handleCancel()}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                variant="contained"
                type="submit"
                style={{ marginLeft: "auto" }}
                onClick={e => handleSubmit(e)}
              >
                {buttonText}
              </Button>
            </CardActions>
          </form>
        </Card>
      </div>
    </div>
  );
};
