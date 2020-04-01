import React, { useState, useReducer, useCallback, useEffect} from "react"
import { makeStyles, Theme } from '@material-ui/core/styles';
import { useDispatch } from "react-redux";
import { Grid, Card, CardHeader, CardContent, CardActions, Button, FormControl, InputLabel, RadioGroup, Radio, FormControlLabel, Box } from "@material-ui/core";
import { TextInputField, NativeSelectField, ErrorHelperText, MultilineInputField, DateInputField } from "../Common/HelperInputFields";
import { navigate } from 'hookrouter';
import { Loading } from "../Common/Loading";
import AppMessage from "../Common/AppMessage";
// import { DailyRoundsModel } from './models';
// import { CONSULTATION_SUGGESTION } from "../../Common/constants";
// import {  } from "../../Redux/actions";
import { useAbortableEffect, statusType } from '../../Common/utils';

// interface DailyRoundsProps extends DailyRoundsModal {
    
// }

const initForm: any = {
    temperature: "",
    temperature_measured_at:"",
    physical_examination_info:"",
    other_details:"",
    consultation:"",
};

const initialState = {
    form: { ...initForm },
    errors: { ...initForm }
};

const optionalFields = [
    "temperature_measured_at",
    "physical_examination_info",
    "other_details"
];


const DailyRoundsFormReducer = (state = initialState, action: any) => {
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



export const DailyRounds = (props:any) => {
    const classes = useStyles();
    const dispatchAction: any = useDispatch();
    const { facilityId, patientId, id } = props;
    const [state, dispatch] = useReducer(DailyRoundsFormReducer, initialState);
    const [showAppMessage, setAppMessage] = useState({ show: false, message: "", type: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDate, setSelectedDate] = React.useState(new Date());


    const headerText = !id ? "Add Daily Rounds" : "Edit Daily Rounds";
    const buttonText = !id ? "Save" : "Update";


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
                "temperature": state.form.temperature,
                "temperature_measured_at": state.form.temperature_measure_at,
                "physical_examination_info": state.form.physical_examination_info,
                "other_details": state.form.other_details,
                "consultation": Number(state.form.consultation)
            }
            
            console.log('data: ', data);
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
                            <Grid container justify="space-between" alignItems="center" spacing={1}>
                                <Grid item xs={6} md={6}>
                                    <InputLabel id="temperature-label">Temperature*</InputLabel>
                                    <TextInputField
                                        name="temperature"
                                        variant="outlined"
                                        margin="dense"
                                        type="text"
                                        InputLabelProps={{ shrink: !!state.form.temperature }}
                                        value={state.form.temperature}
                                        onChange={handleChange}
                                        errors={state.errors.temperature}
                                    />
                                </Grid>
                                <Grid item xs={6} md={6}>
                                    <DateInputField
                                        label="Temperature Measure At"
                                        value={state.form.temperature_measure_at?state.form.temperature_measure_at:selectedDate}
                                        onChange={(date)=>handleDateChange(date,'temperature_measure_at')}
                                        errors={state.errors.temperature_measure_at}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>

                        <CardContent>
                            <InputLabel id="physical-examination-info-label">Physical Examination Info</InputLabel>
                            <MultilineInputField
                                rows={5}
                                name="physical_examination_info"
                                variant="outlined"
                                margin="dense"
                                type="text"
                                InputLabelProps={{ shrink: !!state.form.physical_examination_info }}
                                value={state.form.physical_examination_info}
                                onChange={handleChange}
                                errors={state.errors.physical_examination_info}
                            />
                        </CardContent>

                        <CardContent>
                            <InputLabel id="other-details-label">Other Details</InputLabel>
                            <MultilineInputField
                                rows={5}
                                name="other_details"
                                variant="outlined"
                                margin="dense"
                                type="text"
                                InputLabelProps={{ shrink: !!state.form.other_details }}
                                value={state.form.other_details}
                                onChange={handleChange}
                                errors={state.errors.other_details}
                            />
                        </CardContent>

                        <CardContent>
                            <InputLabel id="consultation-label">Consultation Id</InputLabel>
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
