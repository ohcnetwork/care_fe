import React, { useState, useReducer, useCallback, useEffect} from "react"
import { makeStyles, Theme } from '@material-ui/core/styles';
import { useDispatch } from "react-redux";
import { Box, Grid, Checkbox, Card, CardHeader, CardContent, CardActions, Button, FormControl, InputLabel, Select, MenuItem, Typography, FormLabel, RadioGroup, Radio, FormControlLabel } from "@material-ui/core";
import { TextInputField, NativeSelectField, ErrorHelperText, MultilineInputField, ShowCheckboxOptions } from "../Common/HelperInputFields";
import { phonePreg } from "../../Constants/common";
import { navigate } from 'hookrouter';
import { Loading } from "../Common/Loading";
import AppMessage from "../Common/AppMessage";
import { PatientModal} from './modals';
import { MEDICAL_HISTORY_CHOICES, GENDER_TYPES } from "./constants";
import { createPatient, getPatient, updatePatient } from "../../Redux/actions";

interface PatientRegisterProps extends PatientModal {
    facilityId: number;
}

const initForm: any = {
    name: "",
    age: "",
    gender:"",
    phone_number: "",
    medical_history: [],
    contact_with_carrier:"",
    medical_history_details: ""
};
const initialState = {
    form: { ...initForm },
    errors: { ...initForm }
};

const optionalFields = ["medical_history_details"];

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



const useStyles = makeStyles((theme: Theme) => ({
    formTop: {
        marginTop: '80px',
        marginBottom: "70px"
    },
    formControl: {
        margin: theme.spacing(1)
    },
    selectLabel: {
        background: 'white',
        padding: '2px 10px'
    },
    checkBoxLabel: {
        marginLeft: '8px'
    },
}));

const genderTypes = [{
    id: 0,
    text: 'Select',
}, ...GENDER_TYPES]


export const PatientRegister = (props:PatientRegisterProps) => {
    const classes = useStyles();
    const dispatchAction: any = useDispatch();
    const { facilityId, id } = props;
    const [state, dispatch] = useReducer(patientFormReducer, initialState);
    const [showAppMessage, setAppMessage] = useState({ show: false, message: "", type: "" });
    const [isLoading, setIsLoading] = useState(false);


    const headerText = !id ? "Add Patient" : "Edit Patient";
    const buttonText = !id ? "Save" : "Update";

    const fetchData = useCallback(async () => {
        if (id) {
            setIsLoading(true);
            const res = await dispatchAction(getPatient({id}));
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
                            medical_history_details: res.data.medical_history_details
                        }
                    })
            } else {
                navigate(`/facility/${facilityId}`);
            }
            setIsLoading(false);
        }
    }, [dispatchAction, facilityId, id]);

    useEffect(() => {
        fetchData();
    }, [dispatch, fetchData, id]);



    const validateForm = () => {
        let errors = { ...initForm };
        let invalidForm = false;
        Object.keys(state.form).forEach((field, i) => {
            if ((optionalFields.indexOf(field) === -1) && !state.form[field]) {
                errors[field] = "Field is required";
                invalidForm = true;
            }else if(field === 'medical_history' && state.form['medical_history'].length == 0){
                errors['medical_history'] = "Field is required";
                invalidForm = true;
            }else if (field === "phone_number" && !phonePreg(state.form[field])) {
                errors[field] = "Please Enter 10/11 digit mobile number or landline as 0<std code><phone number>";
                invalidForm = true;
            }
        });
        if (invalidForm) {
            dispatch({ type: "set_error", errors });
            return false
        }
        dispatch({ type: "set_error", errors });
        return true
    };

    const handleSubmit = async(e: any) => {
        e.preventDefault();
        const validForm = validateForm();
        if (validForm) {
            setIsLoading(true);
            const data = {
                "name": state.form.name,
                "age": Number(state.form.age),
                "gender": Number(state.form.gender),
                "phone_number": state.form.phone_number,
                "medical_history": state.form.medical_history,
                "contact_with_carrier": JSON.parse(state.form.contact_with_carrier),
                "medical_history_details": state.form.medical_history_details,
                "is_active": true,
            };
            
            const res = await dispatchAction(id?updatePatient(data,{id}):createPatient(data));
            setIsLoading(false);
            if (res.data) {
                dispatch({ type: "set_form", form: initForm })
                if (!id) {
                    setAppMessage({ show: true, message: "Patient added successfully", type: "success" });
                } else {
                    setAppMessage({ show: true, message: "Patient updated successfully", type: "success" });
                }
                navigate(`/facility/${facilityId}`);
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


    if (isLoading) {
        return <Loading />
    }


console.log("form values", state.form);
    return <div>

        <Grid container alignContent="center" justify="center">
            <Grid item xs={12} sm={10} md={8} lg={6} xl={4}>
                <Card>
                    <AppMessage open={showAppMessage.show} type={showAppMessage.type} message={showAppMessage.message} handleClose={() => setAppMessage({ show: false, message: "", type: "" })} handleDialogClose={() => setAppMessage({ show: false, message: "", type: "" })} />
                    <CardHeader title={headerText}/>
                    <form onSubmit={(e) => handleSubmit(e)}>
                        <CardContent>
                            <InputLabel id="name-label">Name*</InputLabel>
                            <TextInputField
                                name="name"
                                variant="outlined"
                                margin="dense"
                                type="text"
                                InputLabelProps={{ shrink: !!state.form.name }}
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
                                InputLabelProps={{ shrink: !!state.form.age }}
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
                                InputLabelProps={{ shrink: !!state.form.phone_number }}
                                value={state.form.phone_number}
                                onChange={handleChange}
                                errors={state.errors.phone_number}
                            />
                        </CardContent>
                        <CardContent>
                            <InputLabel id="contact-with-carrier-label">
                                Have you had contact with someone who was diagnosed with Covid 19?
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
                            <InputLabel id="med-history-label">Any medical history?*</InputLabel>
                            <ShowCheckboxOptions
                                values={state.form.medical_history}
                                options={MEDICAL_HISTORY_CHOICES}
                                onChange={(e: any) => handleCheckboxChange(e)}
                            />
                            <ErrorHelperText
                                error={state.errors.medical_history}
                            />
                        </CardContent>

                        <CardContent>
                            <InputLabel id="med-history-details-label">Medical History Details</InputLabel>
                            <MultilineInputField
                                rows={5}
                                name="medical_history_details"
                                variant="outlined"
                                margin="dense"
                                type="text"
                                InputLabelProps={{ shrink: !!state.form.medical_history_details }}
                                value={state.form.medical_history_details}
                                onChange={handleChange}
                                errors={state.errors.medical_history_details}
                            />
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
