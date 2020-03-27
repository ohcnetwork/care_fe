import React, { useState, useReducer } from 'react';
import { useDispatch } from "react-redux";
import { Grid, InputLabel, Select, Card, CardActions, CardHeader, CardContent, MenuItem, Button } from '@material-ui/core';
import { ErrorHelperText, NativeSelectField, TextInputField } from "../Common/HelperInputFields";
import SaveIcon from '@material-ui/icons/Save';
import { navigate } from 'hookrouter';
import { BED_TYPES } from "./constants";
import AppMessage from "../Common/AppMessage";
import { Loading } from "../../Components/Common/Loading";
import { createCapacity } from "../../Redux/actions";

interface BedCapacityProps {
    facilityId: string;
    id?: string;
}

const initForm: any = {
    bedType: "",
    totalCapacity: "",
    currentOccupancy: ""
};
const initialState = {
    form: { ...initForm },
    errors: { ...initForm }
};
const bedCountReducer = (state = initialState, action: any) => {
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

export const BedCapacityForm = (props: BedCapacityProps) => {
    const [state, dispatch] = useReducer(bedCountReducer, initialState);
    const [showAppMessage, setAppMessage] = useState({ show: false, message: "", type: "" });
    const [isLoading, setIsLoading] = useState(false);
    const dispatchAction: any = useDispatch()
    const { facilityId, id } = props;
    const bedTypes = [{
        id: 0,
        text: 'Select',
    }, ...BED_TYPES]

    const headerText = !id ? "Add Bed Capacity" : "Edit Bed Capacity";
    const buttonText = !id ? "Save" : "Update";

    const handleChange = (e: any) => {
        let form = { ...state.form };
        form[e.target.name] = e.target.value;
        dispatch({ type: "set_form", form })
    };

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
            dispatch({ type: "set_error", errors });
            return false
        }
        dispatch({ type: "set_error", errors });
        return true
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        const valid = validateData();
        if (valid) {
            setIsLoading(true);
            const data = {
                "room_type": Number(state.form.bedType),
                "total_capacity": Number(state.form.totalCapacity),
                "current_capacity": Number(state.form.currentOccupancy),
            };
            const res = await dispatchAction(createCapacity(data, { facilityId }));
            setIsLoading(false);
            if (res.data) {
                dispatch({ type: "set_form", form: initForm })
                setAppMessage({ show: true, message: "Bed capacity added successfully", type: "success" })
                navigate(`/facility/${facilityId}/doctor`);
            } else {
                setAppMessage({ show: true, message: "Error", type: "error" })
            }
        }
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
                <Card style={{ marginTop: '20px' }}>
                    <AppMessage open={showAppMessage.show} type={showAppMessage.type} message={showAppMessage.message} handleClose={() => setAppMessage({ show: false, message: "", type: "" })} handleDialogClose={() => setAppMessage({ show: false, message: "", type: "" })} />
                    <CardHeader title={headerText} />
                    <form onSubmit={e => { handleSubmit(e) }}>
                        <CardContent>
                            <InputLabel id="demo-simple-select-outlined-label">Bed Type*</InputLabel>
                            <NativeSelectField
                                name="bedType"
                                variant="outlined"
                                value={state.form.bedType}
                                options={bedTypes}
                                onChange={handleChange}
                            />
                            <ErrorHelperText
                                error={state.errors.bedType}
                            />
                        </CardContent>
                        <CardContent>
                            <InputLabel id="demo-simple-select-outlined-label">Total Capacity*</InputLabel>
                            <TextInputField
                                name="totalCapacity"
                                variant="outlined"
                                margin="dense"
                                type="number"
                                InputLabelProps={{ shrink: !!state.form.totalCapacity }}
                                value={state.form.totalCapacity}
                                onChange={handleChange}
                                errors={state.errors.totalCapacity}
                            />
                        </CardContent>
                        <CardContent>
                            <InputLabel id="demo-simple-select-outlined-label">Currently Occupied*</InputLabel>
                            <TextInputField
                                name="currentOccupancy"
                                variant="outlined"
                                margin="dense"
                                type="number"
                                InputLabelProps={{ shrink: !!state.form.currentOccupancy }}
                                value={state.form.currentOccupancy}
                                onChange={handleChange}
                                errors={state.errors.currentOccupancy}
                            />
                        </CardContent>
                        <CardContent>
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
                                    onClick={(e) => handleSubmit(e)}
                                    startIcon={<SaveIcon>save</SaveIcon>}
                                >{buttonText}</Button>
                            </CardActions>
                        </CardContent>
                    </form>
                </Card>
            </Grid>
        </Grid>
    </div>
};
