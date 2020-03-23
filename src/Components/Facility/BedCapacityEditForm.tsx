import React, { useReducer } from 'react'
import { Grid, InputLabel, Select, Card, CardHeader, CardContent, MenuItem, Button } from '@material-ui/core'
import { TextInputField } from '../Common/HelperInputFields';
import bed_types from "../../Constants/Static_data/bed_types.json"

const initForm: any = {
    bedType: "",
    totalCapacity: "",
    currentOccupancy: ""
};
const initialState = {
    form: { ...initForm },
    errors: { ...initForm }
};
const bed_count_editreducer = (state = initialState, action: any) => {
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

export const BedCapacityEditForm = (props: any) => {
    const [state, dispatch] = useReducer(bed_count_editreducer, initialState)

    const handleChange = (e: any) => {
        let form = { ...state.form }
        form[e.target.name] = e.target.value
        dispatch({ type: "set_form", form })
    }

    const validateForm = () => {
        let errors = { ...initForm }
        let invalidForm = false
        Object.keys(state.form).map((field, i) => {
            if (!state.form[field].length && field !== "bedType") {
                errors[field] = "Field is required"
                invalidForm = true
            } else if (field == "bedType" && state.form[field] == "") {
                errors[field] = "Field is required"
                invalidForm = true
            }
            if(field == "totalCapacity" && state.form.totalCapacity =="" ){
                errors[field] = "Field is required"
                invalidForm = true;
            } else if(field == "totalCapacity" && isNaN(state.form.totalCapacity)){
                errors[field] = "Please enter a valid number"
                invalidForm = true;
            }
            if(field == "currentOccupancy" && state.form.currentOccupancy ==""){
                errors[field] = "Field is required"
                invalidForm = true;
            }else if(field == "currentOccupancy" && isNaN(state.form.currentOccupancy)){
                errors[field] = "Please enter a valid number"
                invalidForm = true;
            }
        })
        if (invalidForm) {
            dispatch({ type: "set_error", errors })
            return false
        }
        dispatch({ type: "set_error", errors})
        return true
    }

    const handleSubmit = (e: any) => { e.preventDefault()}
    const handleCancel = () => {}
    return <div>
        <Grid container alignContent="center" justify="center">
            <Grid item xs={12}>
                <Card>
                    <CardHeader title="Edit Bed Capacity" />
                    <form onSubmit={e => { handleSubmit(e) }}>
                        <CardContent>
                            <InputLabel id="demo-simple-select-outlined-label">Bed Type*</InputLabel>
                            <Select
                                fullWidth
                                labelId="demo-simple-select-outlined-label"
                                id="demo-simple-select-outlined"
                                name="bedType"
                                value={state.form.bed_type}
                                onChange={handleChange}
                                label="District"
                            >
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                {bed_types.map((bed_type) => {
                                    return <MenuItem key={bed_type.id.toString()} value={bed_type.id}>{bed_type.type}</MenuItem>
                                })}
                            </Select>
                            <span>{state.errors.bed_type}</span>
                        </CardContent>
                        <CardContent>
                            <InputLabel id="demo-simple-select-outlined-label">Total Capacity*</InputLabel>
                            <TextInputField
                                name="totalCapacity"
                                variant="outlined"
                                margin="dense"
                                type="number"
                                // InputLabelProps={{ shrink: !!form.registrationNumber }}
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
                                // InputLabelProps={{ shrink: !!form.registrationNumber }}
                                value={state.form.currentOccupancy}
                                onChange={handleChange}
                            errors={state.errors.currentOccupancy}
                            />
                        </CardContent>
                        <CardContent>
                        <Grid container justify="center" spacing={5} >
                            <Grid item>
                                <Button
                                    color="primary"
                                    variant="contained"
                                    type="submit"
                                    style={{ marginLeft: 'auto' }}
                                    onClick={(e) => handleSubmit(e)}
                                >Update</Button>
                            </Grid>
                            <Grid item>
                                <Button
                                    color="primary"
                                    variant="contained"
                                    style={{ marginLeft: 'auto' }}
                                    onClick={(e) => handleCancel()}
                                >Cancel</Button>
                            </Grid>
                        </Grid>
                        </CardContent>
                    </form>
                </Card>
            </Grid>
        </Grid>
    </div>
}