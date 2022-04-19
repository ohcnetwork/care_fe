import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Collapse,
  FormControlLabel,
  InputLabel,
  Radio,
  RadioGroup,
} from "@material-ui/core";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import { navigate, useQueryParams } from "raviger";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import moment from "moment";
import loadable from "@loadable/component";
import { useCallback, useReducer, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  BLOOD_GROUPS,
  DISEASE_STATUS,
  GENDER_TYPES,
  MEDICAL_HISTORY_CHOICES,
  TEST_TYPE,
  FRONTLINE_WORKER,
  DESIGNATION_HEALTH_CARE_WORKER,
  VACCINES,
} from "../../Common/constants";

import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  createPatient,
  getDistrictByState,
  getLocalbodyByDistrict,
  getPatient,
  getStates,
  searchPatient,
  updatePatient,
  getWardByLocalBody,
  externalResult,
  getAnyFacility,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import AlertDialog from "../Common/AlertDialog";
import {
  AutoCompleteMultiField,
  CheckboxField,
  DateInputField,
  MultilineInputField,
  PhoneNumberField,
  SelectField,
  TextInputField,
} from "../Common/HelperInputFields";
import DuplicatePatientDialog from "./DuplicatePatientDialog";
import { DupPatientModel } from "./models";
import { PatientModel } from "../Patient/models";
import TransferPatientDialog from "./TransferPatientDialog";
import { InfoOutlined, ArrowDropUp, ArrowDropDown } from "@material-ui/icons";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));
const debounce = require("lodash.debounce");

const patientFormReducer = (state = initialState, action: any) => {
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

const testType = [...TEST_TYPE];
const diseaseStatus = [...DISEASE_STATUS];
const vaccines = ["Select", ...VACCINES];
const bloodGroups = [...BLOOD_GROUPS];
const medicalHistoryTypes = MEDICAL_HISTORY_CHOICES.filter((i) => i.id !== 1);
const medicalHistoryChoices = medicalHistoryTypes.reduce(
  (acc: Array<{ [x: string]: string }>, cur) => [
    ...acc,
    { [`medical_history_${cur.id}`]: "" },
  ],
  []
);

const initForm: any = {
  name: "",
  age: "",
  gender: "",
  phone_number: "",
  emergency_phone_number: "",
  blood_group: "",
  disease_status: diseaseStatus[0],
  is_declared_positive: "false",
  date_declared_positive: new Date(),
  date_of_birth: null,
  medical_history: [],
  nationality: "India",
  passport_no: "",
  state: "",
  district: "",
  local_body: "",
  ward: "",
  address: "",
  permanent_address: "",
  village: "",
  allergies: "",
  pincode: "",
  present_health: "",
  contact_with_confirmed_carrier: "false",
  contact_with_suspected_carrier: "false",
  is_migrant_worker: "false",
  estimated_contact_date: null,
  date_of_return: null,
  past_travel: false,
  transit_details: "",
  countries_travelled: [],
  number_of_primary_contacts: "",
  number_of_secondary_contacts: "",
  is_antenatal: "false",
  date_of_test: null,
  date_of_result: null,
  srf_id: "",
  test_type: testType[0],
  prescribed_medication: false,
  ongoing_medication: "",
  is_medical_worker: "false",
  designation_of_health_care_worker: "",
  instituion_of_health_care_worker: "",
  number_of_aged_dependents: "",
  number_of_chronic_diseased_dependents: "",
  cluster_name: "",
  covin_id: "",
  is_vaccinated: "false",
  number_of_doses: "1",
  vaccine_name: null,
  last_vaccinated_date: null,
  ...medicalHistoryChoices,
};

const initError = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" }))
);

const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};

const scrollTo = (id: any) => {
  const element = document.querySelector(`#${id}-div`);
  element?.scrollIntoView({ behavior: "smooth", block: "center" });
};

