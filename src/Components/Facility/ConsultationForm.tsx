import { Box, Button, Card, CardContent, FormControlLabel, InputLabel, Radio, RadioGroup } from "@material-ui/core";
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import moment from "moment";
import React, { useCallback, useReducer, useState } from "react";
import { useDispatch } from "react-redux";
import { ADMITTED_TO, CONSULTATION_SUGGESTION, PATIENT_CATEGORY, SYMPTOM_CHOICES } from "../../Common/constants";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { createConsultation, getConsultation, updateConsultation } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { FacilitySelect } from "../Common/FacilitySelect";
import { DateInputField, ErrorHelperText, MultilineInputField, MultiSelectField, NativeSelectField, SelectField } from "../Common/HelperInputFields";
import { Loading } from "../Common/Loading";
import PageTitle from "../Common/PageTitle";
import { FacilityModel } from "./models";

const initForm: any = {
  hasSymptom: false,
  otherSymptom: false,
  symptoms: [],
  other_symptoms: "",
  symptoms_onset_date: null,
  suggestion: "",
  patient: "",
  facility: "",
  admitted: "false",
  admitted_to: "",
  category: "",
  admission_date: null,
  discharge_date: null,
  referred_to: "",
  examination_details: "",
  existing_medication: "",
  prescribed_medication: ""
};

const initError = Object.assign({}, ...Object.keys(initForm).map(k => ({ [k]: "" })));

const initialState = {
  form: { ...initForm },
  errors: { ...initError }
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
    text: "Select the decision"
  },
  ...CONSULTATION_SUGGESTION
];

const symptomChoices = [...SYMPTOM_CHOICES];

const admittedToChoices = ["Select", ...ADMITTED_TO];

const categoryChoices = [
  {
    id: 0,
    text: "Select suspect category"
  },
  ...PATIENT_CATEGORY
];

const goBack = () => {
  window.history.go(-1);
};

