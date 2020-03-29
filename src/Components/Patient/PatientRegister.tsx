import React, { useState, useReducer, useCallback } from "react";
import { Refresh } from '@material-ui/icons';
import { useDispatch } from "react-redux";
import { Box, Grid, Checkbox, Card, CardHeader, CardContent, CardActions, Button, InputLabel, RadioGroup, Radio, FormControlLabel, IconButton } from "@material-ui/core";
import { TextInputField, NativeSelectField, ErrorHelperText, MultilineInputField } from "../Common/HelperInputFields";
import { phonePreg, getArrayValueByKey, getRandomNumbers } from "../../Common/validation";
import { navigate } from 'hookrouter';
import { Loading } from "../Common/Loading";
import AppMessage from "../Common/AppMessage";
import AlertDialog from "../Common/AlertDialog";
import { PatientModal } from './models';
import { GENDER_TYPES } from "../../Common/constants";
import { createPatient, getPatient, updatePatient, getStates, getDistricts, getLocalBody } from "../../Redux/actions";
import { useAbortableEffect, statusType } from '../../Common/utils';
import patientnameCombinations from "../../Constants/Static_data/PatientName.json"

interface PatientRegisterProps extends PatientModal {
    facilityId: number;
}

const initForm: any = {
    name: "",
    realName: "",
    age: "",
    gender: "",
    phone_number: "",
    medical_history: [],
    contact_with_carrier: "",
    state: "",
    district: "",
    local_body: "",
    medical_history2: "",
    medical_history3: "",
    medical_history4: "",
    medical_history5: "",
};

const getRandomName = () => `${patientnameCombinations.comb1[getRandomNumbers(1, patientnameCombinations.comb1.length - 1)]}-${patientnameCombinations.comb2[getRandomNumbers(1, patientnameCombinations.comb2.length - 1)]}-${getRandomNumbers(1000, 10000)}`;

const initialState = {
    form: {
        ...initForm,
        name: getRandomName(),
    },
    errors: { ...initForm }
};

const optionalFields = [
    "district",
    "local_body",
    "medical_history2",
    "medical_history3",
    "medical_history4",
    "medical_history5"
];

