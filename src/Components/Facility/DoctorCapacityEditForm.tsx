/* eslint-disable array-callback-return */
/* eslint-disable eqeqeq */
import React, { useReducer } from 'react'
import { Grid, InputLabel, Card, CardHeader, CardContent, Button } from '@material-ui/core'
import { TextInputField } from '../Common/HelperInputFields';
import { isEmpty } from 'lodash';

const initForm: any = {
    totalDoctors: "",
    currentAvailability: ""
};
const initialState = {
    form: { ...initForm },
    errors: { ...initForm }
};
const doctor_capacity_editreducer = (state = initialState, action: any) => {
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
        case "set_reset":{
            return {
                ...state,
                form:action.form
            }
        }    
        default:
            return state
    }
}

export const DoctorCapacityEditForm = (props: any) => {
    const [state, dispatch] = useReducer(doctor_capacity_editreducer, initialState)

    const handleChange = (e: any) => {
        let form = { ...state.form }
        form[e.target.name] = e.target.value
        dispatch({ type: "set_form", form })
    }

    const validateForm = () => {
        let errors = { ...initForm }
        let invalidForm = false
        Object.keys(state.form).map((field) => {
            if(field == "totalDoctors" && state.form.totalDoctors =="" ){
                errors[field] = "Field is required"
                invalidForm = true;
            } else if(field == "totalDoctors" && isNaN(state.form.totalDoctors)){
                errors[field] = "Please enter a valid number"
                invalidForm = true;
            }
            if(field == "currentAvailability" && state.form.currentAvailability ==""){
                errors[field] = "Field is required"
                invalidForm = true;
            }else if(field == "currentAvailability" && isNaN(state.form.currentAvailability)){
                errors[field] = "Please enter a valid number"
                invalidForm = true;
            }
            if(field == "currentAvailability" && !isEmpty(state.form.currentAvailability) 
                && state.form.currentAvailability>state.form.totalDoctors){
                errors[field] = "Current availability cannot be greater than Total"
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
    const handleCancel = (e: any) => {    
        const form={ ...initForm };
        dispatch({ type: "set_reset", form })};
    return <div>
        <Grid container alignContent="center" justify="center">
            <Grid item xs={12}>
                <Card>
                    <CardHeader title="Edit Doctor Capacity" />
                    <form onSubmit={e => { handleSubmit(e) }}>
                        <CardContent>
                            <InputLabel id="demo-simple-select-outlined-label">Total Number of Doctors</InputLabel>
                            <TextInputField
                                name="totalDoctors"
                                variant="outlined"
                                margin="dense"
                                type="number"
                                // InputLabelProps={{ shrink: !!form.registrationNumber }}
                                value={state.form.totalDoctors}
                                onChange={handleChange}
                                errors={state.errors.totalDoctors}
                            />
                        </CardContent>
                        <CardContent>
                            <InputLabel id="demo-simple-select-outlined-label">Doctors Available Currently</InputLabel>
                            <TextInputField
                                name="currentAvailability"
                                variant="outlined"
                                margin="dense"
                                type="number"
                                // InputLabelProps={{ shrink: !!form.registrationNumber }}
                                value={state.form.currentAvailability}
                                onChange={handleChange}
                            errors={state.errors.currentAvailability}
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
                                    onClick={handleCancel}
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