export const ConsultationForm = (props: any) => {
  const dispatchAction: any = useDispatch();
  const { facilityId, patientId, id } = props;
  const [state, dispatch] = useReducer(consultationFormReducer, initialState);
  const [selectedFacility, setSelectedFacility] = useState<FacilityModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const headerText = !id ? "OP Triage / Consultation" : "Edit OP Triage / Consultation";
  const buttonText = !id ? "Add OP Triage / Consultation" : "Update OP Triage / Consultation";

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(getConsultation(id));
      if (!status.aborted) {
        if (res && res.data) {
          const formData = {
            ...res.data,
            hasSymptom: !!res.data.symptoms && !!res.data.symptoms.length && !!res.data.symptoms.filter((i: number) => i !== 1).length,
            otherSymptom: !!res.data.symptoms && !!res.data.symptoms.length && !!res.data.symptoms.filter((i: number) => i === 9).length,
            admitted: res.data.admitted ? String(res.data.admitted) : 'false',
            admitted_to: res.data.admitted_to ? res.data.admitted_to : '',
            category: res.data.category ? res.data.category : '',
          };
          dispatch({ type: "set_form", form: formData });
        } else {
          goBack();
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, id]
  );

  useAbortableEffect(
    (status: statusType) => {
      if (id) {
        fetchData(status);
      }
    },
    [dispatch, fetchData]
  );

  const validateForm = () => {
    let errors = { ...initError };
    let invalidForm = false;
    Object.keys(state.form).forEach((field, i) => {
      switch (field) {
        case "symptoms":
          if (!state.form[field] || !state.form[field].length) {
            errors[field] = "Please select the symptoms";
            invalidForm = true;
          }
          return;
        case "suggestion":
          if (!state.form[field]) {
            errors[field] = "Please enter the decision";
            invalidForm = true;
          }
          return;
        case "other_symptoms":
          if (state.form.otherSymptom && !state.form[field]) {
            errors[field] = "Please enter the other symptom details";
            invalidForm = true;
          }
          return;
        case "symptoms_onset_date":
          if (state.form.hasSymptom && !state.form[field]) {
            errors[field] = "Please enter date of onset of the above symptoms";
            invalidForm = true;
          }
          return;
        case "admitted_to":
        case "admission_date":
          if (JSON.parse(state.form.admitted) && !state.form[field]) {
            errors[field] = "Field is required as person is admitted";
            invalidForm = true;
          }
          return;
        case "referred_to":
          if (state.form.suggestion === 'R' && !state.form[field]) {
            errors[field] = "Please select the referred to facility";
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
        symptoms: state.form.symptoms,
        other_symptoms: state.form.otherSymptom ? state.form.other_symptoms : undefined,
        symptoms_onset_date: state.form.hasSymptom ? state.form.symptoms_onset_date : undefined,
        suggestion: state.form.suggestion,
        admitted: JSON.parse(state.form.admitted),
        admitted_to: JSON.parse(state.form.admitted) ? state.form.admitted_to : undefined,
        category: state.form.category,
        examination_details: state.form.examination_details,
        existing_medication: state.form.existing_medication,
        prescribed_medication: state.form.prescribed_medication,
        admission_date: state.form.admission_date,
        discharge_date: state.form.discharge_date,
        patient: patientId,
        facility: facilityId,
        referred_to: state.form.suggestion === 'R' ? state.form.referred_to : undefined,
      };
      const res = await dispatchAction(id ? updateConsultation(id, data) : createConsultation(data));
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
        }
        goBack();
      }
    }
  };

  const handleChange = (e: any) => {
    const form = { ...state.form };
    const { name, value } = e.target;
    form[name] = value;
    dispatch({ type: "set_form", form });
  };

  const handleSymptomChange = (e: any, child?: any) => {
    const form = { ...state.form };
    const { value } = e?.target;
    const otherSymptoms = value.filter((i: number) => i !== 1);
    // prevent user from selecting asymptomatic along with other options
    form.symptoms = child?.props?.value === 1 ? otherSymptoms.length ? [1] : value : otherSymptoms;
    form.hasSymptom = !!form.symptoms.filter((i: number) => i !== 1).length;
    form.otherSymptom = !!form.symptoms.filter((i: number) => i === 9).length;
    dispatch({ type: "set_form", form });
  };


  const handleDateChange = (date: any, key: string) => {
    if (moment(date).isValid()) {
      const form = { ...state.form };
      form[key] = date;
      dispatch({ type: "set_form", form });
    }
  };

  const setFacility = (selected: FacilityModel | FacilityModel[] | null) => {
    setSelectedFacility(selected as FacilityModel);
    const form = { ...state.form };
    form.referred_to = selected ? (selected as FacilityModel).id : "";
    dispatch({ type: "set_form", form });
  }

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
              <div className="grid gap-4 grid-cols-1">
                <div>
                  <InputLabel id="symptoms-label">
                    Symptoms
                  </InputLabel>
                  <MultiSelectField
                    name="symptoms"
                    variant="outlined"
                    value={state.form.symptoms}
                    options={symptomChoices}
                    onChange={handleSymptomChange}
                  />
                  <ErrorHelperText error={state.errors.symptoms} />
                </div>

                {state.form.otherSymptom && (<div>
                  <InputLabel id="other-symptoms-label">Other Symptom Details</InputLabel>
                  <MultilineInputField
                    rows={5}
                    name="other_symptoms"
                    variant="outlined"
                    margin="dense"
                    type="text"
                    placeholder="Enter the other symptoms here"
                    InputLabelProps={{ shrink: !!state.form.other_symptoms }}
                    value={state.form.other_symptoms}
                    onChange={handleChange}
                    errors={state.errors.other_symptoms}
                  />
                </div>)}

                {state.form.hasSymptom && (<div>
                  <DateInputField
                    label="Date of onset of the symptoms"
                    value={state.form.symptoms_onset_date}
                    onChange={date => handleDateChange(date, "symptoms_onset_date")}
                    disableFuture={true}
                    errors={state.errors.symptoms_onset_date}
                  />
                </div>)}
                <div>
                  <InputLabel id="existing-medication-label">Medication, if any for the above-mentioned symptoms</InputLabel>
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
                </div>

                <div>
                  <InputLabel id="exam-details-label">Examination Details</InputLabel>
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
                </div>

                <div>
                  <InputLabel id="prescribed-medication-label">Prescribed Medication</InputLabel>
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
                </div>

                <div className="flex-1">
                  <InputLabel id="category-label">Category</InputLabel>
                  <SelectField
                    name="category"
                    variant="standard"
                    value={state.form.category}
                    options={categoryChoices}
                    onChange={handleChange}
                    errors={state.errors.category}
                  />
                </div>

                <div>
                  <InputLabel id="suggestion-label" style={{ fontWeight: 'bold', fontSize: '18px' }}>
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
                </div>

                {state.form.suggestion === 'R' && <div>
                  <InputLabel>Referred To Facility</InputLabel>
                  <FacilitySelect
                    name="referred_to"
                    searchAll={true}
                    selected={selectedFacility}
                    setSelected={setFacility}
                    errors={state.errors.referred_to}
                  />
                </div>}

                <div className="flex">
                  <div className="flex-1">
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
                    <ErrorHelperText error={state.errors.admitted} />
                  </div>

                  {JSON.parse(state.form.admitted) && (<div className="flex-1">
                    <SelectField
                      optionArray={true}
                      name="admitted_to"
                      variant="standard"
                      value={state.form.admitted_to}
                      options={admittedToChoices}
                      onChange={handleChange}
                      label="Admitted To*"
                      labelId="admitted-to-label"
                      errors={state.errors.admitted_to}
                    />
                  </div>)}
                </div>

                {JSON.parse(state.form.admitted) && (<div className="flex">
                  <div className="flex-1">
                    <DateInputField
                      label="Admission Date"
                      margin="dense"
                      value={state.form.admission_date}
                      disableFuture={true}
                      onChange={date => handleDateChange(date, "admission_date")}
                      errors={state.errors.admission_date}
                    />
                  </div>
                  <div className="flex-1">
                    <DateInputField
                      label="Discharge Date"
                      margin="dense"
                      value={state.form.discharge_date}
                      onChange={date => handleDateChange(date, "discharge_date")}
                      errors={state.errors.discharge_date}
                    />
                  </div>
                </div>)}

              </div>

              {/*<div>*/}
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
              {/*</div>*/}

              <div className="mt-4 flex justify-between">
                <Button
                  color="default"
                  variant="contained"
                  type="button"
                  onClick={goBack}
                >Cancel </Button>
                <Button
                  color="primary"
                  variant="contained"
                  type="submit"
                  style={{ marginLeft: "auto" }}
                  startIcon={<CheckCircleOutlineIcon>save</CheckCircleOutlineIcon>}
                  onClick={e => handleSubmit(e)}
                >{buttonText}</Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
};