const initialStatesList = [
    { id: 0, name: "Choose State *" }
];

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
    const [showAppMessage, setAppMessage] = useState({ show: false, message: "", type: "" });
    const [showAlertMessage, setAlertMessage] = useState({ show: false, message: "", title: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [states, setStates] = useState(initialStatesList)
    const [districts, setDistricts] = useState([{ id: 0, name: "Choose District", state: 0 }])
    const [localBody, setLocalBody] = useState([{ id: 0, name: "Choose Localbody" }])

    const headerText = !id ? "Add Patient" : "Edit Patient";
    const buttonText = !id ? "Save" : "Update";

    const generateRandomname = () => {
        const form = { ...state.form }
        form["name"] = getRandomName();
        dispatch({ type: "set_form", form })
    }

    const fetchData = useCallback(async (status: statusType) => {
        setIsLoading(true);
        const res = await dispatchAction(getPatient({ id }));
        if (!status.aborted) {
            if (res.data) {
                dispatch({
                    type: "set_form",
                    form: {
                        name: res.data.name,
                        age: res.data.age,
                        gender: res.data.gender,
                        phone_number: res.data.phone_number,
                        medical_history: res.data.medical_history,
                        contact_with_carrier: `${res.data.contact_with_carrier}`,
                    }
                })
            } else {
                navigate(`/facility/${facilityId}`);
            }
        }
        setIsLoading(false);
    }, [dispatchAction, facilityId, id]);

    const fetchStates = useCallback(async (status: statusType) => {
        const statesRes = await dispatchAction(getStates())
        if (!status.aborted && statesRes.data.results) {
            setStates([...initialStatesList, ...statesRes.data.results]);
        }
    }, [dispatchAction])

    useAbortableEffect((status: statusType) => {
        if (id) {
            fetchData(status);
        }
        fetchStates(status);
    }, [dispatch, fetchData]);

    const fetchDistricts = async (e: any) => {
        const index = getArrayValueByKey(states, "id", e.target.value);
        if (index > 0) {
            setIsLoading(true);
            const districtList = await dispatchAction(getDistricts({ state_name: states[index].name }))
            setDistricts([...districts, ...districtList.data.results]);
            setIsLoading(false);
        } else {
            setDistricts([{ id: 0, name: "Choose District", state: 0 }])
        }
    }

    const fetchLocalBody = async (e: any) => {
        const index = getArrayValueByKey(districts, "id", e.target.value);
        const stateIndex = getArrayValueByKey(states, "id", districts[index].state);
        if (index > 0) {
            setIsLoading(true);
            const localBodyList = await dispatchAction(getLocalBody({
                district_name: districts[index].name,
                state_name: states[stateIndex].name
            }))
            setIsLoading(false);
            setLocalBody([...localBody, ...localBodyList.data.results]);
        } else {
            setLocalBody([{ id: 0, name: "Choose Local body" }])
        }
    }

    const validateForm = () => {
        let errors = { ...initForm };
        let invalidForm = false;
        Object.keys(state.form).forEach((field, i) => {
            if ((optionalFields.indexOf(field) === -1) && !state.form[field]) {
                errors[field] = "Field is required";
                invalidForm = true;
            } else if (field === "phone_number" && !phonePreg(state.form[field])) {
                errors[field] = "Please Enter 10/11 digit mobile number or landline as 0<std code><phone number>";
                invalidForm = true;
            } else if (field === "state" && (state.form[field] === "" || state.form[field] == 0)) {
                errors[field] = "Field is required";
                invalidForm = true;
            }
        });

        dispatch({ type: "set_error", errors });
        return !invalidForm
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        const validForm = validateForm();
        if (validForm) {
            setIsLoading(true);
            let medical_history: Array<any> = []
            state.form.medical_history.map((disease: number) => {
                medical_history.push({ disease, details: state.form[`medical_history${disease}`] })
                // return medical_history
            })
            if (!medical_history.length) {
                medical_history.push({ disease: 1, details: "" })
            }
            const data = {
                "real_name": state.form.realName,
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
            if (res.data) {
                dispatch({ type: "set_form", form: initForm })
                if (!id) {
                    setAlertMessage({
                        show: true,
                        message: `Please note down patient name: ${state.form.name} and patient ID: ${res.data.id}`,
                        title: "Patient Added Successfully"
                    })
                } else {
                    setAppMessage({ show: true, message: "Patient updated successfully", type: "success" });
                    navigate(`/facility/${facilityId}`);
                }
            } else {
                setAppMessage({ show: true, message: "Error", type: "error" })
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
        dispatch({ type: "set_form", form })
    }

    const handleCancel = () => {
        navigate(`/facility/${facilityId}`);
    };

    const renderMedicalHistory = (index: number, title: string, field: string, ) => {
        return <div>
            <div>
                <Checkbox
                    checked={state.form.medical_history.indexOf(index) !== -1}
                    value={index}
                    onChange={handleCheckboxChange}
                /> {title}
            </div>
            {state.form.medical_history.indexOf(index) !== -1 && <CardContent>
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
        </div>
    }

    if (isLoading) {
        return <Loading />
    }

    return <div>

        <Grid container alignContent="center" justify="center">
            <Grid item xs={12} sm={10} md={8} lg={6} xl={4}>
                <Card>
                    <AppMessage open={showAppMessage.show} type={showAppMessage.type} message={showAppMessage.message} handleClose={() => setAppMessage({ show: false, message: "", type: "" })} handleDialogClose={() => setAppMessage({ show: false, message: "", type: "" })} />
                    {showAlertMessage.show &&
                        <AlertDialog handleClose={() => handleCancel()} message={showAlertMessage.message} title={showAlertMessage.title} />
                    }
                    <CardHeader title={headerText} />
                    <form onSubmit={(e) => handleSubmit(e)}>
                        {!id && (
                            <>
                                <CardContent>
                                    <InputLabel id="name-label">Name*</InputLabel>
                                    <Box display="flex" flexGrow="1">
                                        <Box flex="1">
                                            <TextInputField
                                                name="name"
                                                variant="outlined"
                                                margin="dense"
                                                type="text"
                                                value={state.form.name}
                                                onChange={handleChange}
                                                errors={state.errors.name}
                                                inputProps={{
                                                    readOnly: true,
                                                }}
                                            />
                                        </Box>
                                        <IconButton onClick={() => generateRandomname()}>
                                            <Refresh />
                                        </IconButton>
                                    </Box>
                                </CardContent>

                                <CardContent>
                                    <InputLabel id="name-label">Name*</InputLabel>
                                    <TextInputField
                                        name="realName"
                                        variant="outlined"
                                        margin="dense"
                                        type="text"
                                        value={state.form.realName}
                                        onChange={handleChange}
                                        errors={state.errors.realName}
                                    />
                                </CardContent>
                            </>
                        )}
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
                        {!id && (
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
                        )}
                        <CardContent>
                            <InputLabel id="gender-label">State*</InputLabel>
                            <NativeSelectField
                                name="state"
                                variant="outlined"
                                value={state.form.state}
                                options={states}
                                optionvalueidentifier="name"
                                onChange={(e) => [handleChange(e), fetchDistricts(e)]}
                            />
                            <ErrorHelperText
                                error={state.errors.state}
                            />
                        </CardContent>

                        {districts.length > 1 && <CardContent>
                            <InputLabel id="gender-label">District</InputLabel>
                            <NativeSelectField
                                name="district"
                                variant="outlined"
                                value={state.form.district}
                                options={districts}
                                optionvalueidentifier="name"
                                onChange={(e) => [handleChange(e), fetchLocalBody(e)]}
                            />
                            <ErrorHelperText
                                error={state.errors.district}
                            />
                        </CardContent>}

                        {localBody.length > 1 && <CardContent>
                            <InputLabel id="gender-label">Localbody</InputLabel>
                            <NativeSelectField
                                name="local_body"
                                variant="outlined"
                                value={state.form.local_body}
                                options={localBody}
                                optionvalueidentifier="name"
                                onChange={handleChange}
                            />
                            <ErrorHelperText
                                error={state.errors.local_body}
                            />
                        </CardContent>}
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
                            {renderMedicalHistory(2, "Diabetes", "medical_history2")}
                            {renderMedicalHistory(3, "Heart Disease", "medical_history3")}
                            {renderMedicalHistory(4, "HyperTension", "medical_history4")}
                            {renderMedicalHistory(5, "Kidney Diseases", "medical_history5")}
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
