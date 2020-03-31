import React, { useState, useReducer, useCallback, useEffect } from "react"
import { makeStyles, Theme } from '@material-ui/core/styles';
import { useDispatch } from "react-redux";
import { Grid, Card, CardHeader, CardContent, CardActions, Button, FormControl, InputLabel } from "@material-ui/core";
import { TextInputField, NativeSelectField, ErrorHelperText, MultilineInputField, } from "../Common/HelperInputFields";
import { navigate } from 'hookrouter';
import { Loading } from "../Common/Loading";
import { SAMPLE_TEST_STATUS, SAMPLE_TEST_RESULT } from "../../Common/constants";
import { createSampleTest, getSampleTest, patchSampleTest } from "../../Redux/actions";
import { useAbortableEffect, statusType } from '../../Common/utils';
import * as Notification from '../../Utils/Notifications.js';


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

const optionalFields = [
    "status",
    "result",
    "notes"
];


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
    card: {
        padding: '16px'
    },
    buttonHolder: {
        padding: '0 16px 16px',
        justifyContent: 'space-between'
    }
}));

const statusTypes = [{
    id: 0,
    text: 'Select',
}, ...SAMPLE_TEST_STATUS]

const resultTypes = [{
    id: 0,
    text: 'Select',
}, ...SAMPLE_TEST_RESULT]


export const SampleTest = (props: any) => {
    const classes = useStyles();
    const dispatchAction: any = useDispatch();
    const { facilityId, patientId, id } = props;
    const [state, dispatch] = useReducer(sampleTestFormReducer, initialState);
    const [isLoading, setIsLoading] = useState(false);


    const headerText = !id ? "Add Sample Test" : "Edit Sample Test";
    const buttonText = !id ? "Save" : "Update";

    const fetchData = useCallback(async (status: statusType) => {
        if (id) {
            setIsLoading(true);
            const res = await dispatchAction(getSampleTest(id, { patientId, id }));
            if (!status.aborted) {
                if (res && res.data) {
                    dispatch({
                        type: "set_form",
                        form: {
                            status: res.data.status,
                            result: res.data.result,
                            notes: res.data.result,
                            consultation: res.data.consultation,
                        }
                    })
                } else {
                    navigate(`/facility/${facilityId}/patient/${patientId}`);
                }
            }
        }
        setIsLoading(false);
    }, [dispatchAction, facilityId, patientId, id]);

    useAbortableEffect((status: statusType) => {
        fetchData(status);
    }, [dispatch, fetchData, patientId, id]);



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
                "status": Number(state.form.status),
                "result": Number(state.form.result),
                "notes": state.form.notes,
                "consultation": Number(state.form.consultation),
            };

            const res = await dispatchAction(id ? patchSampleTest(id, data, { patientId }) : createSampleTest(data, { id, patientId }));
            setIsLoading(false);
            if (res && res.data) {
                dispatch({ type: "set_form", form: initForm })
                if (id) {
                    Notification.Success({
                        msg: "Sample test updated successfully"
                    });
                } else {
                    Notification.Success({
                        msg: "Sample test created successfully"
                    });
                    navigate(`/facility/${facilityId}/patient/${patientId}`);
                }
            } else {
                Notification.Error({
                    msg: "Error"
                });
            }
        }
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
                <Card className={classes.card}>
                    <CardHeader title={headerText} />
                    <form onSubmit={(e) => handleSubmit(e)}>
                        <CardContent>
                            <InputLabel id="demo-simple-select-outlined-label">Status</InputLabel>
                            <NativeSelectField
                                name="status"
                                variant="outlined"
                                value={state.form.status}
                                options={statusTypes}
                                onChange={handleChange}
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
                            <InputLabel id="age-label">Sample Number*</InputLabel>
                            <TextInputField
                                defaultValue={"1"}
                                name="consultation"
                                variant="outlined"
                                margin="dense"
                                type="number"
                                InputLabelProps={{ shrink: !!state.form.consultation }}
                                value={state.form.consultation}
                                onChange={handleChange}
                                errors={state.errors.consultation}
                            />
                        </CardContent>


                        <CardActions className={classes.buttonHolder}>
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
