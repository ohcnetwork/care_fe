import loadable from "@loadable/component";
import {
  Box,
  CardContent,
  FormControlLabel,
  InputLabel,
  Radio,
  RadioGroup,
} from "@material-ui/core";
import { navigate } from "raviger";
import moment from "moment";
import React, {
  ChangeEventHandler,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { useDispatch } from "react-redux";
import {
  CONSULTATION_SUGGESTION,
  PATIENT_CATEGORIES,
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
  NativeSelectField,
  SelectField,
  TextInputField,
} from "../Common/HelperInputFields";
import { BedModel, FacilityModel } from "./models";
import { OnlineUsersSelect } from "../Common/OnlineUsersSelect";
import { UserModel } from "../Users/models";
import { MaterialUiPickersDate } from "@material-ui/pickers/typings/date";
import { BedSelect } from "../Common/BedSelect";
import Beds from "./Consultations/Beds";
import PrescriptionBuilder, {
  PrescriptionType,
} from "../Common/prescription-builder/PrescriptionBuilder";
import PRNPrescriptionBuilder, {
  PRNPrescriptionType,
} from "../Common/prescription-builder/PRNPrescriptionBuilder";
import { DiagnosisSelect } from "../Common/DiagnosisSelect";
import { goBack } from "../../Utils/utils";
import InvestigationBuilder, {
  InvestigationType,
} from "../Common/prescription-builder/InvestigationBuilder";
import ProcedureBuilder, {
  ProcedureType,
} from "../Common/prescription-builder/ProcedureBuilder";
import { ICD11DiagnosisModel } from "./models";
import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import MultiSelectMenuV2 from "../Form/MultiSelectMenuV2";

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
  icd11_diagnoses: string[];
  icd11_diagnoses_object: ICD11DiagnosisModel[];
  icd11_provisional_diagnoses: string[];
  icd11_provisional_diagnoses_object: ICD11DiagnosisModel[];
  verified_by: string;
  is_kasp: BooleanStrings;
  kasp_enabled_date: null;
  examination_details: string;
  history_of_present_illness: string;
  prescribed_medication: string;
  consultation_notes: string;
  ip_no: string;
  discharge_advice: PrescriptionType[];
  prn_prescription: PRNPrescriptionType[];
  investigation: InvestigationType[];
  is_telemedicine: BooleanStrings;
  action: string;
  assigned_to: string;
  assigned_to_object: UserModel | null;
  special_instruction: string;
  review_interval: number;
  weight: string;
  height: string;
  bed: BedModel | null;
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
  category: "Comfort",
  admission_date: new Date().toISOString(),
  discharge_date: null,
  referred_to: "",
  icd11_diagnoses: [],
  icd11_diagnoses_object: [],
  icd11_provisional_diagnoses: [],
  icd11_provisional_diagnoses_object: [],
  verified_by: "",
  is_kasp: "false",
  kasp_enabled_date: null,
  examination_details: "",
  history_of_present_illness: "",
  prescribed_medication: "",
  consultation_notes: "",
  ip_no: "",
  discharge_advice: [],
  prn_prescription: [],
  investigation: [],
  is_telemedicine: "false",
  action: "PENDING",
  assigned_to: "",
  assigned_to_object: null,
  special_instruction: "",
  review_interval: -1,
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

const scrollTo = (id: any) => {
  const element = document.querySelector(`#${id}-div`);
  element?.scrollIntoView({ behavior: "smooth", block: "center" });
};

export const ConsultationForm = (props: any) => {
  const dispatchAction: any = useDispatch();
  const { facilityId, patientId, id } = props;
  const [state, dispatch] = useReducer(consultationFormReducer, initialState);
  const [bed, setBed] = useState<BedModel | BedModel[] | null>(null);
  const [dischargeAdvice, setDischargeAdvice] = useState<PrescriptionType[]>(
    []
  );
  const [PRNAdvice, setPRNAdvice] = useState<PRNPrescriptionType[]>([]);
  const [InvestigationAdvice, setInvestigationAdvice] = useState<
    InvestigationType[]
  >([]);
  const [procedures, setProcedures] = useState<ProcedureType[]>([]);

  const [selectedFacility, setSelectedFacility] =
    useState<FacilityModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [facilityName, setFacilityName] = useState("");

  const headerText = !id ? "Consultation" : "Edit Consultation";
  const buttonText = !id ? "Add Consultation" : "Update Consultation";

  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => {
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

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
      setDischargeAdvice(res && res.data && res.data.discharge_advice);
      setPRNAdvice(
        !Array.isArray(res.data.prn_prescription)
          ? []
          : res.data.prn_prescription
      );
      setInvestigationAdvice(
        !Array.isArray(res.data.investigation) ? [] : res.data.investigation
      );
      setProcedures(
        !Array.isArray(res.data.procedure) ? [] : res.data.procedure
      );

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
              !!res.data.symptoms.includes(9),
            admitted: res.data.admitted ? String(res.data.admitted) : "false",
            admitted_to: res.data.admitted_to ? res.data.admitted_to : "",
            category: res.data.category
              ? PATIENT_CATEGORIES.find((i) => i.text === res.data.category)
                  ?.id || "Comfort"
              : "Comfort",
            ip_no: res.data.ip_no ? res.data.ip_no : "",
            verified_by: res.data.verified_by ? res.data.verified_by : "",
            OPconsultation: res.data.consultation_notes,
            is_telemedicine: `${res.data.is_telemedicine}`,
            is_kasp: `${res.data.is_kasp}`,
            assigned_to: res.data.assigned_to || "",
            ett_tt: res.data.ett_tt ? Number(res.data.ett_tt) : 3,
            special_instruction: res.data.special_instruction || "",
            weight: res.data.weight ? res.data.weight : "",
            height: res.data.height ? res.data.height : "",
            bed: res.data?.current_bed?.bed_object || null,
          };
          dispatch({ type: "set_form", form: formData });
          setBed(formData.bed);
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
        case "category":
          if (
            !state.form[field] ||
            !PATIENT_CATEGORIES.map((category) => category.id).includes(
              state.form[field]
            )
          ) {
            errors[field] = "Please select a category";
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
        case "ip_no":
          if (!state.form[field]) {
            errors[field] = "Please enter IP Number";
            if (!error_div) error_div = field;
            invalidForm = true;
          } else if (!state.form[field].replace(/\s/g, "").length) {
            errors[field] = "IP can not be empty";
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
          } else if (!state.form[field].replace(/\s/g, "").length) {
            errors[field] = "Consultation notes can not be empty";
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
        case "discharge_advice": {
          let invalid = false;
          for (const f of dischargeAdvice) {
            if (
              !f.dosage?.replace(/\s/g, "").length ||
              !f.medicine?.replace(/\s/g, "").length
            ) {
              invalid = true;
              break;
            }
          }
          if (invalid) {
            errors[field] = "Prescription field can not be empty";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        }
        case "prn_prescription": {
          let invalid = false;
          for (const f of PRNAdvice) {
            if (
              !f.dosage?.replace(/\s/g, "").length ||
              !f.medicine?.replace(/\s/g, "").length ||
              f.indicator === "" ||
              f.indicator === " "
            ) {
              invalid = true;
              break;
            }
          }
          if (invalid) {
            errors[field] = "PRN Prescription field can not be empty";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        }

        case "investigation": {
          let invalid = false;
          for (const f of InvestigationAdvice) {
            if (
              f.type?.length === 0 ||
              (f.repetitive
                ? !f.frequency?.replace(/\s/g, "").length
                : !f.time?.replace(/\s/g, "").length)
            ) {
              invalid = true;
              break;
            }
          }
          if (invalid) {
            errors[field] = "Investigation Suggestion field can not be empty";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        }
        default:
          return;
      }
    });
    dispatch({ type: "set_error", errors });
    return [!invalidForm, error_div];
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    console.log("handling");
    const [validForm, error_div] = validateForm();
    console.log(validForm);

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
        history_of_present_illness: state.form.history_of_present_illness,
        prescribed_medication: state.form.prescribed_medication,
        discharge_date: state.form.discharge_date,
        ip_no: state.form.ip_no,
        icd11_diagnoses: state.form.icd11_diagnoses,
        icd11_provisional_diagnoses: state.form.icd11_provisional_diagnoses,
        verified_by: state.form.verified_by,
        discharge_advice: dischargeAdvice,
        prn_prescription: PRNAdvice,
        investigation: InvestigationAdvice,
        procedure: procedures,
        patient: patientId,
        facility: facilityId,
        referred_to:
          state.form.suggestion === "R" ? state.form.referred_to : undefined,
        consultation_notes: state.form.consultation_notes,
        is_telemedicine: state.form.is_telemedicine,
        action: state.form.action,
        review_interval: state.form.review_interval,
        assigned_to:
          state.form.is_telemedicine === "true" ? state.form.assigned_to : "",
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
        },
      });
  };

  const handleSymptomChange = (value: number[]) => {
    const form = { ...state.form };
    const otherSymptoms = value.filter((i) => i !== 1);
    // prevent user from selecting asymptomatic along with other options
    if (value.includes(1)) {
      form.symptoms = otherSymptoms.length ? [1] : value;
      form.hasSymptom = false;
      form.otherSymptom = false;
    } else {
      form.symptoms = otherSymptoms;
      form.hasSymptom = !!otherSymptoms.length;
      form.otherSymptom = otherSymptoms.includes(9);
    }
    dispatch({ type: "set_form", form });
  };

  const handleDateChange = (date: MaterialUiPickersDate, key: string) => {
    moment(date).isValid() &&
      dispatch({ type: "set_form", form: { ...state.form, [key]: date } });
  };

  const handleDoctorSelect = (doctor: UserModel | null) => {
    if (doctor?.id) {
      dispatch({
        type: "set_form",
        form: {
          ...state.form,
          assigned_to: doctor.id.toString(),
          assigned_to_object: doctor,
        },
      });
    } else {
      dispatch({
        type: "set_form",
        form: {
          ...state.form,
          assigned_to: "",
          assigned_to_object: null,
        },
      });
    }
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
    <div className="px-2 pb-2 max-w-3xl mx-auto" ref={topRef}>
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
                  <MultiSelectMenuV2
                    id="symptoms"
                    placeholder="Symptoms"
                    value={state.form.symptoms}
                    options={symptomChoices}
                    optionLabel={({ text }) => text}
                    optionValue={({ id }) => id}
                    onChange={(o) => handleSymptomChange(o)}
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
                    name="history_of_present_illness"
                    variant="outlined"
                    margin="dense"
                    type="text"
                    placeholder="Information optional"
                    InputLabelProps={{
                      shrink: !!state.form.history_of_present_illness,
                    }}
                    value={state.form.history_of_present_illness}
                    onChange={handleChange}
                    errors={state.errors.history_of_present_illness}
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
                    Treatment Plan / Treatment Summary
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
                  <InputLabel id="category-label" required>
                    Category
                  </InputLabel>
                  <SelectField
                    name="category"
                    variant="standard"
                    value={state.form.category}
                    options={PATIENT_CATEGORIES}
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
                {state.form.suggestion === "A" && (
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
                        unoccupiedOnly={true}
                        disabled={!!id} // disabled while editing
                        facility={facilityId}
                      />
                      {!!id && (
                        <p className="text-gray-500 text-sm -mt-5 mb-1">
                          Can't be edited while Consultation update. To change
                          bed use the form bellow
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="mt-4" id="consultation_notes-div">
                <InputLabel>General Instructions (Advice)*</InputLabel>
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
              <div id="investigation-div" className="mt-4">
                <InputLabel>Investigation Suggestions</InputLabel>
                <InvestigationBuilder
                  investigations={InvestigationAdvice}
                  setInvestigations={setInvestigationAdvice}
                />
                <br />
                <ErrorHelperText error={state.errors.investigation} />
              </div>
              <div id="procedures-div" className="mt-4">
                <InputLabel>Procedures</InputLabel>
                <ProcedureBuilder
                  procedures={procedures}
                  setProcedures={setProcedures}
                />
                <br />
                <ErrorHelperText error={state.errors.procedures} />
              </div>
              <div id="discharge_advice-div" className="mt-4">
                <InputLabel>Prescription Medication</InputLabel>
                {/*<PrescriptionBuilderOld
                  prescriptions={dischargeAdvice as Prescription__Prescription_t[]}
                  setPrescriptions={setDischargeAdvice}
                />*/}
                <PrescriptionBuilder
                  prescriptions={dischargeAdvice}
                  setPrescriptions={setDischargeAdvice}
                />
                <br />
                <ErrorHelperText error={state.errors.discharge_advice} />
              </div>
              <div id="discharge_advice-div" className="mt-4">
                <InputLabel>PRN Prescription</InputLabel>
                <PRNPrescriptionBuilder
                  prescriptions={PRNAdvice}
                  setPrescriptions={setPRNAdvice}
                />
                <br />
                <ErrorHelperText error={state.errors.prn_prescription} />
              </div>
              <div id="ip_no-div" className="mt-4">
                <InputLabel id="refered-label">IP number*</InputLabel>
                <TextInputField
                  name="ip_no"
                  variant="outlined"
                  margin="dense"
                  type="string"
                  InputLabelProps={{ shrink: !!state.form.ip_no }}
                  value={state.form.ip_no}
                  onChange={handleChange}
                  errors={state.errors.ip_no}
                  required
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
              <div id="provisional-diagnosis-div" className="mt-4">
                <InputLabel id="diagnosis-label">
                  Provisional Diagnosis
                </InputLabel>
                <DiagnosisSelect
                  name="icd11_provisional_diagnoses"
                  selected={state.form.icd11_provisional_diagnoses_object}
                  setSelected={(selected: ICD11DiagnosisModel[] | null) => {
                    dispatch({
                      type: "set_form",
                      form: {
                        ...state.form,
                        icd11_provisional_diagnoses:
                          selected?.map(
                            (diagnosis: ICD11DiagnosisModel) => diagnosis.id
                          ) || [],
                      },
                    });
                  }}
                />
              </div>

              <div id="diagnosis-div" className="mt-4">
                <InputLabel id="diagnosis-label">Diagnosis</InputLabel>
                <DiagnosisSelect
                  name="icd11_diagnoses"
                  selected={state.form.icd11_diagnoses_object}
                  setSelected={(selected: ICD11DiagnosisModel[] | null) => {
                    dispatch({
                      type: "set_form",
                      form: {
                        ...state.form,
                        icd11_diagnoses:
                          selected?.map(
                            (diagnosis: ICD11DiagnosisModel) => diagnosis.id
                          ) || [],
                      },
                    });
                  }}
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
              <div className="flex mt-4">
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
                  <div className="flex-1" id="review_interval">
                    <InputLabel id="review_interval-label">
                      Review After{" "}
                    </InputLabel>
                    <SelectField
                      name="review_interval"
                      variant="standard"
                      value={state.form.review_interval}
                      options={[
                        { id: -1, text: "select" },
                        ...REVIEW_AT_CHOICES,
                      ]}
                      onChange={handleChange}
                      errors={state.errors.review_interval}
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
                    outline={true}
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

              <div className="flex flex-col md:flex-row justify-between md:gap-5 mt-4">
                <div id="weight-div" className="flex-1">
                  <InputLabel id="refered-label">Weight (in Kg)</InputLabel>
                  <TextInputField
                    name="weight"
                    variant="outlined"
                    margin="dense"
                    type="number"
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
                    type="number"
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
              <div className="mt-4 sm:flex grid sm:justify-between">
                <ButtonV2
                  variant="secondary"
                  type="button"
                  className="mb-2 sm:mb-0"
                  onClick={() =>
                    navigate(`/facility/${facilityId}/patient/${patientId}`)
                  }
                >
                  Cancel
                </ButtonV2>
                <ButtonV2
                  variant="primary"
                  type="submit"
                  onClick={(e) => handleSubmit(e)}
                >
                  <CareIcon className="care-l-check-circle h-5" />
                  {buttonText}
                </ButtonV2>
              </div>
            </CardContent>
          </form>
        </div>
      </div>
      {!id ? null : (
        <div className="mt-4 bg-white rounded shadow p-4">
          <h3>Update Bed</h3>
          <CardContent>
            <Beds
              facilityId={facilityId}
              patientId={patientId}
              consultationId={id}
              fetchPatientData={fetchData}
            ></Beds>
          </CardContent>
        </div>
      )}
    </div>
  );
};
