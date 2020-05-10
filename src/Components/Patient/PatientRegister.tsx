import { Box, Button, Card, CardContent, CircularProgress, FormControlLabel, InputLabel, Radio, RadioGroup } from "@material-ui/core";
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import { navigate } from "hookrouter";
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { debounce } from "lodash";
import moment from "moment";
import React, { useCallback, useReducer, useState } from "react";
import { useDispatch } from "react-redux";
import { BLOOD_GROUPS, DISEASE_STATUS, GENDER_TYPES, MEDICAL_HISTORY_CHOICES } from "../../Common/constants";
import countryList from "../../Common/static/countries.json";
import statesList from "../../Common/static/states.json";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { createPatient, getDistrictByState, getLocalbodyByDistrict, getPatient, getStates, searchPatient, updatePatient } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import AlertDialog from "../Common/AlertDialog";
import { AutoCompleteMultiField, CheckboxField, DateInputField, MultilineInputField, PhoneNumberField, SelectField, TextInputField } from "../Common/HelperInputFields";
import { Loading } from "../Common/Loading";
import PageTitle from "../Common/PageTitle";
import DuplicatePatientDialog from "../Facility/DuplicatePatientDialog";
import { DupPatientModel } from "../Facility/models";
import { PatientModel } from "./models";
import TransferPatientDialog from "../Facility/TransferPatientDialog";

const placesList = countryList.concat(statesList.filter((i: string) => i !== 'Kerala'));

interface PatientRegisterProps extends PatientModel {
  facilityId: number;
}

interface medicalHistoryModel {
  id?: number;
  disease: string | number;
  details: string;
}

const medicalHistoryTypes = MEDICAL_HISTORY_CHOICES.filter(i => i.id !== 1);

let medicalHistoryChoices: any = {};

medicalHistoryTypes.forEach(i => medicalHistoryChoices[`medical_history_${i.id}`] = "");

const genderTypes = [
  {
    id: 0,
    text: "Select"
  },
  ...GENDER_TYPES
];

const diseaseStatus = [...DISEASE_STATUS];

const bloodGroups = [...BLOOD_GROUPS];

const initForm: any = {
  name: "",
  age: "",
  gender: "",
  phone_number: "",
  blood_group: "",
  disease_status: diseaseStatus[0],
  date_of_birth: null,
  medical_history: [],
  nationality: "India",
  passport_no: "",
  state: "",
  district: "",
  local_body: "",
  address: "",
  present_health: "",
  contact_with_confirmed_carrier: "false",
  contact_with_suspected_carrier: "false",
  estimated_contact_date: null,
  date_of_return: null,
  past_travel: false,
  countries_travelled: [],
  has_SARI: false,
  prescribed_medication: false,
  ongoing_medication: "",
  is_medical_worker: "false",
  number_of_aged_dependents: "",
  number_of_chronic_diseased_dependents: "",
  ...medicalHistoryChoices
};

const initError = Object.assign({}, ...Object.keys(initForm).map(k => ({ [k]: "" })));

const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};

const initialStates = [{ id: 0, name: "Choose State *" }];
const initialDistricts = [{ id: 0, name: "Choose District" }];
const selectStates = [{ id: 0, name: "Please select your state" }];
const initialLocalbodies = [{ id: 0, name: "Choose Localbody" }];
const selectDistrict = [{ id: 0, name: "Please select your district" }];

