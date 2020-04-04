import React, { useState, useReducer, useCallback } from "react";
import { useDispatch } from "react-redux";
import { Box, Card, CardContent, Button, InputLabel, RadioGroup, Radio, FormControlLabel, CircularProgress } from "@material-ui/core";
import { TextInputField, SelectField, ErrorHelperText, MultilineInputField, CheckboxField, AutoCompleteMultiField, DateInputField } from "../Common/HelperInputFields";
import { phonePreg } from "../../Common/validation";
import { navigate } from "hookrouter";
import { Loading } from "../Common/Loading";
import AlertDialog from "../Common/AlertDialog";
import { PatientModel } from "./models";
import { GENDER_TYPES, MEDICAL_HISTORY_CHOICES } from "../../Common/constants";
import { createPatient, getPatient, updatePatient, getStates, getDistrictByState, getLocalbodyByDistrict } from "../../Redux/actions";
import { useAbortableEffect, statusType } from "../../Common/utils";
import countryList from "../../Common/static/countries.json"
import * as Notification from "../../Utils/Notifications.js";
import PageTitle from "../Common/PageTitle";

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

const initForm: any = {
  name: "",
  age: "",
  gender: "",
  phone_number: "",
  medical_history: [],
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

const genderTypes = [
  {
    id: 0,
    text: "Select"
  },
  ...GENDER_TYPES
];

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

  const headerText = !id ? "Add Details of Covid Suspect" : "Update Covid Suspect Details";
  const buttonText = !id ? "Save" : "Update";

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
            medical_history: [],
            contact_with_confirmed_carrier: String(res.data.contact_with_confirmed_carrier),
            contact_with_suspected_carrier: String(res.data.contact_with_suspected_carrier),
            countries_travelled: res.data.countries_travelled ? res.data.countries_travelled.split(',') : [],
          }
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
          navigate(`/facility/${facilityId}`);
        }
      }
      setIsLoading(false);
    },
    [dispatchAction, facilityId, fetchDistricts, fetchLocalBody, id]
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
        case "age":
        case "gender":
          if (!state.form[field]) {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          return;
        case "state":
          if (!Number(state.form[field])) {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          return;
        case "phone_number":
          if (!phonePreg(state.form[field])) {
            errors[field] =
              "Please Enter 10/11 digit mobile number or landline as 0<std code><phone number>";
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
          if ((JSON.parse(state.form.contact_with_confirmed_carrier) || JSON.parse(state.form.contact_with_suspected_carrier))
            && !state.form[field]) {
            errors[field] = "Please enter the estimated date of contact";
            invalidForm = true;
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
          medical_history.push({
            disease: medData.text,
            details: state.form[`medical_history_${medData.id}`]
          });
        }
      });
      if (!medical_history.length) {
        medical_history.push({ disease: "NO", details: "" });
      }
      const data = {
        name: state.form.name,
        age: Number(state.form.age),
        gender: Number(state.form.gender),
        phone_number: state.form.phone_number,
        state: state.form.state,
        district: state.form.district,
        local_body: state.form.local_body,
        address: state.form.address ? state.form.address : undefined,
        present_health: state.form.present_health ? state.form.present_health : undefined,
        contact_with_confirmed_carrier: JSON.parse(state.form.contact_with_confirmed_carrier),
        contact_with_suspected_carrier: JSON.parse(state.form.contact_with_suspected_carrier),
        estimated_contact_date: state.form.estimated_contact_date,
        past_travel: state.form.past_travel,
        countries_travelled: state.form.past_travel ? state.form.countries_travelled.join(',') : undefined,
        date_of_return: state.form.past_travel ? state.form.date_of_return : undefined,
        has_SARI: state.form.has_SARI,
        // prescribed_medication: state.form.prescribed_medication,
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
        } else {
          Notification.Success({
            msg: "Patient updated successfully"
          });
          navigate(`/facility/${facilityId}/patient/${res.data.id}`);
        }
      }
    }
  };

  const handleChange = (e: any) => {
    const form = { ...state.form };
    form[e.target.name] = e.target.value;
    dispatch({ type: "set_form", form });
  };

  const handleCountryChange = (event: object, value: any, reason: string) => {
    const form = { ...state.form };
    form.countries_travelled = value;
    dispatch({ type: "set_form", form });
  }

  const handleDateChange = (date: any, field: string) => {
    const form = { ...state.form };
    form[field] = date;
    dispatch({ type: "set_form", form });
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

  const handleCancel = () => {
    navigate(`/facility/${facilityId}`);
  };

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
              InputLabelProps={{ shrink: !!state.form[textField] }}
              value={state.form[textField]}
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
      <PageTitle title={headerText} />
      <div className="mt-4">
        <Card>
          {showAlertMessage.show && (
            <AlertDialog
              handleClose={() => handleCancel()}
              message={showAlertMessage.message}
              title={showAlertMessage.title}
            />
          )}
          <CardContent>

            <form onSubmit={e => handleSubmit(e)}>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
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
                  <InputLabel id="age-label">Age*</InputLabel>
                  <TextInputField
                    name="age"
                    variant="outlined"
                    margin="dense"
                    type="number"
                    value={state.form.age}
                    onChange={handleChange}
                    errors={state.errors.age}
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
                  <InputLabel id="phone-label">Mobile Number*</InputLabel>
                  <TextInputField
                    name="phone_number"
                    variant="outlined"
                    margin="dense"
                    type="number"
                    value={state.form.phone_number}
                    onChange={handleChange}
                    errors={state.errors.phone_number}
                  />
                </div>

                <div>
                  <InputLabel id="address-label">Address</InputLabel>
                  <MultilineInputField
                    rows={2}
                    name="address"
                    variant="outlined"
                    margin="dense"
                    type="text"
                    placeholder="Optional Information"
                    InputLabelProps={{ shrink: !!state.form.address }}
                    value={state.form.address}
                    onChange={handleChange}
                    errors={state.errors.address}
                  />
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
                    InputLabelProps={{ shrink: !!state.form.present_health }}
                    value={state.form.present_health}
                    onChange={handleChange}
                    errors={state.errors.present_health}
                  />
                </div>

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
                  <InputLabel id="gender-label">District</InputLabel>
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
                        error={state.errors.district}
                      />
                    )}
                </div>

                <div className="md:col-span-2">
                  <InputLabel id="gender-label">Localbody</InputLabel>
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
                    label="Esimate date of contact*"
                    value={state.form.estimated_contact_date}
                    onChange={date => handleDateChange(date, "estimated_contact_date")}
                    errors={state.errors.estimated_contact_date}
                    variant="outlined"
                    maxDate={new Date()}
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
                      options={countryList}
                      label="Countries / Places Visited*"
                      variant="outlined"
                      placeholder="Select country or enter the place of visit"
                      onChange={handleCountryChange}
                      value={state.form.countries_travelled}
                      errors={state.errors.countries_travelled}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <DateInputField
                      label="Estimated date of return*"
                      value={state.form.date_of_return}
                      onChange={date => handleDateChange(date, "date_of_return")}
                      errors={state.errors.date_of_return}
                      variant="outlined"
                      maxDate={new Date()}
                    />
                  </div>
                </>)}

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

                {/* <div className="md:col-span-2">
                  <CheckboxField
                    checked={state.form.prescribed_medication}
                    onChange={handleCheckboxFieldChange}
                    name="prescribed_medication"
                    label="Already prescribed medication for any underlying condition?"
                  />
                </div> */}

              </div>
              <div
                className="flex justify-between mt-4"
              >
                <Button
                  color="default"
                  variant="contained"
                  type="button"
                  onClick={e => handleCancel()}
                > Cancel </Button>
                <Button
                  color="primary"
                  variant="contained"
                  type="submit"
                  style={{ marginLeft: "auto" }}
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
