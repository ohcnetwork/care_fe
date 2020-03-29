import React, { useState, useReducer, useCallback, useEffect} from "react"
import { makeStyles, Theme } from '@material-ui/core/styles';
import { useDispatch } from "react-redux";
import { Grid, Card, CardHeader, CardContent, CardActions, Button, FormControl, InputLabel } from "@material-ui/core";
import { TextInputField, NativeSelectField, ErrorHelperText, MultilineInputField, } from "../Common/HelperInputFields";
import { navigate } from 'hookrouter';
import { Loading } from "../Common/Loading";
import AppMessage from "../Common/AppMessage";
// import { PatientModal} from './models';
import { SAMPLE_TEST_STATUS, SAMPLE_TEST_RESULT } from "../../Common/constants";
// import { createPatient, getPatient, updatePatient } from "../../Redux/actions";

// interface SampleTestProps extends PatientModal {
    
// }

const initForm: any = {
    status: "",
    result: "",
    notes: "",
    consultation: "",
};

const initialState = {
    form: { ...initForm },
    errors: { ...initForm }
};

// const optionalFields = ["medical_history_details"];

const sampleTestFormReducer = (state = initialState, action: any) => {
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
    formControl: {
        margin: theme.spacing(1)
    },
    selectLabel: {
        background: 'white',
        padding: '2px 10px'
    },
    
}));

const statusTypes = [{
    id: 0,
    text: 'Select',
}, ...SAMPLE_TEST_STATUS]

const resultTypes = [{
    id: 0,
    text: 'Select',
}, ...SAMPLE_TEST_STATUS]


export const SampleTest = (props:any) => {
    const classes = useStyles();
    const dispatchAction: any = useDispatch();
    const { facilityId, id } = props;
    const [state, dispatch] = useReducer(sampleTestFormReducer, initialState);
    const [showAppMessage, setAppMessage] = useState({ show: false, message: "", type: "" });
    const [isLoading, setIsLoading] = useState(false);


    const headerText = !id ? "Add Sample Test" : "Edit Sample Test";
    const buttonText = !id ? "Save" : "Update";

    // const fetchData = useCallback(async () => {
    //     if (id) {
    //         setIsLoading(true);
    //         const res = await dispatchAction(getPatient({id}));
    //         if (res.data) {
    //             dispatch({ 
    //                     type: "set_form", 
    //                     form: {
    //                         name: res.data.name,
    //                         age: res.data.age,
    //                         gender: res.data.gender,
    //                         phone_number: res.data.phone_number,
    //                         medical_history: res.data.medical_history,
    //                         contact_with_carrier: `${res.data.contact_with_carrier}`,
    //                         medical_history_details: res.data.medical_history_details
    //                     }
    //                 })
    //         } else {
    //             navigate(`/facility/${facilityId}`);
    //         }
    //         setIsLoading(false);
    //     }
    // }, [dispatchAction, facilityId, id]);

    // useEffect(() => {
    //     fetchData();
    // }, [dispatch, fetchData, id]);



    // const validateForm = () => {
    //     let errors = { ...initForm };
    //     let invalidForm = false;
    //     Object.keys(state.form).forEach((field, i) => {
    //         if ((optionalFields.indexOf(field) === -1) && !state.form[field]) {
    //             errors[field] = "Field is required";
    //             invalidForm = true;
    //         }else if(field === 'medical_history' && state.form['medical_history'].length == 0){
    //             errors['medical_history'] = "Field is required";
    //             invalidForm = true;
    //         }else if (field === "phone_number" && !phonePreg(state.form[field])) {
    //             errors[field] = "Please Enter 10/11 digit mobile number or landline as 0<std code><phone number>";
    //             invalidForm = true;
    //         }
    //     });
    //     if (invalidForm) {
    //         dispatch({ type: "set_error", errors });
    //         return false
    //     }
    //     dispatch({ type: "set_error", errors });
    //     return true
    // };

    const handleSubmit = async(e: any) => {
        e.preventDefault();
        // const validForm = validateForm();
        // if (validForm) {
        //     setIsLoading(true);
        //     const data = {
        //         "name": state.form.name,
        //         "age": Number(state.form.age),
        //         "gender": Number(state.form.gender),
        //         "phone_number": state.form.phone_number,
        //         "medical_history": state.form.medical_history,
        //         "contact_with_carrier": JSON.parse(state.form.contact_with_carrier),
        //         "medical_history_details": state.form.medical_history_details,
        //         "is_active": true,
        //     };
            
        //     const res = await dispatchAction(id?updatePatient(data,{id}):createPatient(data));
        //     setIsLoading(false);
        //     if (res.data) {
        //         dispatch({ type: "set_form", form: initForm })
        //         if (!id) {
        //             setAppMessage({ show: true, message: "Patient added successfully", type: "success" });
        //         } else {
        //             setAppMessage({ show: true, message: "Patient updated successfully", type: "success" });
        //         }
        //         navigate(`/facility/${facilityId}`);
        //     } else {
        //         setAppMessage({ show: true, message: "Error", type: "error" })
        //     }
        // }
    };

    const handleChange = (e: any) => {
        let form = { ...state.form };
        form[e.target.name] = e.target.value;
        dispatch({ type: "set_form", form })
    };

    const handleCancel = () => {
        navigate(`/facility/${facilityId}`);
    };


    if (isLoading) {
        return <Loading />
    }

    return <div>

        <Grid container alignContent="center" justify="center">
            <Grid item xs={12} sm={10} md={8} lg={6} xl={4}>
                <Card>
                    <AppMessage open={showAppMessage.show} type={showAppMessage.type} message={showAppMessage.message} handleClose={() => setAppMessage({ show: false, message: "", type: "" })} handleDialogClose={() => setAppMessage({ show: false, message: "", type: "" })} />
                    <CardHeader title={headerText}/>
                    <form onSubmit={(e) => handleSubmit(e)}>
                        <CardContent>
                            <InputLabel id="demo-simple-select-outlined-label">Status</InputLabel>
                            <NativeSelectField
                                name="status"
                                variant="outlined"
                                value={state.form.status}
                                options={statusTypes}
                                onChange={handleChange}
                                disabled={!!id}
                            />
                            <ErrorHelperText
                                error={state.errors.status}
                            />
                        </CardContent>

                        <CardContent>
                            <InputLabel id="demo-simple-select-outlined-label">Result</InputLabel>
                            <NativeSelectField
                                name="result"
                                variant="outlined"
                                value={state.form.result}
                                options={resultTypes}
                                onChange={handleChange}
                                disabled={!!id}
                            />
                            <ErrorHelperText
                                error={state.errors.result}
                            />
                        </CardContent>

                        <CardContent>
                            <InputLabel id="med-history-details-label">Notes</InputLabel>
                            <MultilineInputField
                                rows={5}
                                name="notes"
                                variant="outlined"
                                margin="dense"
                                type="text"
                                InputLabelProps={{ shrink: !!state.form.notes }}
                                value={state.form.notes}
                                onChange={handleChange}
                                errors={state.errors.notes}
                            />
                        </CardContent>

                        <CardContent>
                            <InputLabel id="age-label">Consultation</InputLabel>
                            <TextInputField
                                name="consultation"
                                variant="outlined"
                                margin="dense"
                                type="number"
                                InputLabelProps={{ shrink: !!state.form.consultation}}
                                value={state.form.consultation}
                                onChange={handleChange}
                                errors={state.errors.consultation}
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
