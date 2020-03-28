import React, { useState, useReducer, useEffect, useCallback } from 'react';
import { useDispatch } from "react-redux";
import { Grid, InputLabel, Card, CardHeader, CardContent, Button } from '@material-ui/core'
import { TextInputField, ErrorHelperText, NativeSelectField } from '../Common/HelperInputFields';
import { navigate } from 'hookrouter';
import { Loading } from "../../Components/Common/Loading";
import AppMessage from "../Common/AppMessage";
import { createDoctor, getDoctor } from "../../Redux/actions";
import SaveIcon from '@material-ui/icons/Save';
import { DoctorModal } from './modals';
import { DOCTOR_SPECIALIZATION } from './constants';

interface DoctorCapacityProps extends DoctorModal {
    facilityId: number;
}

const initForm: any = {
    area: "",
    count: ""
};
const initialState = {
    form: { ...initForm },
    errors: { ...initForm }
};
const doctorCapacityReducer = (state = initialState, action: any) => {
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
}

const doctorTypes = [{
    id: 0,
    text: 'Select',
}, ...DOCTOR_SPECIALIZATION];


export const DoctorCapacityForm = (props: DoctorCapacityProps) => {
    const dispatchAction: any = useDispatch();
    const { facilityId, id } = props;
    const [state, dispatch] = useReducer(doctorCapacityReducer, initialState);
    const [showAppMessage, setAppMessage] = useState({ show: false, message: "", type: "" });
    const [isLoading, setIsLoading] = useState(false);

    const headerText = !id ? "Add Doctor Capacity" : "Edit Doctor Capacity";
    const buttonText = !id ? "Save" : "Update";

    const fetchData = useCallback(async () => {
        if (id) {
            setIsLoading(true);
            const res = await dispatchAction(getDoctor(id, { facilityId }));
            if (res.data) {
                dispatch({ type: "set_form", form: { area: res.data.area, count: res.data.count } })
            } else {
                navigate(`/facility/${facilityId}`);
            }
            setIsLoading(false);
        }
    }, [dispatchAction, facilityId, id]);

    useEffect(() => {
        fetchData();
    }, [dispatch, fetchData, id]);

    const validateData = () => {
        let errors = { ...initForm };
        let invalidForm = false;
        Object.keys(state.form).forEach((field, i) => {
            if (!state.form[field]) {
                errors[field] = "Field is required";
                invalidForm = true;
            }
        });
        if (invalidForm) {
            dispatch({ type: "set_error", errors })
            return false;
        }
        dispatch({ type: "set_error", errors })
        return true;
    }

    const handleChange = (e: any) => {
        let form = { ...state.form };
        form[e.target.name] = e.target.value;
        dispatch({ type: "set_form", form });
    }

    const handleCancel = (e: any) => {
        const form = { ...initForm };
        dispatch({ type: "set_form", form })
        navigate(`/facility/${facilityId}`);
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        const valid = validateData();
        if (valid) {
            setIsLoading(true);
            const data = {
                "area": Number(state.form.area),
                "count": Number(state.form.count),
            };
            const res = await dispatchAction(createDoctor(id, data, { facilityId }));
            setIsLoading(false);
            if (res.data) {
                dispatch({ type: "set_form", form: initForm })
                if (!id) {
                    setAppMessage({ show: true, message: "Doctor count added successfully", type: "success" });
                } else {
                    setAppMessage({ show: true, message: "Doctor count updated successfully", type: "success" });
                }
                navigate(`/facility/${facilityId}`);
            } else {
                setAppMessage({ show: true, message: "Something went wrong..!", type: "error" })
            }
        }
    }

    if (isLoading) {
        return <Loading />
    }
    return <div>
        <Grid container alignContent="center" justify="center">
            <Grid item xs={12} sm={10} md={8} lg={6} xl={4}>
                <Card style={{ marginTop: '20px' }}>
                    <AppMessage open={showAppMessage.show} type={showAppMessage.type} message={showAppMessage.message} handleClose={() => setAppMessage({ show: false, message: "", type: "" })} handleDialogClose={() => setAppMessage({ show: false, message: "", type: "" })} />
                    <CardHeader title={headerText} />
                    <form onSubmit={e => { handleSubmit(e) }}>
                        <CardContent>
                            <InputLabel id="demo-simple-select-outlined-label">Area of specialization*</InputLabel>
                            <NativeSelectField
                                name="area"
                                variant="outlined"
                                value={state.form.area}
                                options={doctorTypes}
                                onChange={handleChange}
                            />
                            <ErrorHelperText
                                error={state.errors.area}
                            />
                        </CardContent>
                        <CardContent>
                            <InputLabel id="demo-simple-select-outlined-label">Count*</InputLabel>
                            <TextInputField
                                name="count"
                                variant="outlined"
                                margin="dense"
                                type="number"
                                InputLabelProps={{ shrink: !!state.form.count }}
                                value={state.form.count}
                                onChange={handleChange}
                                errors={state.errors.count}
                            />
                        </CardContent>
                        <CardContent>
                            <Grid container justify="space-between" spacing={5} >
                                <Grid item>
                                    <Button
                                        color="default"
                                        variant="contained"
                                        onClick={handleCancel}
                                    >Cancel</Button>
                                </Grid>
                                <Grid item>
                                    <Button
                                        color="primary"
                                        variant="contained"
                                        type="submit"
                                        startIcon={<SaveIcon>save</SaveIcon>}
                                        onClick={(e) => handleSubmit(e)}
                                    >{buttonText}</Button>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </form>
                </Card>
            </Grid>
        </Grid>
    </div>
}