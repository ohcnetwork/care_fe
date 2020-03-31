import React, { useState, useReducer, useCallback } from "react";
import { Refresh } from '@material-ui/icons';
import { useDispatch } from "react-redux";
import { Box, Grid, Checkbox, Card, CardHeader, CardContent, CardActions, Button, InputLabel, RadioGroup, Radio, FormControlLabel, IconButton, CircularProgress } from "@material-ui/core";
import { TextInputField, NativeSelectField, ErrorHelperText, MultilineInputField } from "../Common/HelperInputFields";
import { phonePreg, getArrayValueByKey, getRandomNumbers } from "../../Common/validation";
import { navigate } from 'hookrouter';
import { Loading } from "../Common/Loading";
import AlertDialog from "../Common/AlertDialog";
import { PatientModal } from './models';
import { GENDER_TYPES, MEDICAL_HISTORY_CHOICES } from "../../Common/constants";
import { createPatient, getPatient, updatePatient, getStates, getDistrictByState, getLocalbodyByDistrict } from "../../Redux/actions";
import { useAbortableEffect, statusType } from '../../Common/utils';
import * as Notification from '../../Utils/Notifications.js';

interface PatientRegisterProps extends PatientModal {
    facilityId: number;
}

interface medicalHistoryModel {
    id?: number;
    disease: string | number;
    details: string;
}

const medicalHistoryTypes = MEDICAL_HISTORY_CHOICES.filter(i => i.id !== 1);

const medicalHistoryChoices = medicalHistoryTypes.map(i => {
    return {
        [`medical_history_${i.id}`]: ""
    }
});

const initForm: any = {
    name: "",
    age: "",
    gender: "",
    phone_number: "",
    medical_history: [],
    contact_with_carrier: "",
    state: "",
    district: "",
    local_body: "",
    ...medicalHistoryChoices,
};

const initialState = {
    form: { ...initForm },
    errors: { ...initForm }
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
            }
        }
        case "set_error": {
            return {
                ...state,
                errors: action.errors
            }
        }
        default:
            return state
    }
};

const genderTypes = [{
    id: 0,
    text: 'Select',
}, ...GENDER_TYPES];

