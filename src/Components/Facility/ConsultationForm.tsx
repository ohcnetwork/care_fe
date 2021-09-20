import { t as Prescription_t } from "../Common/prescription-builder/types/Prescription__Prescription.gen";
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
  LINES_CATHETER_CHOICES,
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
import { make as Slider } from "../CriticalCareRecording/components/Slider.gen";
import { FacilityModel } from "./models";
import { OnlineUsersSelect } from "../Common/OnlineUsersSelect";

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
  is_kasp: "",
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
  assigned_to_object: null,
  cpk_mb: 0,
  operation: "",
  intubation_start_date: null,
  intubation_end_date: null,
  ett_tt: 3,
  cuff_pressure: 0,
  special_instruction: "",
  lines: [],
  otherLines: false,
  other_lines: "",
  hasLines: false,
  lines_insertion_date: {},
  lines_site_level_fixation: {},
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

const linesCatheterChoices = [...LINES_CATHETER_CHOICES];

const lineIdToString = (id: any) => {
  const selectedChoice = linesCatheterChoices.find((obj) => obj.id === id);
  return selectedChoice ? selectedChoice?.text : "";
};

const lineStringToId = (line: any) => {
  const selectedChoice = linesCatheterChoices.find((obj) => obj.text === line);
  return selectedChoice ? selectedChoice?.id : -1;
};

const parseLinesData = (linesData: any) => {
  const lines: any = [];
  const lines_insertion_date: any = {};
  const lines_site_level_fixation: any = {};

  linesData.forEach((line: any) => {
    const lineId = lineStringToId(line.type);
    if (lineId) {
      lines.push(lineId);
      lines_insertion_date[lineId] = line.start_date;
      lines_site_level_fixation[lineId] = line.site;
    }
  });

  console.log(
    "Parsed Date",
    lines,
    lines_insertion_date,
    lines_site_level_fixation
  );
  return [lines, lines_insertion_date, lines_site_level_fixation];
};

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

const scrollTo = (id: any) => {
  const element = document.querySelector(`#${id}-div`);
  element?.scrollIntoView({ behavior: "smooth", block: "center" });
};

