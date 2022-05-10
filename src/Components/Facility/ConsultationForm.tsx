import { t as Prescription_t } from "../Common/prescription-builder/types/Prescription__Prescription.gen";
import loadable from "@loadable/component";
import {
  Box,
  Button,
  CardContent,
  FormControlLabel,
  InputLabel,
  Radio,
  RadioGroup,
} from "@material-ui/core";

import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import { navigate } from "raviger";
import moment from "moment";
import React, {
  ChangeEventHandler,
  useCallback,
  useEffect,
  useReducer,
  useState,
} from "react";
import { useDispatch } from "react-redux";
import {
  CONSULTATION_SUGGESTION,
  PATIENT_CATEGORY,
  SYMPTOM_CHOICES,
  TELEMEDICINE_ACTIONS,
  REVIEW_AT_CHOICES,
  KASP_STRING,
  KASP_ENABLED,
} from "../../Common/constants";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  createConsultation,
  getConsultation,
  updateConsultation,
  getPatient,
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
import { BedModel, FacilityModel } from "./models";
import { OnlineUsersSelect } from "../Common/OnlineUsersSelect";
import { UserModel } from "../Users/models";
import { MaterialUiPickersDate } from "@material-ui/pickers/typings/date";
import { BedSelect } from "../Common/BedSelect";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

type BooleanStrings = "true" | "false";

type FormDetails = {
  hasSymptom: boolean;
  otherSymptom: boolean;
  symptoms: number[];
  other_symptoms: string;
  symptoms_onset_date: any;
  suggestion: string;
  patient: string;
  facility: string;
  admitted: BooleanStrings;
  admitted_to: string;
  category: string;
  admission_date: string;
  discharge_date: null;
  referred_to: string;
  diagnosis: string;
  verified_by: string;
  test_id: string;
  is_kasp: BooleanStrings;
  kasp_enabled_date: null;
  examination_details: string;
  existing_medication: string;
  prescribed_medication: string;
  consultation_notes: string;
  ip_no: string;
  discharge_advice: Prescription_t[];
  is_telemedicine: BooleanStrings;
  action: string;
  assigned_to: string;
  assigned_to_object: UserModel | null;
  operation: string;
  special_instruction: string;
  review_time: number;
  weight: string;
  height: string;
  bed: string | null;
};

type Action =
  | { type: "set_form"; form: FormDetails }
  | { type: "set_error"; errors: FormDetails };

const initForm: FormDetails = {
  hasSymptom: false,
  otherSymptom: false,
  symptoms: [],
  other_symptoms: "",
  symptoms_onset_date: null,
  suggestion: "A",
  patient: "",
  facility: "",
  admitted: "false",
  admitted_to: "",
  category: "",
  admission_date: new Date().toISOString(),
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
  assigned_to_object: null,
  operation: "",
  special_instruction: "",
  review_time: 0,
  weight: "",
  height: "",
  bed: null,
};

const initError = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" }))
);

const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};