export const PatientRegister = (props: PatientRegisterProps) => {
    const dispatchAction: any = useDispatch();
    const { facilityId, id } = props;
    const [state, dispatch] = useReducer(patientFormReducer, initialState);
    const [showAlertMessage, setAlertMessage] = useState({ show: false, message: "", title: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [isStateLoading, setIsStateLoading] = useState(false);
    const [isDistrictLoading, setIsDistrictLoading] = useState(false);
    const [isLocalbodyLoading, setIsLocalbodyLoading] = useState(false);
    const [states, setStates] = useState(initialStates)
    const [districts, setDistricts] = useState(selectStates)
    const [localBody, setLocalBody] = useState(selectDistrict)

    const headerText = !id ? "Add Patient" : "Edit Patient";
    const buttonText = !id ? "Save" : "Update";

    const fetchDistricts = useCallback(async (id: string) => {
        if (Number(id) > 0) {
            setIsDistrictLoading(true);
            const districtList = await dispatchAction(getDistrictByState({ id }))
            setDistricts([...initialDistricts, ...districtList.data]);
            setIsDistrictLoading(false);
        } else {
            setDistricts(selectStates)
        }
    }, [dispatchAction])

    const fetchLocalBody = useCallback(async (id: string) => {
        if (Number(id) > 0) {
            setIsLocalbodyLoading(true);
            const localBodyList = await dispatchAction(getLocalbodyByDistrict({ id }))
            setIsLocalbodyLoading(false);
            setLocalBody([...initialLocalbodies, ...localBodyList.data]);
        } else {
            setLocalBody(selectDistrict)
        }
    }, [dispatchAction])

    const fetchData = useCallback(async (status: statusType) => {
        setIsLoading(true);
        const res = await dispatchAction(getPatient({ id }));
        if (!status.aborted) {
            if (res && res.data) {
                const formData: any = {
                    name: res.data.name,
                    age: res.data.age,
                    gender: res.data.gender,
                    phone_number: res.data.phone_number,
                    medical_history: [],
                    contact_with_carrier: `${res.data.contact_with_carrier}`,
                    state: res.data.state,
                    district: res.data.district,
                    local_body: res.data.local_body,
                };
                res.data.medical_history.forEach((i: any) => {
                    formData.medical_history.push(i.id);
                    formData[`medical_history_${i.id}`] = i.details;
                });
                dispatch({
                    type: "set_form",
                    form: formData
                });
                Promise.all([fetchDistricts(res.data.state), fetchLocalBody(res.data.district)]);
            } else {
                navigate(`/facility/${facilityId}`);
            }
        }
        setIsLoading(false);
    }, [dispatchAction, facilityId, fetchDistricts, fetchLocalBody, id]);

    const fetchStates = useCallback(async (status: statusType) => {
        setIsStateLoading(true);
        const statesRes = await dispatchAction(getStates())
        if (!status.aborted && statesRes.data.results) {
            setStates([...initialStates, ...statesRes.data.results]);
        }
        setIsStateLoading(false);
    }, [dispatchAction])

    useAbortableEffect((status: statusType) => {
        if (id) {
            fetchData(status);
        }
        fetchStates(status);
    }, [dispatch, fetchData]);

    const validateForm = () => {
        let errors = { ...initForm };
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
                case "district":
                    if (!Number(state.form[field])) {
                        errors[field] = "Field is required";
                        invalidForm = true;
                    }
                    return;
                case "phone_number":
                    if (!phonePreg(state.form[field])) {
                        errors[field] = "Please Enter 10/11 digit mobile number or landline as 0<std code><phone number>";
                        invalidForm = true;
                    }
                    return;
                default:
                    return
            }
        });
        console.log(errors)
        dispatch({ type: "set_error", errors });
        return !invalidForm
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        const validForm = validateForm();
        if (validForm) {
            setIsLoading(true);
            let medical_history: Array<medicalHistoryModel> = []
            state.form.medical_history.forEach((id: number) => {
                const medData = medicalHistoryTypes.find(i => i.id === id);
                if (medData) {
                    medical_history.push({
                        disease: medData.text,
                        details: state.form[`medical_history_${medData.id}`]
                    });
                }
            })
            if (!medical_history.length) {
                medical_history.push({ disease: 1, details: "" });
            }
            const data = {
                "name": state.form.name,
                "age": Number(state.form.age),
                "gender": Number(state.form.gender),
                "phone_number": state.form.phone_number,
                "state": state.form.state,
                "district": state.form.district,
                "local_body": state.form.local_body,
                medical_history,
                "contact_with_carrier": JSON.parse(state.form.contact_with_carrier),
                "is_active": true,
            };

            const res = await dispatchAction(id ? updatePatient(data, { id }) : createPatient(data));
            setIsLoading(false);
            if (res && res.data) {
                dispatch({ type: "set_form", form: initForm })
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
        let form = { ...state.form };
        form[e.target.name] = e.target.value;
        dispatch({ type: "set_form", form })
    };

    const handleCheckboxChange = (e: any) => {
        let form = { ...state.form };
        const values = state.form.medical_history;
        const chocieId = Number(e.target.value);
        if (e.target.checked) {
            values.push(chocieId);
        } else {
            values.splice(values.indexOf(chocieId), 1);
        }
        form['medical_history'] = values;
        console.log(form)
        dispatch({ type: "set_form", form })
    }

    const handleCancel = () => {
        navigate(`/facility/${facilityId}`);
    };

    const renderMedicalHistory = (id: number, title: string) => {
        const field = `medical_history_${id}`
        return (
            <Box key={id}>
                <div>
                    <Checkbox
                        checked={state.form.medical_history.indexOf(id) !== -1}
                        value={id}
                        onChange={handleCheckboxChange}
                    /> {title}
                </div>
                {state.form.medical_history.indexOf(id) !== -1 && <CardContent>
                    <MultilineInputField
                        placeholder="Details"
                        rows={5}
                        name={field}
                        variant="outlined"
                        margin="dense"
                        type="text"
                        InputLabelProps={{ shrink: !!state.form[field] }}
                        value={state.form[field]}
                        onChange={handleChange}
                        errors={state.errors[field]}
                    />
                </CardContent>}
            </Box>
        )
    }

    if (isLoading) {
        return <Loading />
    }

    return <div>

        <Grid container alignContent="center" justify="center">
            <Grid item xs={12} sm={10} md={8} lg={6} xl={4}>
                <Card>
                    {showAlertMessage.show &&
                        <AlertDialog handleClose={() => handleCancel()} message={showAlertMessage.message} title={showAlertMessage.title} />
                    }
                    <CardHeader title={headerText} />
                    <form onSubmit={(e) => handleSubmit(e)}>
                        <CardContent>
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
                        </CardContent>
                        <CardContent>
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
                        </CardContent>
                        <CardContent>
                            <InputLabel id="gender-label">Gender*</InputLabel>
                            <NativeSelectField
                                name="gender"
                                variant="outlined"
                                value={state.form.gender}
                                options={genderTypes}
                                onChange={handleChange}
                            />
                            <ErrorHelperText
                                error={state.errors.gender}
                            />
                        </CardContent>
                        <CardContent>
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
                        </CardContent>
                        <CardContent>
                            <InputLabel id="gender-label">State*</InputLabel>
                            {isStateLoading ? (
                                <CircularProgress size={20} />
                            ) : (<NativeSelectField
                                name="state"
                                variant="outlined"
                                value={state.form.state}
                                options={states}
                                optionvalueidentifier="name"
                                onChange={(e) => [handleChange(e), fetchDistricts(e.target.value)]}
                            />)}
                            <ErrorHelperText
                                error={state.errors.state}
                            />
                        </CardContent>

                        <CardContent>
                            <InputLabel id="gender-label">District</InputLabel>
                            {isDistrictLoading ? (
                                <CircularProgress size={20} />
                            ) : (<NativeSelectField
                                name="district"
                                variant="outlined"
                                value={state.form.district}
                                options={districts}
                                optionvalueidentifier="name"
                                onChange={(e) => [handleChange(e), fetchLocalBody(e.target.value)]}
                            />)}
                            <ErrorHelperText
                                error={state.errors.district}
                            />
                        </CardContent>

                        <CardContent>
                            <InputLabel id="gender-label">Localbody</InputLabel>
                            {isLocalbodyLoading ? (
                                <CircularProgress size={20} />
                            ) : (<NativeSelectField
                                name="local_body"
                                variant="outlined"
                                value={state.form.local_body}
                                options={localBody}
                                optionvalueidentifier="name"
                                onChange={handleChange}
                            />)}
                            <ErrorHelperText
                                error={state.errors.local_body}
                            />
                        </CardContent>

                        <CardContent>
                            <InputLabel id="contact-with-carrier-label">
                                Has the patient had contact with someone already diagnosed with Covid 19?
                            </InputLabel>
                            <RadioGroup aria-label="covid" name="contact_with_carrier" value={state.form.contact_with_carrier} onChange={handleChange} style={{ padding: '0px 5px' }}>
                                <Box display="flex" flexDirection="row">
                                    <FormControlLabel value="true" control={<Radio />} label="Yes" />
                                    <FormControlLabel value="false" control={<Radio />} label="No" />
                                </Box>
                            </RadioGroup>
                            <ErrorHelperText
                                error={state.errors.contact_with_carrier}
                            />
                        </CardContent>

                        <CardContent>
                            <InputLabel id="med-history-label">Any medical history?</InputLabel>
                            {medicalHistoryTypes.map(i => {
                                return renderMedicalHistory(i.id, i.text)
                            })}
                        </CardContent>

                        <CardActions className="padding16" style={{ justifyContent: "space-between" }}>
                            <Button
                                color="default"
                                variant="contained"
                                type="button"
                                onClick={(e) => handleCancel()}
                            >Cancel</Button>
                            <Button
                                color="primary"
                                variant="contained"
                                type="submit"
                                style={{ marginLeft: 'auto' }}
                                onClick={(e) => handleSubmit(e)}
                            >
                                {buttonText}
                            </Button>
                        </CardActions>
                    </form>
                </Card>

            </Grid>
        </Grid>
    </div>
};
