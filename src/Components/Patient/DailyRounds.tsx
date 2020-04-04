import React, { useState, useReducer } from "react"
import { makeStyles, Theme } from '@material-ui/core/styles';
import { useDispatch } from "react-redux";
import { Grid, Card, CardHeader, CardContent, CardActions, Button, InputLabel } from "@material-ui/core";
import {
    TextInputField,
    MultilineInputField,
    DateInputField,
    SelectField, MultiSelectField, ErrorHelperText
} from "../Common/HelperInputFields";
import { navigate } from 'hookrouter';
import { Loading } from "../Common/Loading";
import AppMessage from "../Common/AppMessage";
import { createDailyReport } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications";
import { PATIENT_CATEGORY } from "../../Common/constants";


const initForm: any = {
    temperature: "",
    temperature_measured_at: null,
    physical_examination_info: "",
    other_details: "",
    category: ""
};

const categoryChoices = [
    {
        id: 0,
        text: "Select suspect category"
    },
    ...PATIENT_CATEGORY
];

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



export const DailyRounds = (props: any) => {
    const classes = useStyles();
    const dispatchAction: any = useDispatch();
    const { facilityId, patientId, id, consultationId } = props;
    const [state, dispatch] = useReducer(DailyRoundsFormReducer, initialState);
    const [showAppMessage, setAppMessage] = useState({ show: false, message: "", type: "" });
    const [isLoading, setIsLoading] = useState(false);


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


    const handleSubmit = async (e: any) => {
        e.preventDefault();
        const validForm = validateForm();
        if (validForm) {
            setIsLoading(true);
            const data = {
                "temperature": state.form.temperature,
                "temperature_measured_at": state.form.temperature_measured_at,
                "physical_examination_info": state.form.physical_examination_info,
                "other_details": state.form.other_details,
                "consultation": Number(consultationId),
                "patient_category": state.form.category
            };

            const res = await dispatchAction(createDailyReport(data, { consultationId }));
            setIsLoading(false);
            if (res && res.data) {
                dispatch({ type: "set_form", form: initForm });
                if (id) {
                    Notification.Success({
                        msg: "Daily round details updated successfully"
                    });
                } else {
                    Notification.Success({
                        msg: "Daily round details created successfully"
                    });
                    navigate(`/facility/${facilityId}/patient/${patientId}`);
                }
            }
        }
    };

    const handleChange = (e: any) => {
        const form = { ...state.form };
        const { name, value } = e.target;
        form[name] = value;
        dispatch({ type: "set_form", form });
    };

    const handleDateChange = (date: any, key: string) => {
        let form = { ...state.form };
        form[key] = date;
        dispatch({ type: "set_form", form });
    };

    const handleCancel = () => {
        navigate(`/facility/${facilityId}/patient/${patientId}`);
    };


    if (isLoading) {
        return <Loading />
    }

    return <div className="p-4 rounded-lg shadow border bg-white">
        <div>
            <AppMessage open={showAppMessage.show} type={showAppMessage.type} message={showAppMessage.message} handleClose={() => setAppMessage({ show: false, message: "", type: "" })} handleDialogClose={() => setAppMessage({ show: false, message: "", type: "" })} />
            <CardHeader title={headerText} />
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
                                label="Temperature Measured At"
                                margin="dense"
                                value={state.form.temperature_measured_at}
                                maxDate={new Date()}
                                onChange={date => handleDateChange(date, "temperature_measured_at")}
                                errors={state.errors.temperature_measured_at}
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
                    <InputLabel id="category-label">Category</InputLabel>
                    <SelectField
                        name="category"
                        variant="standard"
                        value={state.form.category}
                        options={categoryChoices}
                        onChange={handleChange}
                        errors={state.errors.category}
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
        </div>
    </div>
};