const consultationFormReducer = (state = initialState, action: Action) => {
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  const [bed, setBed] = useState<BedModel | BedModel[] | null>(null);
  const [dischargeAdvice, setDischargeAdvice] = useState<Prescription_t[]>([]);
  const [selectedFacility, setSelectedFacility] =
    useState<FacilityModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [facilityName, setFacilityName] = useState("");

  const headerText = !id ? "Consultation" : "Edit Consultation";
  const buttonText = !id ? "Add Consultation" : "Update Consultation";

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
            operation: res.data.operation || "",
            ett_tt: res.data.ett_tt ? Number(res.data.ett_tt) : 3,
            special_instruction: res.data.special_instruction || "",
            weight: res.data.weight ? res.data.weight : "",
            height: res.data.height ? res.data.height : "",
            bed: res.data?.current_bed?.bed_object?.id || null,
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
    const errors = { ...initError };
    let invalidForm = false;
    let error_div = "";

    Object.keys(state.form).forEach((field) => {
      switch (field) {
        case "symptoms":
          if (!state.form[field] || !state.form[field].length) {
            errors[field] = "Please select the symptoms";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        // case "category":
        //   if (!state.form[field] || !state.form[field].length) {
        //     errors[field] = "Please select the category";
        //     if (!error_div) error_div = field;
        //     invalidForm = true;
        //   }
        //   return;
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
        // case "admitted_to":
        case "admission_date":
          if (state.form.suggestion === "A" && !state.form[field]) {
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
        case "consultation_notes":
          if (!state.form[field]) {
            errors[field] = "Required *";
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
            errors[
              field
            ] = `Please select an option, ${KASP_STRING} is mandatory`;
            if (!error_div) error_div = field;
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

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const [validForm, error_div] = validateForm();

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
        admitted: state.form.suggestion === "A",
        // admitted_to: JSON.parse(state.form.admitted)
        //   ? state.form.admitted_to
        //   : undefined,
        admission_date:
          state.form.suggestion === "A" ? state.form.admission_date : undefined,
        category: state.form.category,
        is_kasp: state.form.is_kasp,
        kasp_enabled_date: JSON.parse(state.form.is_kasp) ? new Date() : null,
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
        consultation_notes: state.form.consultation_notes,
        is_telemedicine: state.form.is_telemedicine,
        action: state.form.action,
        review_time: state.form.review_time,
        assigned_to:
          state.form.is_telemedicine === "true" ? state.form.assigned_to : "",
        operation: state.form.operation,
        special_instruction: state.form.special_instruction,
        weight: Number(state.form.weight),
        height: Number(state.form.height),
        bed: bed && bed instanceof Array ? bed[0]?.id : bed?.id,
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

  const handleChange:
    | ChangeEventHandler<HTMLInputElement>
    | ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = (e: any) => {
    e &&
      e.target &&
      dispatch({
        type: "set_form",
        form: { ...state.form, [e.target.name]: e.target.value },
      });
  };

  const handleTelemedicineChange: ChangeEventHandler<HTMLInputElement> = (
    e
  ) => {
    e &&
      e.target &&
      dispatch({
        type: "set_form",
        form: {
          ...state.form,
          [e.target.name]: e.target.value,
          action: e.target.value === "false" ? "PENDING" : state.form.action,
        },
      });
  };

  const handleDecisionChange = (e: any) => {
    e &&
      e.target &&
      dispatch({
        type: "set_form",
        form: {
          ...state.form,
          [e.target.name]: e.target.value,
          // admitted: e.target.value === "A" ? "true" : "false",
        },
      });
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

  // ------------- DEPRECATED -------------
  // const handleDateChange = (date: any, key: string) => {
  //   if (moment(date).isValid()) {
  //     const form = { ...state.form };
  //     form[key] = date;
  //     dispatch({ type: "set_form", form });
  //   }

  const handleDateChange = (date: MaterialUiPickersDate, key: string) => {
    moment(date).isValid() &&
      dispatch({ type: "set_form", form: { ...state.form, [key]: date } });
  };

  const handleDoctorSelect = (doctor: UserModel | null) => {
    doctor &&
      doctor.id &&
      dispatch({
        type: "set_form",
        form: {
          ...state.form,
          assigned_to: doctor.id.toString(),
          assigned_to_object: doctor,
        },
      });
  };

  const setFacility = (selected: FacilityModel | FacilityModel[] | null) => {
    const selectedFacility = selected as FacilityModel;
    setSelectedFacility(selectedFacility);
    const form: FormDetails = { ...state.form };
    if (selectedFacility && selectedFacility.id) {
      form.referred_to = selectedFacility.id.toString() || "";
    }
    dispatch({ type: "set_form", form });
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="px-2 pb-2 max-w-3xl mx-auto">
      <PageTitle
        title={headerText}
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          [patientId]: { name: patientName },
        }}
      />
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
                      value={state.form?.symptoms_onset_date}
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
                {/* <div className="flex-1" id="category-div">
                  <InputLabel id="category-label">Category*</InputLabel>
                  <SelectField
                    name="category"
                    variant="standard"
                    value={state.form.category}
                    options={categoryChoices}
                    onChange={handleChange}
                    errors={state.errors.category}
                  />
                </div> */}

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

                {/* {JSON.parse(state.form.admitted) && (
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
                */}
                {!id && state.form.suggestion === "A" && (
                  <>
                    <div className="flex">
                      <div className="flex-1" id="admission_date-div">
                        <DateInputField
                          id="admission_date"
                          label="Admission Date*"
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
                    <div>
                      <InputLabel id="asset-type">Bed</InputLabel>
                      <BedSelect
                        name="bed"
                        setSelected={setBed}
                        selected={bed}
                        errors=""
                        multiple={false}
                        margin="dense"
                        // location={state.form.}
                        facility={facilityId}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="mt-4" id="consultation_notes-div">
                <InputLabel>Advice*</InputLabel>
                <MultilineInputField
                  rows={5}
                  className="mt-2"
                  name="consultation_notes"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  placeholder="Consultation Notes..."
                  InputLabelProps={{
                    shrink: !!state.form.consultation_notes,
                  }}
                  value={state.form.consultation_notes}
                  onChange={handleChange}
                  errors={state.errors.consultation_notes}
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

              {KASP_ENABLED && (
                <div className="flex-1" id="is_kasp-div">
                  <InputLabel id="admitted-label">{KASP_STRING}*</InputLabel>
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
              )}
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
              <div id="special_instruction-div" className="mt-2">
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

              <div className="flex flex-col md:flex-row justify-between md:gap-5">
                <div id="weight-div" className="flex-1">
                  <InputLabel id="refered-label">Weight (in Kg)</InputLabel>
                  <TextInputField
                    name="weight"
                    variant="outlined"
                    margin="dense"
                    type="string"
                    InputLabelProps={{ shrink: !!state.form.weight }}
                    value={state.form.weight}
                    onChange={handleChange}
                    errors={state.errors.weight}
                  />
                </div>
                <div id="height-div" className="flex-1">
                  <InputLabel id="refered-label">Height (in cm)</InputLabel>
                  <TextInputField
                    name="height"
                    variant="outlined"
                    margin="dense"
                    type="string"
                    InputLabelProps={{ shrink: !!state.form.height }}
                    value={state.form.height}
                    onChange={handleChange}
                    errors={state.errors.height}
                  />
                </div>
              </div>
              <div id="body_surface-div" className="flex-1">
                Body Surface area :{" "}
                {Math.sqrt(
                  (Number(state.form.weight) * Number(state.form.height)) / 3600
                ).toFixed(2)}{" "}
                m<sup>2</sup>
              </div>
              {/* End of Telemedicine fields */}
              <div className="mt-4 flex justify-between">
                <Button
                  color="default"
                  variant="contained"
                  type="button"
                  onClick={() =>
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
