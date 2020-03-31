import React, { useState, useReducer, useCallback, useEffect } from "react"
import { makeStyles, Theme } from '@material-ui/core/styles';
import { useDispatch } from "react-redux";
import { Grid, Card, CardHeader, CardContent, CardActions, Button, FormControl, InputLabel, NativeSelect, Typography, IconButton } from "@material-ui/core";
import { TextInputField, NativeSelectField, ErrorHelperText, MultilineInputField, } from "../Common/HelperInputFields";
import { navigate } from 'hookrouter';
import { Loading } from "../Common/Loading";
import { SAMPLE_TEST_STATUS, SAMPLE_TEST_RESULT, OptionsType } from "../../Common/constants";
import { createSampleTest, getSampleTest, patchSampleTest, getConsultationList } from "../../Redux/actions";
import { useAbortableEffect, statusType } from '../../Common/utils';
import * as Notification from '../../Utils/Notifications.js';
import ArrowBackIosOutlinedIcon from '@material-ui/icons/ArrowBackIosOutlined';

const initForm: any = {
    //status: "",
    //result: "",
    notes: "",
    //consultation: "",
};

const initialState = {
    form: { ...initForm },
    errors: { ...initForm }
};

// const initConsultationOptions = [{
//     id: 0,
//     text: "Please select a consultation",
// }]


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
    const dispatchAction: any = useDispatch();
    const { facilityId, patientId, id } = props;
    const [state, dispatch] = useReducer(sampleTestFormReducer, initialState);
    // const [consultationOptions, setConsultationOptions] = useState<Array<OptionsType>>(initConsultationOptions);
    const [isLoading, setIsLoading] = useState(false);


    const headerText = !id ? "Request Sample" : "Edit Sample Test";
    const buttonText = !id ? "Confirm your request to send sample for testing" : "Update";


    // const fetchConsultation = useCallback(async (status: statusType) => {
    //     const res = await dispatchAction(getConsultationList({
    //         patient: patientId
    //     }));
    //     if (!status.aborted) {
    //         if (res && res.data && res.data.results) {
    //             if (res.data.results.length === 0) {
    //                 Notification.Error({
    //                     msg: "Please add a consultation before adding a sample test"
    //                 });
    //                 navigate(`/facility/${facilityId}/patient/${patientId}/consultation`);
    //             } else {
    //                 setConsultationOptions([
    //                     ...initConsultationOptions,
    //                     ...res.data.results.map((i: ConsultationModal) => {
    //                         return {
    //                             id: i.id,
    //                             text: `${i.facility_name}-${i.suggestion}`
    //                         };
    //                     }),
    //                 ])
    //             }
    //         }
    //     }
    // }, [dispatchAction, facilityId, patientId]);

    const fetchData = useCallback(async (status: statusType) => {
        if (id) {
            setIsLoading(true);
            const res = await dispatchAction(getSampleTest(id, { patientId, id }));
            if (!status.aborted) {
                if (res && res.data) {
                    dispatch({
                        type: "set_form",
                        form: {
                            //status: res.data.status,
                            //result: res.data.result,
                            notes: res.data.result,
                            //consultation: res.data.consultation,
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
        //fetchConsultation(status)
    }, [dispatch, fetchData, patientId, id]);

    const validateForm = () => {
        let errors = { ...initForm };
        let invalidForm = false;
        Object.keys(state.form).forEach((field, i) => {
            switch (field) {
                case "notes":
                    if (!state.form[field]) {
                        errors[field] = "Field is required";
                        invalidForm = true;
                    }
                    break;
                // case "consultation":
                //     if (!Number(state.form[field])) {
                //         errors[field] = "Field is required";
                //         invalidForm = true;
                //     }
                //     return;
                default:
                    return
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
        // const validForm = validateForm();
        // if (validForm) {
        setIsLoading(true);
        const data = {
            //status: Number(state.form.status) ? Number(state.form.status) : undefined,
            //result: Number(state.form.result) ? Number(state.form.result) : undefined,
            notes: state.form.notes ? state.form.notes : undefined,
            //consultation: Number(state.form.consultation),
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
        }
        //}
    };

    const handleChange = (e: any) => {
        let form = { ...state.form };
        form[e.target.name] = e.target.value;
        dispatch({ type: "set_form", form })
    };

    const handleCancel = () => {
        navigate(`/facility/${facilityId}/patient/${patientId}`);
    };


    if (isLoading) {
        return <Loading />
    }

    return <div>
        <Grid container alignContent="center" justify="center">
            <Grid item xs={12} sm={10} md={8} lg={6} xl={4}>
                <Card className={classes.card}>
                    <CardHeader
                        avatar={
                            <IconButton onClick={handleCancel}>
                                <ArrowBackIosOutlinedIcon />
                            </IconButton>
                        }
                        title={<Typography variant="h5">{headerText}</Typography>}
                        disableTypography={true}
                    />
                    <form onSubmit={(e) => handleSubmit(e)}>
                        {/* <CardContent>
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
                        </CardContent> */}

                        <CardContent>
                            <InputLabel id="med-history-details-label">Notes (Optional)</InputLabel>
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

                        {/* <CardContent>
                            <InputLabel id="age-label">Consultation*</InputLabel>
                            <NativeSelectField
                                name="consultation"
                                variant="outlined"
                                value={state.form.consultation}
                                options={consultationOptions}
                                onChange={handleChange}
                            />
                            <ErrorHelperText
                                error={state.errors.consultation}
                            />
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
                        </CardContent> */}


                        <CardContent>
                            <Button
                                fullWidth
                                color="primary"
                                variant="contained"
                                type="submit"
                                onClick={(e) => handleSubmit(e)}
                            >
                                {buttonText}
                            </Button>
                        </CardContent>
                    </form>
                </Card>

            </Grid>
        </Grid>
    </div>
};