const patientFormReducer = (state = initialState, action: any) => {
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

const goBack = () => {
  window.history.go(-1);
};

export const PatientRegister = (props: PatientRegisterProps) => {
  const dispatchAction: any = useDispatch();
  const { facilityId, id } = props;
  const [state, dispatch] = useReducer(patientFormReducer, initialState);
  const [showAlertMessage, setAlertMessage] = useState({
    show: false,
    message: "",
    title: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isStateLoading, setIsStateLoading] = useState(false);
  const [isDistrictLoading, setIsDistrictLoading] = useState(false);
  const [isLocalbodyLoading, setIsLocalbodyLoading] = useState(false);
  const [states, setStates] = useState(initialStates);
  const [districts, setDistricts] = useState(selectStates);
  const [localBody, setLocalBody] = useState(selectDistrict);
  const [statusDialog, setStatusDialog] = useState<{ show?: boolean; transfer?: boolean; patientList: Array<DupPatientModel> }>({ patientList: [] });

  const headerText = !id ? "Add Details of Covid Suspect / Patient" : "Update Covid Suspect / Patient Details";
  const buttonText = !id ? "Add Covid Suspect / Patient" : "Save Details";

  const fetchDistricts = useCallback(
    async (id: string) => {
      if (Number(id) > 0) {
        setIsDistrictLoading(true);
        const districtList = await dispatchAction(getDistrictByState({ id }));
        setDistricts([...initialDistricts, ...districtList.data]);
        setIsDistrictLoading(false);
      } else {
        setDistricts(selectStates);
      }
    },
    [dispatchAction]
  );

  const fetchLocalBody = useCallback(
    async (id: string) => {
      if (Number(id) > 0) {
        setIsLocalbodyLoading(true);
        const localBodyList = await dispatchAction(
          getLocalbodyByDistrict({ id })
        );
        setIsLocalbodyLoading(false);
        setLocalBody([...initialLocalbodies, ...localBodyList.data]);
      } else {
        setLocalBody(selectDistrict);
      }
    },
    [dispatchAction]
  );

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(getPatient({ id }));
      if (!status.aborted) {
        if (res && res.data) {
          const formData = {
            ...res.data,
            nationality: res.data.nationality ? res.data.nationality : "India",
            gender: res.data.gender ? res.data.gender : '',
            state: res.data.state ? res.data.state : '',
            district: res.data.district ? res.data.district : '',
            blood_group: res.data.blood_group ? res.data.blood_group : '',
            local_body: res.data.local_body ? res.data.local_body : '',
            medical_history: [],
            ongoing_medication: res.data.ongoing_medication ? res.data.ongoing_medication : '',
            countries_travelled: res.data.countries_travelled,
            is_medical_worker: res.data.is_medical_worker ? String(res.data.is_medical_worker) : 'false',
            contact_with_confirmed_carrier: res.data.contact_with_confirmed_carrier ? String(res.data.contact_with_confirmed_carrier) : 'false',
            contact_with_suspected_carrier: res.data.contact_with_suspected_carrier ? String(res.data.contact_with_suspected_carrier) : 'false',
            number_of_aged_dependents: Number(res.data.number_of_aged_dependents) ? Number(res.data.number_of_aged_dependents) : '',
            number_of_chronic_diseased_dependents: Number(res.data.number_of_chronic_diseased_dependents) ? Number(res.data.number_of_chronic_diseased_dependents) : '',
          };
          res.data.medical_history.forEach((i: any) => {
            const medicalHistoryId = medicalHistoryTypes.find((j: any) => j.text === i.disease)?.id;
            if (medicalHistoryId) {
              formData.medical_history.push(medicalHistoryId);
              formData[`medical_history_${medicalHistoryId}`] = i.details;
            }
          });
          dispatch({
            type: "set_form",
            form: formData
          });
          Promise.all([
            fetchDistricts(res.data.state),
            fetchLocalBody(res.data.district)
          ]);
        } else {
          goBack();
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, fetchDistricts, fetchLocalBody, id]
  );

  const fetchStates = useCallback(
    async (status: statusType) => {
      setIsStateLoading(true);
      const statesRes = await dispatchAction(getStates());
      if (!status.aborted && statesRes.data.results) {
        setStates([...initialStates, ...statesRes.data.results]);
      }
      setIsStateLoading(false);
    },
    [dispatchAction]
  );

  useAbortableEffect(
    (status: statusType) => {
      if (id) {
        fetchData(status);
      }
      fetchStates(status);
    },
    [dispatch, fetchData]
  );

  const validateForm = () => {
    let errors = { ...initError };
    let invalidForm = false;
    Object.keys(state.form).forEach((field, i) => {
      switch (field) {
        case "name":
        case "gender":
          if (!state.form[field]) {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          return;
        case "date_of_birth":
          if (!state.form[field]) {
            errors[field] = "Please enter date in DD/MM/YYYY format";
            invalidForm = true;
          }
          return;
        case "state":
          if (state.form.nationality === "India" && !Number(state.form[field])) {
            errors[field] = "Please enter the state";
            invalidForm = true;
          }
          return;
        case "passport_no":
          if (state.form.nationality !== "India" && !state.form[field]) {
            errors[field] = "Please enter the passport number";
            invalidForm = true;
          }
          return;
        case "phone_number":
          const phoneNumber = parsePhoneNumberFromString(state.form[field]);
          if (!state.form[field] || !phoneNumber?.isPossible()) {
            errors[field] = "Please enter valid phone number";
            invalidForm = true;
          }
          return;
        case "countries_travelled":
          if (state.form.past_travel && !state.form[field].length) {
            errors[field] = "Please enter the list of countries visited";
            invalidForm = true;
          }
          return;
        case "date_of_return":
          if (state.form.past_travel && !state.form[field]) {
            errors[field] = "Please enter the date of return from travel";
            invalidForm = true;
          }
          return;
        case "estimated_contact_date":
          if ((JSON.parse(state.form.contact_with_confirmed_carrier) || JSON.parse(state.form.contact_with_suspected_carrier))) {
            if (!state.form[field]) {
              errors[field] = "Please enter the estimated date of contact";
              invalidForm = true;
            }
          }
          return;
        default:
          return;
      }
    });
    dispatch({ type: "set_error", errors });
    return !invalidForm;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const validForm = validateForm();
    if (validForm) {
      setIsLoading(true);
      let medical_history: Array<medicalHistoryModel> = [];
      state.form.medical_history.forEach((id: number) => {
        const medData = medicalHistoryTypes.find(i => i.id === id);
        if (medData) {
          const details = state.form[`medical_history_${medData.id}`];
          medical_history.push({
            disease: medData.text,
            details: details ? details : "",
          });
        }
      });
      if (!medical_history.length) {
        medical_history.push({ disease: "NO", details: "" });
      }
      const data = {
        phone_number: parsePhoneNumberFromString(state.form.phone_number)?.format('E.164'),
        date_of_birth: moment(state.form.date_of_birth).format('YYYY-MM-DD'),
        disease_status: state.form.disease_status,
        name: state.form.name,
        gender: Number(state.form.gender),
        nationality: state.form.nationality,
        passport_no: state.form.nationality !== "India" ? state.form.passport_no : undefined,
        state: state.form.nationality === "India" ? state.form.state : undefined,
        district: state.form.nationality === "India" ? state.form.district : undefined,
        local_body: state.form.nationality === "India" ? state.form.local_body : undefined,
        address: state.form.address ? state.form.address : undefined,
        present_health: state.form.present_health ? state.form.present_health : undefined,
        contact_with_confirmed_carrier: JSON.parse(state.form.contact_with_confirmed_carrier),
        contact_with_suspected_carrier: JSON.parse(state.form.contact_with_suspected_carrier),
        estimated_contact_date: state.form.estimated_contact_date,
        past_travel: state.form.past_travel,
        countries_travelled: state.form.past_travel ? state.form.countries_travelled : [],
        date_of_return: state.form.past_travel ? state.form.date_of_return : undefined,
        has_SARI: state.form.has_SARI,
        ongoing_medication: state.form.ongoing_medication,
        is_medical_worker: JSON.parse(state.form.is_medical_worker),
        blood_group: state.form.blood_group ? state.form.blood_group : undefined,
        number_of_aged_dependents: Number(state.form.number_of_aged_dependents) ? Number(state.form.number_of_aged_dependents) : undefined,
        number_of_chronic_diseased_dependents: Number(state.form.number_of_chronic_diseased_dependents) ? Number(state.form.number_of_chronic_diseased_dependents) : undefined,
        medical_history,
        is_active: true
      };

      const res = await dispatchAction(
        id ? updatePatient(data, { id }) : createPatient({ ...data, facility: facilityId })
      );
      setIsLoading(false);
      if (res && res.data) {
        dispatch({ type: "set_form", form: initForm });
        if (!id) {
          setAlertMessage({
            show: true,
            message: `Please note down patient name: ${state.form.name} and patient ID: ${res.data.id}`,
            title: "Patient Added Successfully"
          });
          navigate(`/facility/${facilityId}/patient/${res.data.id}`);
        } else {
          Notification.Success({
            msg: "Patient updated successfully"
          });
          goBack();
        }
      }
    }
  };

  const handleChange = (e: any) => {
    const form = { ...state.form };
    form[e.target.name] = e.target.value;
    dispatch({ type: "set_form", form });
  };

  const handleValueChange = (value: any, name: string) => {
    const form = { ...state.form };
    form[name] = value;
    dispatch({ type: "set_form", form });
  };

  const handleDateChange = (date: any, field: string) => {
    if (moment(date).isValid()) {
      const form = { ...state.form };
      form[field] = date;
      dispatch({ type: "set_form", form });
    }
  };

  const handleCheckboxFieldChange = (e: any) => {
    const form = { ...state.form };
    const { checked, name } = e.target;
    form[name] = checked;
    dispatch({ type: "set_form", form });
  };

  const handleMedicalCheckboxChange = (e: any, id: number) => {
    let form = { ...state.form };
    const values = state.form.medical_history;
    if (e.target.checked) {
      values.push(id);
    } else {
      values.splice(values.indexOf(id), 1);
    }
    form["medical_history"] = values;
    dispatch({ type: "set_form", form });
  };

  const duplicateCheck = useCallback(debounce(async (phoneNo: string) => {
    if (phoneNo && parsePhoneNumberFromString(phoneNo)?.isPossible()) {
      const query = {
        phone_number: parsePhoneNumberFromString(phoneNo)?.format('E.164')
      };
      const res = await dispatchAction(searchPatient(query))
      if (res && res.data && res.data.results) {
        const duplicateList = !id ? res.data.results : res.data.results.filter((item: DupPatientModel) => item.patient_id !== id);
        if (duplicateList.length) {
          setStatusDialog({
            show: true,
            patientList: duplicateList
          });
        }
      }
    }
  }, 300), []);

  const handleDialogClose = (action: string) => {
    if (action === 'transfer') {
      setStatusDialog({ ...statusDialog, show: false, transfer: true });
    } else if (action === 'back') {
      setStatusDialog({ ...statusDialog, show: true, transfer: false });
    } else {
      setStatusDialog({ show: false, transfer: false, patientList: [] });
    }
  }

  const renderMedicalHistory = (id: number, title: string) => {
    const checkboxField = `medical_history_check_${id}`;
    const textField = `medical_history_${id}`;
    return (
      <div key={textField}>
        <div>
          <CheckboxField
            checked={state.form.medical_history.indexOf(id) !== -1}
            onChange={(e) => handleMedicalCheckboxChange(e, id)}
            name={checkboxField}
            label={title}
          />
        </div>
        {state.form.medical_history.indexOf(id) !== -1 && (
          <CardContent>
            <MultilineInputField
              placeholder="Details"
              rows={5}
              name={textField}
              variant="outlined"
              margin="dense"
              type="text"
              value={state.form.textField}
              onChange={handleChange}
              errors={state.errors[textField]}
            />
          </CardContent>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div>
      {statusDialog.show && (<DuplicatePatientDialog
        patientList={statusDialog.patientList}
        handleOk={handleDialogClose}
        handleCancel={goBack}
        isNew={!id}
      />)}
      {statusDialog.transfer && (<TransferPatientDialog
        patientList={statusDialog.patientList}
        handleOk={() => handleDialogClose("close")}
        handleCancel={() => handleDialogClose("back")}
        facilityId={facilityId}
      />)}
      <PageTitle title={headerText} />
      <div className="mt-4">
        <Card>
          {showAlertMessage.show && (
            <AlertDialog
              handleClose={() => goBack()}
              message={showAlertMessage.message}
              title={showAlertMessage.title}
            />
          )}
          <CardContent>

            <form onSubmit={e => handleSubmit(e)}>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div>
                  <PhoneNumberField
                    label="Phone Number*"
                    value={state.form.phone_number}
                    onChange={(value: any) => [
                      duplicateCheck(value),
                      handleValueChange(value, 'phone_number'),
                    ]}
                    errors={state.errors.phone_number}
                  />
                </div>
                <div>
                  <InputLabel id="date_of_birth-label">Date of birth*</InputLabel>
                  <DateInputField
                    fullWidth={true}
                    value={state.form.date_of_birth}
                    onChange={date => handleDateChange(date, "date_of_birth")}
                    errors={state.errors.date_of_birth}
                    inputVariant="outlined"
                    margin="dense"
                    openTo="year"
                    disableFuture={true}
                  />
                </div>

                <div>
                  <InputLabel id="name-label">Name*</InputLabel>
                  <TextInputField
                    name="name"
                    variant="outlined"
                    margin="dense"
                    type="text"
                    value={state.form.name}
                    onChange={handleChange}
                    errors={state.errors.name}
                  />
                </div>

                <div>
                  <InputLabel id="disease_status-label">Disease Status*</InputLabel>
                  <SelectField
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

                <div>
                  <InputLabel id="gender-label">Gender*</InputLabel>
                  <SelectField
                    name="gender"
                    variant="outlined"
                    margin="dense"
                    value={state.form.gender}
                    options={genderTypes}
                    onChange={handleChange}
                    errors={state.errors.gender}
                  />
                </div>

                <div>
                  <InputLabel id="is_medical_worker">Medical Worker</InputLabel>
                  <RadioGroup
                    aria-label="is_medical_worker"
                    name="is_medical_worker"
                    value={state.form.is_medical_worker}
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

                <div>
                  <InputLabel id="nationality-label">Nationality*</InputLabel>
                  <SelectField
                    name="nationality"
                    variant="outlined"
                    margin="dense"
                    optionArray={true}
                    value={state.form.nationality}
                    options={countryList}
                    onChange={handleChange}
                    errors={state.errors.nationality}
                  />
                </div>

                {state.form.nationality === 'India' ? (<>
                  <div>
                    <InputLabel id="gender-label">State*</InputLabel>
                    {isStateLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                        <SelectField
                          name="state"
                          variant="outlined"
                          margin="dense"
                          value={state.form.state}
                          options={states}
                          optionValue="name"
                          onChange={e => [
                            handleChange(e),
                            fetchDistricts(String(e.target.value))
                          ]}
                          errors={state.errors.state}
                        />
                      )}
                  </div>

                  <div>
                    <InputLabel id="district-label">District</InputLabel>
                    {isDistrictLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                        <SelectField
                          name="district"
                          variant="outlined"
                          margin="dense"
                          value={state.form.district}
                          options={districts}
                          optionValue="name"
                          onChange={e => [
                            handleChange(e),
                            fetchLocalBody(String(e.target.value))
                          ]}
                          errors={state.errors.district}
                        />
                      )}
                  </div>

                  <div>
                    <InputLabel id="local_body-label">Localbody</InputLabel>
                    {isLocalbodyLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                        <SelectField
                          name="local_body"
                          variant="outlined"
                          margin="dense"
                          value={state.form.local_body}
                          options={localBody}
                          optionValue="name"
                          onChange={handleChange}
                          errors={state.errors.local_body}
                        />
                      )}
                  </div>
                </>) : (<div>
                  <InputLabel id="passport-label">Passport Number*</InputLabel>
                  <TextInputField
                    name="passport_no"
                    variant="outlined"
                    margin="dense"
                    value={state.form.passport_no}
                    onChange={handleChange}
                    errors={state.errors.passport_no}
                  />
                </div>)}

                <div>
                  <InputLabel id="address-label">Address</InputLabel>
                  <MultilineInputField
                    rows={2}
                    name="address"
                    variant="outlined"
                    margin="dense"
                    type="text"
                    placeholder="Optional Information"
                    value={state.form.address}
                    onChange={handleChange}
                    errors={state.errors.address}
                  />
                </div>

                <div>
                  <InputLabel id="blood_group-label">Blood Group</InputLabel>
                  <SelectField
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
              </div>

              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mt-4">
                <div>
                  <InputLabel id="contact_with_confirmed_carrier">
                    Contact with confirmed Covid patient?
                  </InputLabel>
                  <RadioGroup
                    aria-label="contact_with_confirmed_carrier"
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

                <div>
                  <InputLabel id="contact_with_suspected_carrier">
                    Contact with Covid suspect?
                  </InputLabel>
                  <RadioGroup
                    aria-label="contact_with_suspected_carrier"
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

                {(JSON.parse(state.form.contact_with_confirmed_carrier) || JSON.parse(state.form.contact_with_suspected_carrier)) && (<div>
                  <DateInputField
                    fullWidth={true}
                    label="Esimate date of contact*"
                    value={state.form.estimated_contact_date}
                    onChange={date => handleDateChange(date, "estimated_contact_date")}
                    errors={state.errors.estimated_contact_date}
                    inputVariant="outlined"
                    margin="dense"
                    disableFuture={true}
                  />
                </div>)}

                <div className="md:col-span-2">
                  <CheckboxField
                    checked={state.form.past_travel}
                    onChange={handleCheckboxFieldChange}
                    name="past_travel"
                    label="Domestic/international Travel History (within last 28 days)"
                  />
                </div>

                {state.form.past_travel && (<>
                  <div className="md:col-span-2">
                    <AutoCompleteMultiField
                      id="countries-travelled"
                      options={placesList}
                      label="Countries / Places Visited* (including transit stops)"
                      variant="outlined"
                      placeholder="Select country or enter the place of visit"
                      onChange={(e: object, value: any) => handleValueChange(value, 'countries_travelled')}
                      value={state.form.countries_travelled}
                      errors={state.errors.countries_travelled}
                    />
                  </div>
                  <div>
                    <DateInputField
                      fullWidth={true}
                      label="Estimated date of Arrival*"
                      value={state.form.date_of_return}
                      onChange={date => handleDateChange(date, "date_of_return")}
                      errors={state.errors.date_of_return}
                      inputVariant="outlined"
                      margin="dense"
                      disableFuture={true}
                    />
                  </div>
                </>)}
              </div>

              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mt-4">
                <div className="md:col-span-2">
                  <CheckboxField
                    checked={state.form.has_SARI}
                    onChange={handleCheckboxFieldChange}
                    name="has_SARI"
                    label="Does the person have SARI (Severe Acute Respiratory illness)?"
                  />
                </div>

                <div className="md:col-span-2">
                  <InputLabel id="med-history-label">
                    Any medical history? (Optional Information)
                  </InputLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    {medicalHistoryTypes.map(i => {
                      return renderMedicalHistory(i.id, i.text);
                    })}
                  </div>
                </div>

                <div>
                  <InputLabel id="present_health-label">Present Health</InputLabel>
                  <MultilineInputField
                    rows={2}
                    name="present_health"
                    variant="outlined"
                    margin="dense"
                    type="text"
                    placeholder="Optional Information"
                    value={state.form.present_health}
                    onChange={handleChange}
                    errors={state.errors.present_health}
                  />
                </div>

                <div>
                  <InputLabel id="ongoing_medication-label">Ongoing Medication</InputLabel>
                  <MultilineInputField
                    rows={2}
                    name="ongoing_medication"
                    variant="outlined"
                    margin="dense"
                    type="text"
                    placeholder="Optional Information"
                    value={state.form.ongoing_medication}
                    onChange={handleChange}
                    errors={state.errors.ongoing_medication}
                  />
                </div>

                <div>
                  <InputLabel id="number_of_aged_dependents-label">Number Of Aged Dependents (Above 60)</InputLabel>
                  <TextInputField
                    name="number_of_aged_dependents"
                    variant="outlined"
                    margin="dense"
                    type="number"
                    value={state.form.number_of_aged_dependents}
                    onChange={handleChange}
                    errors={state.errors.number_of_aged_dependents}
                  />
                </div>

                <div>
                  <InputLabel id="number_of_chronic_diseased_dependents-label">Number Of Chronic Diseased Dependents</InputLabel>
                  <TextInputField
                    name="number_of_chronic_diseased_dependents"
                    variant="outlined"
                    margin="dense"
                    type="number"
                    value={state.form.number_of_chronic_diseased_dependents}
                    onChange={handleChange}
                    errors={state.errors.number_of_chronic_diseased_dependents}
                  />
                </div>

              </div>
              <div
                className="flex justify-between mt-4"
              >
                <Button
                  color="default"
                  variant="contained"
                  type="button"
                  onClick={goBack}
                > Cancel </Button>
                <Button
                  color="primary"
                  variant="contained"
                  type="submit"
                  style={{ marginLeft: "auto" }}
                  startIcon={<CheckCircleOutlineIcon>save</CheckCircleOutlineIcon>}
                  onClick={e => handleSubmit(e)}
                > {buttonText} </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
