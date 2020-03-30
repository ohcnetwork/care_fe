import React, { useState, useReducer, useCallback, useEffect} from "react"
import { makeStyles, Theme } from '@material-ui/core/styles';
import { useDispatch } from "react-redux";
import { Grid, Card, CardHeader, CardContent, CardActions, Button, FormControl, InputLabel, RadioGroup, Radio, FormControlLabel, Box } from "@material-ui/core";
import { TextInputField, NativeSelectField, ErrorHelperText, MultilineInputField, DateInputField } from "../Common/HelperInputFields";
import { navigate } from 'hookrouter';
import { Loading } from "../Common/Loading";
import AppMessage from "../Common/AppMessage";
import { ConsultationModal} from './models';
import { CONSULTATION_SUGGESTION } from "../../Common/constants";
import { createConsultation } from "../../Redux/actions";
import { useAbortableEffect, statusType } from '../../Common/utils';

// interface ConsultationProps extends ConsultationModal {
    
// }

const initForm: any = {
    suggestion: "",
    patient: "",
    facility: "",
    admitted: "",
    admission_date: "",
    discharge_date: "",
    referred_to: "",
    examination_details: "",
    existing_medication: "",
    prescribed_medication: "",
};

const initialState = {
    form: { ...initForm },
    errors: { ...initForm }
};

const optionalFields = [
    "admitted",
    "admission_date",
    "discharge_date",
    "referred_to",
    "examination_details",
    "existing_medication",
    "prescribed_medication",
];