export const PatientHealth = (props: any) => {
  const dispatchAction: any = useDispatch();

  const [state, dispatch] = useReducer(patientFormReducer, initialState);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: any) => {
    const form = { ...state.form };
    form[e.target.name] = e.target.value;
    dispatch({ type: "set_form", form });
  };

  const handleDateChange = (date: any, field: string) => {
    if (moment(date).isValid()) {
      const form = { ...state.form };
      form[field] = date;
      dispatch({ type: "set_form", form });
    }
  };

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
        admitted: JSON.parse(state.form.admitted),
        admitted_to: JSON.parse(state.form.admitted)
          ? state.form.admitted_to
          : undefined,
        admission_date: JSON.parse(state.form.admitted)
          ? state.form.admission_date
          : undefined,
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
      };
    }
  };

  const [OpenDetails, setOpenDetails] = useState(false);

  return (
    <Card elevation={0} className=" rounded">
      <form onSubmit={(e) => handleSubmit(e)}>
        <CardContent>
          <div className="flex align-center gap-4">
            <h1 className="font-bold text-left text-gray-800 text-xl mb-4 ">
              Health Details
            </h1>
            {OpenDetails ? (
              <Button onClick={() => setOpenDetails(false)}>
                <ArrowDropUp className="text-gray-800 mb-4" />
              </Button>
            ) : (
              <Button onClick={() => setOpenDetails(true)}>
                <ArrowDropDown className="text-gray-800 mb-4" />
              </Button>
            )}
          </div>
          <Collapse
            in={OpenDetails}
            timeout="auto"
            unmountOnExit
            className="col-span-2"
          >
            <div className="grid gap-4 xl:gap-x-20 xl:gap-y-6 grid-cols-1 md:grid-cols-2">
              <div id="test_type-div">
                <InputLabel id="test_type-label" htmlFor="test_type" required>
                  COVID Test Type
                </InputLabel>
                <SelectField
                  labelId="test_type"
                  name="test_type"
                  variant="outlined"
                  margin="dense"
                  optionArray={true}
                  value={state.form.test_type}
                  options={testType}
                  onChange={handleChange}
                  errors={state.errors.test_type}
                />
              </div>
              <div id="srf_id-div">
                <InputLabel id="srf_id-label" htmlFor="srf_id">
                  SRF Id for COVID Test
                </InputLabel>
                <TextInputField
                  id="srf_id"
                  name="srf_id"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  value={state.form.srf_id}
                  onChange={handleChange}
                  errors={state.errors.name}
                />
              </div>
              <div id="is_declared_positive-div">
                <InputLabel
                  id="is_declared_positive"
                  htmlFor="is_declared_positive"
                >
                  Is patient declared covid postive by state?
                </InputLabel>
                <RadioGroup
                  aria-label="is_declared_positive"
                  id="is_declared_positive"
                  name="is_declared_positive"
                  value={state.form.is_declared_positive}
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
                <Collapse
                  in={String(state.form.is_declared_positive) === "true"}
                  timeout="auto"
                  unmountOnExit
                  className="mt-4"
                >
                  <div id="date_declared_positive-div">
                    <InputLabel id="date_declared_positive-label">
                      Date Patient is Declared Positive for COVID
                    </InputLabel>
                    <DateInputField
                      fullWidth={true}
                      value={state.form.date_declared_positive}
                      onChange={(date) =>
                        handleDateChange(date, "date_declared_positive")
                      }
                      errors={state.errors.date_declared_positive}
                      inputVariant="outlined"
                      margin="dense"
                      disableFuture={true}
                    />
                  </div>
                </Collapse>
              </div>

              <div id="is_vaccinated-div">
                <InputLabel id="is_vaccinated" htmlFor="is_vaccinated">
                  Is patient Vaccinated against COVID?
                </InputLabel>
                <RadioGroup
                  aria-label="is_vaccinated"
                  id="is_vaccinated"
                  name="is_vaccinated"
                  value={state.form.is_vaccinated}
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
              </div>
              <Collapse
                in={String(state.form.is_vaccinated) === "true"}
                timeout="auto"
                unmountOnExit
                className="col-span-2"
              >
                {
                  <div className="grid gap-4 xl:gap-x-20 xl:gap-y-6 grid-cols-1 md:grid-cols-2">
                    <div id="covin_id-div">
                      <InputLabel id="covin_id-label" htmlFor="covin_id">
                        COWIN ID
                      </InputLabel>
                      <TextInputField
                        id="covin_id"
                        name="covin_id"
                        variant="outlined"
                        margin="dense"
                        type="text"
                        value={state.form.covin_id}
                        onChange={handleChange}
                        errors={state.errors.covin_id}
                      />
                    </div>
                    <div id="number_of_doses-div">
                      <InputLabel id="doses-label" htmlFor="number_of_doses">
                        Number of doses
                      </InputLabel>
                      <RadioGroup
                        aria-label="number_of_doses"
                        id="number_of_doses"
                        name="number_of_doses"
                        value={state.form.number_of_doses}
                        onChange={handleChange}
                        style={{ padding: "0px 5px" }}
                      >
                        <Box display="flex" flexDirection="row">
                          <FormControlLabel
                            value="1"
                            control={<Radio />}
                            label="1"
                          />
                          <FormControlLabel
                            value="2"
                            control={<Radio />}
                            label="2"
                          />
                        </Box>
                      </RadioGroup>
                    </div>
                    <div id="vaccine_name-div">
                      <InputLabel
                        id="vaccine-name-label"
                        htmlFor="vaccine_name"
                        required
                      >
                        Vaccine Name
                      </InputLabel>
                      <SelectField
                        labelId="vaccine_name"
                        name="vaccine_name"
                        variant="outlined"
                        margin="dense"
                        optionArray={true}
                        value={state.form.vaccine_name}
                        options={vaccines}
                        onChange={handleChange}
                        errors={state.errors.vaccine_name}
                      />
                    </div>
                    <div id="last_vaccinated_date-div">
                      <InputLabel
                        id="last_vaccinated_date-label"
                        htmlFor="last_vaccinated_date"
                        required
                      >
                        Last Date of Vaccination
                      </InputLabel>
                      <DateInputField
                        id="last_vaccinated_date"
                        fullWidth={true}
                        value={state.form.last_vaccinated_date}
                        onChange={(date) =>
                          handleDateChange(date, "last_vaccinated_date")
                        }
                        errors={state.errors.last_vaccinated_date}
                        inputVariant="outlined"
                        margin="dense"
                        openTo="year"
                        disableFuture={true}
                      />
                    </div>
                  </div>
                }
              </Collapse>
              <div id="contact_with_confirmed_carrier-div">
                <InputLabel htmlFor="contact_with_confirmed_carrier">
                  Contact with confirmed Covid patient?
                </InputLabel>
                <RadioGroup
                  aria-label="contact_with_confirmed_carrier"
                  id="contact_with_confirmed_carrier"
                  name="contact_with_confirmed_carrier"
                  value={state.form.contact_with_confirmed_carrier}
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
              </div>

              <div id="contact_with_suspected_carrier-div">
                <InputLabel htmlFor="contact_with_suspected_carrier">
                  Contact with Covid suspect?
                </InputLabel>
                <RadioGroup
                  aria-label="contact_with_suspected_carrier"
                  id="contact_with_suspected_carrier"
                  name="contact_with_suspected_carrier"
                  value={state.form.contact_with_suspected_carrier}
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
              </div>
              <Collapse
                in={
                  JSON.parse(state.form.contact_with_confirmed_carrier) ||
                  JSON.parse(state.form.contact_with_suspected_carrier)
                }
                timeout="auto"
                unmountOnExit
                className="col-span-2"
              >
                <div className="grid gap-4 xl:gap-x-20 xl:gap-y-6 grid-cols-1 md:grid-cols-2">
                  <div id="estimated_contact_date-div">
                    <InputLabel
                      id="estimated_contact_date-label"
                      htmlFor="estimated_contact_date"
                      required
                    >
                      Estimate date of contact
                    </InputLabel>
                    <DateInputField
                      fullWidth={true}
                      id="estimated_contact_date"
                      label="Estimate date of contact"
                      value={state.form.estimated_contact_date}
                      onChange={(date) =>
                        handleDateChange(date, "estimated_contact_date")
                      }
                      errors={state.errors.estimated_contact_date}
                      inputVariant="outlined"
                      margin="dense"
                      disableFuture={true}
                    />
                  </div>

                  <div id="cluster_name-div">
                    <InputLabel
                      htmlFor="cluster_name"
                      id="cluster_name-label"
                      required
                    >
                      Name / Cluster of Contact
                    </InputLabel>
                    <TextInputField
                      id="cluster_name"
                      name="cluster_name"
                      variant="outlined"
                      margin="dense"
                      type="text"
                      placeholder="Name / Cluster of Contact"
                      value={state.form.cluster_name}
                      onChange={handleChange}
                      errors={state.errors.cluster_name}
                    />
                  </div>
                </div>
              </Collapse>
              <div data-testid="disease-status" id="disease_status-div">
                <InputLabel
                  htmlFor="disease_status"
                  id="disease_status-label"
                  required
                >
                  COVID Disease Status
                </InputLabel>
                <SelectField
                  labelId="disease_status"
                  name="disease_status"
                  variant="outlined"
                  margin="dense"
                  optionArray={true}
                  value={state.form.disease_status}
                  options={diseaseStatus}
                  onChange={handleChange}
                  errors={state.errors.disease_status}
                />
              </div>
              <div data-testid="blood-group" id="blood_group-div">
                <InputLabel
                  id="blood_group-label"
                  htmlFor="blood_group"
                  required
                >
                  Blood Group
                </InputLabel>
                <SelectField
                  labelId="blood_group"
                  name="blood_group"
                  variant="outlined"
                  margin="dense"
                  showEmpty={true}
                  optionArray={true}
                  value={state.form.blood_group}
                  options={bloodGroups}
                  onChange={handleChange}
                  errors={state.errors.blood_group}
                />
              </div>
              <div id="date_of_test-div">
                <InputLabel id="date_of_birth-label" htmlFor="date_of_test">
                  Date of Sample given for COVID Test
                </InputLabel>
                <DateInputField
                  fullWidth={true}
                  id="date_of_test"
                  value={state.form.date_of_test}
                  onChange={(date) => handleDateChange(date, "date_of_test")}
                  errors={state.errors.date_of_test}
                  inputVariant="outlined"
                  margin="dense"
                  disableFuture={true}
                />
              </div>
              <div id="date_of_result-div">
                <InputLabel htmlFor="date_of_result" id="date_of_result-label">
                  Date of Result for COVID Test
                </InputLabel>
                <DateInputField
                  fullWidth={true}
                  id="date_of_result"
                  value={state.form.date_of_result}
                  onChange={(date) => handleDateChange(date, "date_of_result")}
                  errors={state.errors.date_of_result}
                  inputVariant="outlined"
                  margin="dense"
                  disableFuture={true}
                />
              </div>

              <div id="number_of_primary_contacts-div">
                <InputLabel
                  id="number_of_primary_contacts-label"
                  htmlFor="number_of_primary_contacts"
                >
                  Number Of Primary Contacts for COVID
                </InputLabel>
                <TextInputField
                  id="number_of_primary_contacts"
                  name="number_of_primary_contacts"
                  variant="outlined"
                  margin="dense"
                  type="number"
                  value={state.form.number_of_primary_contacts}
                  onChange={handleChange}
                  errors={state.errors.number_of_primary_contacts}
                />
              </div>
              <div id="number_of_secondary_contacts-div">
                <InputLabel
                  id="number_of_secondary_contacts-label"
                  htmlFor="number_of_secondary_contacts"
                >
                  Number Of Secondary Contacts for COVID
                </InputLabel>
                <TextInputField
                  id="number_of_secondary_contacts"
                  name="number_of_secondary_contacts"
                  variant="outlined"
                  margin="dense"
                  type="number"
                  value={state.form.number_of_secondary_contacts}
                  onChange={handleChange}
                  errors={state.errors.number_of_secondary_contacts}
                />
              </div>
            </div>
          </Collapse>
        </CardContent>
      </form>
    </Card>
  );
};
