import { t as Prescription_t } from "@coronasafe/prescription-builder/src/Types/Prescription__Prescription.gen";
import loadable from "@loadable/component";
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  InputLabel,
  Radio,
  RadioGroup,
} from "@material-ui/core";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import { navigate } from "raviger";
import moment from "moment";
import React, { useCallback, useReducer, useState } from "react";
import { useDispatch } from "react-redux";
import {
  ADMITTED_TO,
  CONSULTATION_SUGGESTION,
  PATIENT_CATEGORY,
  SYMPTOM_CHOICES,
  TELEMEDICINE_ACTIONS,
  REVIEW_AT_CHOICES,
} from "../../Common/constants";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  createConsultation,
  getConsultation,
  updateConsultation,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { FacilitySelect } from "../Common/FacilitySelect";
import {
  DateInputField,
  ErrorHelperText,
  MultilineInputField,
  MultiSelectField,
  NativeSelectField,
  SelectField,
  TextInputField,
} from "../Common/HelperInputFields";
import { make as PrescriptionBuilder } from "../Common/PrescriptionBuilder.gen";
import { FacilityModel } from "./models";
import { OnlineDoctorsSelect } from "../Common/OnlineDoctorsSelect";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

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
  admission_date: new Date(),
  discharge_date: null,
  referred_to: "",
  diagnosis: "",
  verified_by: "",
  test_id: "",
  is_kasp: "false",
  kasp_enabled_date: null,
  examination_details: "",
  existing_medication: "",
  prescribed_medication: "",
  consultation_notes: "",
  ip_no: "",
  discharge_advice: [],
  is_telemedicine: "false",
  action: "PENDING",
  assigned_to: "",
};

const initError = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" }))
);

const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};