export const ConsultationForm = (props: any) => {
  const dispatchAction: any = useDispatch();
  const { facilityId, patientId, id } = props;
  const [state, dispatch] = useReducer(consultationFormReducer, initialState);
  const [dischargeAdvice, setDischargeAdvice] = useState<Prescription_t[]>([]);
  const [selectedFacility, setSelectedFacility] =
    useState<FacilityModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMmhgUnit, setIsMmhgUnit] = useState(true);

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
          const [lines, lines_insertion_date, lines_site_level_fixation] =
            parseLinesData(res.data.lines);

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
            cpk_mb: res.data.cpk_mb || "",
            operation: res.data.operation || "",
            ett_tt: res.data.ett_tt ? Number(res.data.ett_tt) : 3,
            cuff_pressure: res.data.cuff_pressure
              ? Number(res.data.cuff_pressure)
              : 0,
            special_instruction: res.data.special_instruction || "",
            otherLines:
              !!res.data.lines &&
              !!res.data.lines.length &&
              res.data.lines.some((obj: any) => obj.other_type !== ""),
            hasLines: !!res.data.lines && !!res.data.lines.length,
            other_lines:
              res.data.lines.filter((obj: any) => obj.other_type !== "")?.[0]
                ?.other_type || "",
            lines: lines,
            lines_insertion_date: lines_insertion_date,
            lines_site_level_fixation: lines_site_level_fixation,
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
    let error_div = "";

    Object.keys(state.form).forEach((field, i) => {
      switch (field) {
        case "symptoms":
          if (!state.form[field] || !state.form[field].length) {
            errors[field] = "Please select the symptoms";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "category":
          if (!state.form[field] || !state.form[field].length) {
            errors[field] = "Please select the category";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "suggestion":
          if (!state.form[field]) {
            errors[field] = "Please enter the decision";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "other_symptoms":
          if (state.form.otherSymptom && !state.form[field]) {
            errors[field] = "Please enter the other symptom details";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "symptoms_onset_date":
          if (state.form.hasSymptom && !state.form[field]) {
            errors[field] = "Please enter date of onset of the above symptoms";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "admitted_to":
        case "admission_date":
          if (JSON.parse(state.form.admitted) && !state.form[field]) {
            errors[field] = "Field is required as person is admitted";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "referred_to":
          if (state.form.suggestion === "R" && !state.form[field]) {
            errors[field] = "Please select the referred to facility";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "OPconsultation":
          if (state.form.suggestion === "OP" && !state.form[field]) {
            errors[field] = "Please enter OP consultation Details";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "is_telemedicine":
          if (
            state.form.admitted_to === "Home Isolation" &&
            state.form[field] === "false"
          ) {
            errors[field] =
              "Telemedicine should be `Yes` when Admitted To is Home Isolation";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "is_kasp":
          if (!state.form[field]) {
            errors[field] = "Please select an option, Kasp is mandatory";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "cpk_mb":
          if (
            state.form[field] &&
            (state.form[field] < 0 || state.form[field] > 100)
          ) {
            errors[field] = "Value should be between 0 and 100.";
            invalidForm = true;
          }
          return;
        default:
          return;
      }
    });
    dispatch({ type: "set_error", errors });
    return [!invalidForm, error_div];
  };

  const mmHgTocmH2o = (val: any) => {
    return (val * 1.35951).toFixed();
  };

  const cmH2oTommHg = (val: any) => {
    return (val * 0.73556).toFixed();
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const [validForm, error_div] = validateForm();
    console.log(error_div);
    if (!validForm) {
      scrollTo(error_div);
    } else {
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
        assigned_to:
          state.form.is_telemedicine === "true" ? state.form.assigned_to : "",
        cpk_mb: state.form.cpk_mb ? Number(state.form.cpk_mb) : 0,
        operation: state.form.operation,
        intubation_start_date: state.form.intubation_start_date,
        intubation_end_date: state.form.intubation_end_date,
        ett_tt: state.form.ett_tt,
        cuff_pressure: isMmhgUnit
          ? state.form.cuff_pressure
          : cmH2oTommHg(state.form.cuff_pressure),
        special_instruction: state.form.special_instruction,
        lines: createLinesPayload(),
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
          navigate(
            `/facility/${facilityId}/patient/${patientId}/consultation/${id}`
          );
        } else {
          Notification.Success({
            msg: "Consultation created successfully",
          });
          navigate(
            `/facility/${facilityId}/patient/${patientId}/consultation/${res.data.id}`
          );
        }
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
    } else {
      form.admitted = "false";
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

  const handleLinesChange = (e: any) => {
    const form = { ...state.form };
    const { value } = e?.target;
    form.lines = value;
    form.hasLines = form.lines.length > 0;
    form.otherLines = !!form.lines.filter((i: number) => i === 7).length;
    dispatch({ type: "set_form", form });
  };

  const handleLinesDateChange = (id: any, date: any) => {
    const form = { ...state.form };
    if (moment(date).isValid()) {
      form.lines_insertion_date[id] = date;
    }
    dispatch({ type: "set_form", form });
  };

  const handleLinesSiteChange = (e: any, id: any) => {
    const form = { ...state.form };
    form.lines_site_level_fixation[id] = e.target.value;
    dispatch({ type: "set_form", form });
  };

  const createLinesPayload = () => {
    const payload = state.form.lines.map((id: any) => {
      const type = lineIdToString(id);
      const other_type = id === 7 ? state.form.other_lines : "";
      const start_date = state.form.lines_insertion_date[id];
      const site = state.form.lines_site_level_fixation[id];
      return {
        start_date: start_date,
        type: type,
        site: site,
        other_type: other_type,
      };
    });
    return payload;
  };

  const handleDateChange = (date: any, key: string) => {
    if (moment(date).isValid()) {
      const form = { ...state.form };
      form[key] = date;
      dispatch({ type: "set_form", form });
    }
  };

  const handleDoctorSelect = (doctor: any) => {
    const form = { ...state.form };
    form["assigned_to"] = doctor.id;
    form["assigned_to_object"] = doctor;
    dispatch({ type: "set_form", form });
  };

  const setFacility = (selected: FacilityModel | FacilityModel[] | null) => {
    setSelectedFacility(selected as FacilityModel);
    const form = { ...state.form };
    form.referred_to = selected ? (selected as FacilityModel).id : "";
    dispatch({ type: "set_form", form });
  };

  const handleSliderChange = (value: any, key: string) => {
    const form = { ...state.form };
    form[key] = value;
    dispatch({ type: "set_form", form });
  };

  const toggleCuffUnit = () => {
    const form = { ...state.form };
    form.cuff_pressure = isMmhgUnit
      ? mmHgTocmH2o(form.cuff_pressure)
      : cmH2oTommHg(form.cuff_pressure);
    dispatch({ type: "set_form", form });
    setIsMmhgUnit(!isMmhgUnit);
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
                <div id="symptoms-div">
                  <InputLabel id="symptoms-label">Symptoms*</InputLabel>
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
                  <div id="other_symptoms-div">
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
                  <div id="symptoms_onset_date-div">
                    <DateInputField
                      label="Date of onset of the symptoms*"
                      value={state.form.symptoms_onset_date}
                      onChange={(date) =>
                        handleDateChange(date, "symptoms_onset_date")
                      }
                      disableFuture={true}
                      errors={state.errors.symptoms_onset_date}
                      InputLabelProps={{ shrink: true }}
                    />
                  </div>
                )}
                <div id="existing-medication-div">
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

                <div id="examination_details-div">
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

                <div id="prescribed_medication-div">
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
                <div className="flex-1" id="category-div">
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

                <div id="suggestion-div">
                  <InputLabel
                    id="suggestion-label"
                    style={{ fontWeight: "bold", fontSize: "18px" }}
                  >
                    Decision after Consultation*
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
                  <div id="referred_to-div">
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
                  <div className="flex-1" id="admitted-div">
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
                    <div className="flex-1" id="admitted_to-div">
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
                    <div className="flex-1" id="admission_date-div">
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

              <div className="mt-4" id="OPconsultation-div">
                <InputLabel>Advice*</InputLabel>
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

              <div id="ip_no-div">
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
              <div id="test_id-div">
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
              <div id="verified_by-div">
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
              <div id="diagnosis-div">
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

              <div className="flex-1" id="is_kasp-div">
                <InputLabel id="admitted-label">Kasp*</InputLabel>
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
                <div className="flex-1" id="is_telemedicine-div">
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
                  <div className="flex-1" id="review_time">
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
                <div className="md:col-span-1" id="assigned_to-div">
                  <OnlineUsersSelect
                    userId={state.form.assigned_to}
                    selectedUser={state.form.assigned_to_object}
                    onSelect={handleDoctorSelect}
                    user_type={"Doctor"}
                  />
                </div>
              )}
              {JSON.parse(state.form.is_telemedicine) && (
                <div id="action-div">
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
              <div id="cpk_mb-div">
                <InputLabel id="cpk_mb-label">CPK/MB</InputLabel>
                <TextInputField
                  id="cpk_mb"
                  name="cpk_mb"
                  type="number"
                  variant="outlined"
                  margin="dense"
                  onChange={handleChange}
                  value={state.form.cpk_mb}
                  errors={state.errors.cpk_mb}
                />
              </div>
              <div id="operation-div" className="mt-2">
                <InputLabel id="exam-details-label">Operation</InputLabel>
                <MultilineInputField
                  rows={5}
                  name="operation"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  placeholder="Information optional"
                  InputLabelProps={{
                    shrink: !!state.form.operation,
                  }}
                  value={state.form.operation}
                  onChange={handleChange}
                  errors={state.errors.operation}
                />
              </div>
              <div id="special-instruction-div" className="mt-2">
                <InputLabel id="special-instruction-label">
                  Special Instructions
                </InputLabel>
                <MultilineInputField
                  rows={5}
                  name="special_instruction"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  placeholder="Information optional"
                  InputLabelProps={{
                    shrink: !!state.form.special_instruction,
                  }}
                  value={state.form.special_instruction}
                  onChange={handleChange}
                  errors={state.errors.special_instruction}
                />
              </div>
              <div className="mt-4">
                <h3 className="text-lg leading-relaxed font-semibold text-gray-900">
                  Date/Size/LL
                </h3>
                <div className="flex flex-row justify-between px-4">
                  <div id="intubation_start_date-div">
                    <DateInputField
                      id="intubation_start_date"
                      label="Intubated On"
                      margin="dense"
                      value={state.form.intubation_start_date}
                      disableFuture={true}
                      onChange={(date) =>
                        handleDateChange(date, "intubation_start_date")
                      }
                      errors={state.errors.intubation_start_date}
                    />
                  </div>
                  <div id="intubation_end_date-div">
                    <DateInputField
                      id="intubation_end_date"
                      label="Exhubated On"
                      margin="dense"
                      value={state.form.intubation_end_date}
                      disableFuture={true}
                      onChange={(date) =>
                        handleDateChange(date, "intubation_end_date")
                      }
                      errors={state.errors.intubation_start_date}
                    />
                  </div>
                </div>
                <Slider
                  title={"ETT/TT (mmid)"}
                  start={"3"}
                  end={"10"}
                  interval={"1"}
                  step={0.1}
                  value={state.form.ett_tt}
                  setValue={(val) => handleSliderChange(val, "ett_tt")}
                  getLabel={(s) => ["", "#059669"]}
                />
                <Slider
                  title={"Cuff Pressure"}
                  titleNeighbour={
                    <div
                      className="flex items-center ml-1 border border-gray-400 rounded px-4 h-10 cursor-pointer hover:bg-gray-200"
                      onClick={(_) => toggleCuffUnit()}
                    >
                      <span className="text-primary-600">
                        {isMmhgUnit ? "mmHg" : "cmH2O"}
                      </span>
                    </div>
                  }
                  start={"0"}
                  end={"60"}
                  interval={"1"}
                  step={1.0}
                  value={state.form.cuff_pressure}
                  setValue={(val) => handleSliderChange(val, "cuff_pressure")}
                  getLabel={(s) => ["", "#059669"]}
                />
              </div>

              <div className="mt-4">
                <InputLabel
                  id="action-label"
                  style={{ fontWeight: "bold", fontSize: "18px" }}
                  className="mb-2 text-gray-900"
                >
                  Lines and Catheters
                </InputLabel>
                <InputLabel
                  id="lines-catheters-label"
                  style={{ fontWeight: "bold", fontSize: "16px" }}
                >
                  Types
                </InputLabel>
                <MultiSelectField
                  name="lines"
                  variant="outlined"
                  value={state.form.lines}
                  options={linesCatheterChoices}
                  onChange={handleLinesChange}
                />
                {/* <ErrorHelperText error={state.errors.symptoms} /> */}
              </div>

              {state.form.otherLines && (
                <div id="other_lines-div" className="mt-4">
                  <InputLabel id="other-symptoms-label">
                    Other Lines and Catheter Details
                  </InputLabel>
                  <MultilineInputField
                    rows={5}
                    name="other_lines"
                    variant="outlined"
                    margin="dense"
                    type="text"
                    placeholder="Enter the information here"
                    InputLabelProps={{ shrink: !!state.form.other_lines }}
                    value={state.form.other_lines}
                    onChange={(e) => handleChange(e)}
                    errors={state.errors.other_lines}
                  />
                </div>
              )}

              {state.form.hasLines &&
                state.form.lines.map((id: any) => (
                  <div className="my-5" key={`lines_${id}`}>
                    <InputLabel
                      style={{ fontWeight: "bold", fontSize: "16px" }}
                    >
                      {lineIdToString(id)}
                    </InputLabel>
                    <div className="grid grid-cols-4 mt-1 gap-x-10">
                      <div id="lines_insertion_date-div" className="col-span-1">
                        <DateInputField
                          label="Date of insertion"
                          value={state.form.lines_insertion_date?.[id]}
                          onChange={(date) => handleLinesDateChange(id, date)}
                          disableFuture={true}
                          errors={state.errors.lines_insertion_date}
                          InputLabelProps={{ shrink: true }}
                        />
                      </div>
                      <div id="site-level-fixation-div" className="col-span-3">
                        <InputLabel id="refered-label">
                          Site or level of fixation
                        </InputLabel>
                        <TextInputField
                          name="lines_site_level_fixation"
                          variant="outlined"
                          margin="dense"
                          type="string"
                          value={state.form.lines_site_level_fixation?.[id]}
                          onChange={(e) => handleLinesSiteChange(e, id)}
                          errors={state.errors.lines_site_level_fixation}
                        />
                      </div>
                    </div>
                  </div>
                ))}

              <div className="mt-4 flex justify-between">
                <Button
                  color="default"
                  variant="contained"
                  type="button"
                  onClick={(_) =>
                    navigate(
                      `/facility/${facilityId}/patient/${patientId}/consultation/${id}`
                    )
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
