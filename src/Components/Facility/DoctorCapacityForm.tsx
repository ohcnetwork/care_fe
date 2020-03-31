import React, { useState, useReducer, useEffect, useCallback } from 'react';
import { useDispatch } from "react-redux";
import { Grid, InputLabel, Card, CardHeader, CardContent, Button } from '@material-ui/core'
import { TextInputField, ErrorHelperText, NativeSelectField } from '../Common/HelperInputFields';
import { navigate } from 'hookrouter';
import { Loading } from "../../Components/Common/Loading";
import { createDoctor, getDoctor, listDoctor } from "../../Redux/actions";
import SaveIcon from '@material-ui/icons/Save';
import { DoctorModal, OptionsType } from './models';
import { useAbortableEffect, statusType } from '../../Common/utils';
import { DOCTOR_SPECIALIZATION } from '../../Common/constants';
import * as Notification from '../../Utils/Notifications.js';

interface DoctorCapacityProps extends DoctorModal {
    facilityId: number;
}

const initDoctorTypes: Array<OptionsType> = [{
    id: 0,
    text: 'Select',
}, ...DOCTOR_SPECIALIZATION];

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

export const DoctorCapacityForm = (props: DoctorCapacityProps) => {
    const dispatchAction: any = useDispatch();
    const { facilityId, id } = props;
    const [state, dispatch] = useReducer(doctorCapacityReducer, initialState);
    const [isLoading, setIsLoading] = useState(false);
    const [isLastOptionType, setIsLastOptionType] = useState(false);
    const [doctorTypes, setDoctorTypes] = useState<Array<OptionsType>>(initDoctorTypes);

    const headerText = !id ? "Add Doctor Capacity" : "Edit Doctor Capacity";
    const buttonText = !id ? `Save ${!isLastOptionType ? "& Add More" : ""}` : "Update";

    const fetchData = useCallback(async (status: statusType) => {
        setIsLoading(true);
        if (!id) {
            // Add Form functionality
            const doctorRes = await dispatchAction(listDoctor({}, { facilityId }));
            if (!status.aborted) {
                if (doctorRes && doctorRes.data) {
                    const existingData = doctorRes.data.results;
                    // redirect to listing page if all options are diabled
                    if (existingData.length === DOCTOR_SPECIALIZATION.length) {
                        navigate(`/facility/${facilityId}`);
                        return;
                    }
                    // disable existing doctor types
                    const updatedDoctorTypes = initDoctorTypes.map((type: OptionsType) => {
                        const isExisting = existingData.find((i: DoctorModal) => i.area === type.id);
                        return {
                            ...type,
                            disabled: !!isExisting,
                        }
                    });
                    setDoctorTypes(updatedDoctorTypes);
                }
            }
        } else {
            // Edit Form functionality
            const res = await dispatchAction(getDoctor(id, { facilityId }));
            if (res && res.data) {
                dispatch({ type: "set_form", form: { area: res.data.area, count: res.data.count } })
            } else {
                navigate(`/facility/${facilityId}`);
            }
        }
        setIsLoading(false);
    }, [dispatchAction, facilityId, id]);

    useAbortableEffect((status: statusType) => {
        fetchData(status);
    }, [dispatch, fetchData, id]);

    useEffect(() => {
        const lastDoctorType = doctorTypes.filter((i: OptionsType) => i.disabled).length === DOCTOR_SPECIALIZATION.length - 1;
        setIsLastOptionType(lastDoctorType);
    }, [doctorTypes]);

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
            if (res && res.data) {
                // disable last added bed type
                const updatedDoctorTypes = doctorTypes.map((type: OptionsType) => {
                    return {
                        ...type,
                        disabled: (res.data.area !== type.id) ? type.disabled : true,
                    }
                });
                setDoctorTypes(updatedDoctorTypes);
                // reset form
                dispatch({ type: "set_form", form: initForm });
                // show success message
                if (!id) {
                    Notification.Success({
                        msg: "Doctor count added successfully"
                    });
                    if (isLastOptionType) {
                        navigate(`/facility/${facilityId}`);
                    }
                } else {
                    Notification.Success({
                        msg: "Doctor count updated successfully"
                    });
                    navigate(`/facility/${facilityId}`);
                }
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
                                disabled={!!id}
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