const consultationFormReducer = (state = initialState, action: any) => {
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

const suggestionTypes = [{
    id: 0,
    text: 'Select',
}, ...CONSULTATION_SUGGESTION];


export const Consultation = (props:any) => {
    const classes = useStyles();
    const dispatchAction: any = useDispatch();
    const { facilityId, patientId, id } = props;
    const [state, dispatch] = useReducer(consultationFormReducer, initialState);
    const [showAppMessage, setAppMessage] = useState({ show: false, message: "", type: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDate, setSelectedDate] = React.useState(new Date());


    const headerText = !id ? "Add Consultation" : "Consultation";
    const buttonText = !id ? "Save" : "Update";

    // const fetchData = useCallback(async (status: statusType) => {
    //     if (id) {
    //         setIsLoading(true);
    //         const res = await dispatchAction(getSampleTest(id,{patientId,id}));
    //         if (!status.aborted) {
    //                 if (res.data) {
    //                     dispatch({
    //                         type: "set_form",
    //                         form: {
    //                             status: res.data.status,
    //                             result: res.data.result,
    //                             notes: res.data.result,
    //                             consultation: res.data.consultation,
    //                         }
    //                     })
    //                 } else {
    //                     navigate(`/facility/${facilityId}/patient/${patientId}`);
    //                 }
    //             }
    //         }
    //         setIsLoading(false);
    // }, [dispatchAction, facilityId, patientId, id]);

    // useAbortableEffect((status: statusType) => {
    //     fetchData(status);
    // }, [dispatch, fetchData, patientId, id]);



    const validateForm = () => {
        let errors = { ...initForm };
        let invalidForm = false;
        Object.keys(state.form).forEach((field, i) => {
            if ((optionalFields.indexOf(field) === -1) && !state.form[field]) {
                errors[field] = "Field is required";
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
                "examination_details": state.form.examination_details,
                "existing_medication": state.form.existing_medication,
                "prescribed_medication": state.form.prescribed_medication,
                "suggestion": state.form.suggestion,
                "admitted": JSON.parse(state.form.admitted),
                "admission_date": state.form.admission_date,
                "discharge_date": state.form.discharge_date,
                "patient": Number(state.form.patient),
                "facility": Number(state.form.facility),
                "referred_to": null || Number(state.form.referred_to),
            }
            
            console.log('data: ', data);
            const res = await dispatchAction(createConsultation(data));
            console.log('res: ', res);
            setIsLoading(false);
            if (res.data) {
                dispatch({ type: "set_form", form: initForm })
                if (id) {
                    setAppMessage({ show: true, message: "Sample test updated successfully", type: "success" });
                } else {
                    setAppMessage({ show: true, message: "Sample test created successfully", type: "success" });
                    navigate(`/facility/${facilityId}/patient/${patientId}`);
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

    const handleDateChange = (date:any, key:string) => {
        let form = { ...state.form };
        form[key] = date;
        dispatch({ type: "set_form", form })
        setSelectedDate(date);
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
                            <InputLabel id="demo-simple-select-outlined-label">Suggestion</InputLabel>
                            <NativeSelectField
                                name="suggestion"
                                variant="outlined"
                                value={state.form.suggestion}
                                options={suggestionTypes}
                                onChange={handleChange}
                            />
                            <ErrorHelperText
                                error={state.errors.suggestion}
                            />
                        </CardContent>

                        <CardContent>
                            <InputLabel id="facility-label">Facility</InputLabel>
                            <TextInputField
                                name="facility"
                                variant="outlined"
                                margin="dense"
                                type="number"
                                InputLabelProps={{ shrink: !!state.form.facility}}
                                value={facilityId}
                                onChange={handleChange}
                                errors={state.errors.facility}
                            />
                        </CardContent>

                        <CardContent>
                            <InputLabel id="patient-label">Patient Id</InputLabel>
                            <TextInputField
                                name="patient"
                                variant="outlined"
                                margin="dense"
                                type="number"
                                InputLabelProps={{ shrink: !!state.form.patient}}
                                value={state.form.patient}
                                onChange={handleChange}
                                errors={state.errors.patient}
                            />
                        </CardContent>

                        <CardContent>
                            <InputLabel id="admitted-label">
                                Admitted
                            </InputLabel>
                            <RadioGroup aria-label="covid" name="admitted" value={state.form.admitted} onChange={handleChange} style={{ padding: '0px 5px' }}>
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
                            <Grid container justify="space-between" alignItems="center" spacing={1}>
                                <Grid item xs={6}>
                                    <DateInputField
                                        label="Admission Date"
                                        value={state.form.admission_date?state.form.admission_date:selectedDate}
                                        onChange={(date)=>handleDateChange(date,'admission_date')}
                                        errors={state.errors.admission_date}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <DateInputField
                                        label="Discharge Date"
                                        value={state.form.discharge_date?state.form.discharge_date:selectedDate}
                                        onChange={(date)=>handleDateChange(date,'discharge_date')}
                                        errors={state.errors.discharge_date}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>

                        <CardContent>
                            <InputLabel id="existing-medication-label">Existing Medication</InputLabel>
                            <MultilineInputField
                                rows={5}
                                name="existing_medication"
                                variant="outlined"
                                margin="dense"
                                type="text"
                                InputLabelProps={{ shrink: !!state.form.existing_medication }}
                                value={state.form.existing_medication}
                                onChange={handleChange}
                                errors={state.errors.existing_medication}
                            />
                        </CardContent>

                        <CardContent>
                            <InputLabel id="exam-details-label">Examination Details</InputLabel>
                            <MultilineInputField
                                rows={5}
                                name="examination_details"
                                variant="outlined"
                                margin="dense"
                                type="text"
                                InputLabelProps={{ shrink: !!state.form.examination_details }}
                                value={state.form.examination_details}
                                onChange={handleChange}
                                errors={state.errors.examination_details}
                            />
                        </CardContent>

                        <CardContent>
                            <InputLabel id="prescribed-medication-label">Prescribed Medication</InputLabel>
                            <MultilineInputField
                                rows={5}
                                name="prescribed_medication"
                                variant="outlined"
                                margin="dense"
                                type="text"
                                InputLabelProps={{ shrink: !!state.form.prescribed_medication }}
                                value={state.form.prescribed_medication}
                                onChange={handleChange}
                                errors={state.errors.prescribed_medication}
                            />
                        </CardContent>

                        <CardContent>
                            <InputLabel id="refered-label">Referred To Facility</InputLabel>
                            <TextInputField
                                name="referred_to"
                                variant="outlined"
                                margin="dense"
                                type="number"
                                InputLabelProps={{ shrink: !!state.form.referred_to}}
                                value={state.form.referred_to}
                                onChange={handleChange}
                                errors={state.errors.referred_to}
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