const consultationFormReducer = (state = initialState, action: any) => {
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

const suggestionTypes = [
  {
    id: 0,
    text: "Select the decision",
  },
  ...CONSULTATION_SUGGESTION,
];

const symptomChoices = [...SYMPTOM_CHOICES];

const admittedToChoices = ["Select", ...ADMITTED_TO];

const categoryChoices = [
  {
    id: 0,
    text: "Select suspect category",
  },
  ...PATIENT_CATEGORY,
];

const goBack = () => {
  window.history.go(-1);
};

export const ConsultationForm = (props: any) => {
  const dispatchAction: any = useDispatch();
  const { facilityId, patientId, id } = props;
  const [state, dispatch] = useReducer(consultationFormReducer, initialState);
  const [dischargeAdvice, setDischargeAdvice] = useState<Prescription_t[]>([]);
  const [selectedFacility, setSelectedFacility] =
    useState<FacilityModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const headerText = !id ? "Consultation" : "Edit Consultation";
  const buttonText = !id ? "Add Consultation" : "Update Consultation";

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(getConsultation(id));
      if (
        res &&
        res.data &&
        res.data.discharge_advice &&
        Object.keys(res.data.discharge_advice).length != 0
      ) {
        setDischargeAdvice(res && res.data && res.data.discharge_advice);
      }

      if (!status.aborted) {
        if (res && res.data) {
          const formData = {
            ...res.data,
            hasSymptom:
              !!res.data.symptoms &&
              !!res.data.symptoms.length &&
              !!res.data.symptoms.filter((i: number) => i !== 1).length,
            otherSymptom:
              !!res.data.symptoms &&
              !!res.data.symptoms.length &&
              !!res.data.symptoms.filter((i: number) => i === 9).length,
            admitted: res.data.admitted ? String(res.data.admitted) : "false",
            admitted_to: res.data.admitted_to ? res.data.admitted_to : "",
            category: res.data.category ? res.data.category : "",
            ip_no: res.data.ip_no ? res.data.ip_no : "",
            test_id: res.data.test_id ? res.data.test_id : "",
            diagnosis: res.data.diagnosis ? res.data.diagnosis : "",
            verified_by: res.data.verified_by ? res.data.verified_by : "",
            OPconsultation: res.data.consultation_notes,
            is_telemedicine: `${res.data.is_telemedicine}`,
            is_kasp: `${res.data.is_kasp}`,
            assigned_to: res.data.assigned_to || "",
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
        case "category":
          if (!state.form[field] || !state.form[field].length) {
            errors[field] = "Please select the category";
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
          if (state.form.suggestion === "R" && !state.form[field]) {
            errors[field] = "Please select the referred to facility";
            invalidForm = true;
          }
          return;
        case "OPconsultation":
          if (state.form.suggestion === "OP" && !state.form[field]) {
            errors[field] = "Please enter OP consultation Details";
            invalidForm = true;
          }
        case "is_telemedicine":
          if ( state.form.admitted_to === "Home Isolation" && state.form[field] === "false") {
            errors[field] = "Telemedicine should be `Yes` when Admitted To is Home Isolation";
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
        other_symptoms: state.form.otherSymptom
          ? state.form.other_symptoms
          : undefined,
        symptoms_onset_date: state.form.hasSymptom
          ? state.form.symptoms_onset_date
          : undefined,
        suggestion: state.form.suggestion,
        admitted: JSON.parse(state.form.admitted),
        admitted_to: JSON.parse(state.form.admitted)
          ? state.form.admitted_to
          : undefined,
        admission_date: JSON.parse(state.form.admitted)
          ? state.form.admission_date
          : undefined,
        category: state.form.category,
        is_kasp: state.form.is_kasp,
        kasp_enabled_date: state.form.is_kasp === "true" ? new Date() : null,
        examination_details: state.form.examination_details,
        existing_medication: state.form.existing_medication,
        prescribed_medication: state.form.prescribed_medication,
        discharge_date: state.form.discharge_date,
        ip_no: state.form.ip_no,
        diagnosis: state.form.diagnosis,
        verified_by: state.form.verified_by,
        discharge_advice: dischargeAdvice,
        patient: patientId,
        facility: facilityId,
        test_id: state.form.test_id,
        referred_to:
          state.form.suggestion === "R" ? state.form.referred_to : undefined,
        consultation_notes: state.form.OPconsultation,
        is_telemedicine: state.form.is_telemedicine,
        action: state.form.action,
        review_time: state.form.review_time,
        assigned_to: state.form.is_telemedicine === "true" ? state.form.assigned_to : "",
      };
      const res = await dispatchAction(
        id ? updateConsultation(id, data) : createConsultation(data)
      );
      setIsLoading(false);
      if (res && res.data && res.status !== 400) {
        dispatch({ type: "set_form", form: initForm });
        if (id) {
          Notification.Success({
            msg: "Consultation updated successfully",
          });
        } else {
          Notification.Success({
            msg: "Consultation created successfully",
          });
        }
        navigate(`/facility/${facilityId}/patient/${patientId}`);
      }
    }
  };

  const handleChange = (e: any) => {
    const form = { ...state.form };
    const { name, value } = e.target;
    form[name] = value;
    dispatch({ type: "set_form", form });
  };

  const handleTelemedicineChange = (e: any) => {
    const form = { ...state.form };
    const { name, value } = e.target;
    form[name] = value;
    if (value === "false") {
      form.action = "PENDING";
    }
    dispatch({ type: "set_form", form });
  };

  const handleDecisionChange = (e: any) => {
    const form = { ...state.form };
    const { name, value } = e.target;
    form[name] = value;
    if (value === "A") {
      form.admitted = "true";
    }
    dispatch({ type: "set_form", form });
  };

  const handleSymptomChange = (e: any, child?: any) => {
    const form = { ...state.form };
    const { value } = e?.target;
    const otherSymptoms = value.filter((i: number) => i !== 1);
    // prevent user from selecting asymptomatic along with other options
    form.symptoms =
      child?.props?.value === 1
        ? otherSymptoms.length
          ? [1]
          : value
        : otherSymptoms;
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

  const handleOnSelect = (id: string) => {
    const form = { ...state.form };
    form["assigned_to"] = id;
    dispatch({ type: "set_form", form });
  };

  const setFacility = (selected: FacilityModel | FacilityModel[] | null) => {
    setSelectedFacility(selected as FacilityModel);
    const form = { ...state.form };
    form.referred_to = selected ? (selected as FacilityModel).id : "";
    dispatch({ type: "set_form", form });
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="px-2 pb-2 max-w-3xl mx-auto">
      <PageTitle title={headerText} />
      <div className="mt-4">
        <div className="bg-white rounded shadow">
          <form onSubmit={(e) => handleSubmit(e)}>
            <CardContent>
              <div className="grid gap-4 grid-cols-1">
                <div>
                  <InputLabel id="symptoms-label">Symptoms</InputLabel>
                  <MultiSelectField
                    name="symptoms"
                    variant="outlined"
                    value={state.form.symptoms}
                    options={symptomChoices}
                    onChange={handleSymptomChange}
                  />
                  <ErrorHelperText error={state.errors.symptoms} />
                </div>

                {state.form.otherSymptom && (
                  <div>
                    <InputLabel id="other-symptoms-label">
                      Other Symptom Details
                    </InputLabel>
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
                  </div>
                )}

                {state.form.hasSymptom && (
                  <div>
                    <DateInputField
                      label="Date of onset of the symptoms"
                      value={state.form.symptoms_onset_date}
                      onChange={(date) =>
                        handleDateChange(date, "symptoms_onset_date")
                      }
                      disableFuture={true}
                      errors={state.errors.symptoms_onset_date}
                    />
                  </div>
                )}
                <div>
                  <InputLabel id="existing-medication-label">
                    History of present illness
                  </InputLabel>
                  <MultilineInputField
                    rows={5}
                    name="existing_medication"
                    variant="outlined"
                    margin="dense"
                    type="text"
                    placeholder="Information optional"
                    InputLabelProps={{
                      shrink: !!state.form.existing_medication,
                    }}
                    value={state.form.existing_medication}
                    onChange={handleChange}
                    errors={state.errors.existing_medication}
                  />
                </div>

                <div>
                  <InputLabel id="exam-details-label">
                    Examination details and Clinical conditions
                  </InputLabel>
                  <MultilineInputField
                    rows={5}
                    name="examination_details"
                    variant="outlined"
                    margin="dense"
                    type="text"
                    placeholder="Information optional"
                    InputLabelProps={{
                      shrink: !!state.form.examination_details,
                    }}
                    value={state.form.examination_details}
                    onChange={handleChange}
                    errors={state.errors.examination_details}
                  />
                </div>

                <div>
                  <InputLabel id="prescribed-medication-label">
                    Treatment Summary
                  </InputLabel>
                  <MultilineInputField
                    rows={5}
                    name="prescribed_medication"
                    variant="outlined"
                    margin="dense"
                    type="text"
                    placeholder="Information optional"
                    InputLabelProps={{
                      shrink: !!state.form.prescribed_medication,
                    }}
                    value={state.form.prescribed_medication}
                    onChange={handleChange}
                    errors={state.errors.prescribed_medication}
                  />
                </div>
                <div className="flex-1">
                  <InputLabel id="category-label">Category *</InputLabel>
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
                  <InputLabel
                    id="suggestion-label"
                    style={{ fontWeight: "bold", fontSize: "18px" }}
                  >
                    Decision after Consultation
                  </InputLabel>
                  <NativeSelectField
                    name="suggestion"
                    variant="outlined"
                    value={state.form.suggestion}
                    options={suggestionTypes}
                    onChange={handleDecisionChange}
                  />
                  <ErrorHelperText error={state.errors.suggestion} />
                </div>

                {state.form.suggestion === "R" && (
                  <div>
                    <InputLabel>Referred To Facility</InputLabel>
                    <FacilitySelect
                      name="referred_to"
                      searchAll={true}
                      selected={selectedFacility}
                      setSelected={setFacility}
                      errors={state.errors.referred_to}
                    />
                  </div>
                )}
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

                  {JSON.parse(state.form.admitted) && (
                    <div className="flex-1">
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
                    </div>
                  )}
                </div>

                {JSON.parse(state.form.admitted) && (
                  <div className="flex">
                    <div className="flex-1">
                      <DateInputField
                        id="admission_date"
                        label="Admission Date"
                        margin="dense"
                        value={state.form.admission_date}
                        disableFuture={true}
                        onChange={(date) =>
                          handleDateChange(date, "admission_date")
                        }
                        errors={state.errors.admission_date}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <InputLabel>Advice</InputLabel>
                <MultilineInputField
                  rows={5}
                  className="mt-2"
                  name="OPconsultation"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  placeholder="Information optional"
                  InputLabelProps={{
                    shrink: !!state.form.OPconsultation,
                  }}
                  value={state.form.OPconsultation}
                  onChange={handleChange}
                  errors={state.errors.OPconsultation}
                />
              </div>
              <div className="mt-4">
                <InputLabel>Medication</InputLabel>
                <PrescriptionBuilder
                  prescriptions={dischargeAdvice}
                  setPrescriptions={setDischargeAdvice}
                />
              </div>

              <div>
                <InputLabel id="refered-label">IP number</InputLabel>
                <TextInputField
                  name="ip_no"
                  variant="outlined"
                  margin="dense"
                  type="string"
                  InputLabelProps={{ shrink: !!state.form.ip_no }}
                  value={state.form.ip_no}
                  onChange={handleChange}
                  errors={state.errors.ip_no}
                />
              </div>
              <div>
                <InputLabel id="refered-label">State Test ID</InputLabel>
                <TextInputField
                  name="test_id"
                  variant="outlined"
                  margin="dense"
                  type="string"
                  InputLabelProps={{ shrink: !!state.form.test_id }}
                  value={state.form.test_id}
                  onChange={handleChange}
                  errors={state.errors.test_id}
                />
              </div>
              <div>
                <InputLabel id="exam-details-label">Verified By</InputLabel>
                <MultilineInputField
                  rows={3}
                  name="verified_by"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  placeholder="Attending Doctors Name and Designation"
                  InputLabelProps={{
                    shrink: !!state.form.verified_by,
                  }}
                  value={state.form.verified_by}
                  onChange={handleChange}
                  errors={state.errors.verified_by}
                />
              </div>
              <div>
                <InputLabel id="exam-details-label">Diagnosis</InputLabel>
                <MultilineInputField
                  rows={5}
                  name="diagnosis"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  placeholder="Information optional"
                  InputLabelProps={{
                    shrink: !!state.form.diagnosis,
                  }}
                  value={state.form.diagnosis}
                  onChange={handleChange}
                  errors={state.errors.diagnosis}
                />
              </div>

              <div className="flex-1">
                <InputLabel id="admitted-label">Kasp</InputLabel>
                <RadioGroup
                  aria-label="covid"
                  name="is_kasp"
                  value={state.form.is_kasp}
                  onChange={handleTelemedicineChange}
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
                <ErrorHelperText error={state.errors.is_kasp} />
              </div>
              {/* Telemedicine Fields */}
              <div className="flex">
                <div className="flex-1">
                  <InputLabel id="admitted-label">Telemedicine</InputLabel>
                  <RadioGroup
                    aria-label="covid"
                    name="is_telemedicine"
                    value={state.form.is_telemedicine}
                    onChange={handleTelemedicineChange}
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
                  <ErrorHelperText error={state.errors.is_telemedicine} />
                </div>

                {JSON.parse(state.form.is_telemedicine) && (
                  <div className="flex-1">
                    <InputLabel id="review_time-label">
                      Review After{" "}
                    </InputLabel>
                    <SelectField
                      name="review_time"
                      variant="standard"
                      value={state.form.review_time}
                      options={[
                        { id: "", text: "select" },
                        ...REVIEW_AT_CHOICES,
                      ]}
                      onChange={handleChange}
                      errors={state.errors.review_time}
                    />
                  </div>
                )}
              </div>
              {JSON.parse(state.form.is_telemedicine) && (
                <div className="md:col-span-1">
                  <OnlineDoctorsSelect
                    userId={state.form.assigned_to}
                    onSelect={handleOnSelect}
                  />
                </div>
              )}
              {JSON.parse(state.form.is_telemedicine) && (
                <div>
                  <InputLabel
                    id="action-label"
                    style={{ fontWeight: "bold", fontSize: "18px" }}
                  >
                    Action
                  </InputLabel>
                  <NativeSelectField
                    name="action"
                    variant="outlined"
                    value={state.form.action}
                    optionKey="text"
                    optionValue="desc"
                    options={TELEMEDICINE_ACTIONS}
                    onChange={handleChange}
                  />
                  <ErrorHelperText error={state.errors.action} />
                </div>
              )}
              {/* End of Telemedicine fields */}
              <div className="mt-4 flex justify-between">
                <Button
                  color="default"
                  variant="contained"
                  type="button"
                  onClick={(_) =>
                    navigate(`/facility/${facilityId}/patient/${patientId}`)
                  }
                >
                  Cancel{" "}
                </Button>
                <Button
                  color="primary"
                  variant="contained"
                  type="submit"
                  style={{ marginLeft: "auto" }}
                  startIcon={
                    <CheckCircleOutlineIcon>save</CheckCircleOutlineIcon>
                  }
                  onClick={(e) => handleSubmit(e)}
                >
                  {buttonText}
                </Button>
              </div>
            </CardContent>
          </form>
        </div>
      </div>
    </div>
  );
};
