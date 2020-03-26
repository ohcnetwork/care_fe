import React, { useState, useReducer } from "react"
import { useDispatch } from "react-redux"
import { FormControl, Grid, Card, CardHeader, CardContent, Button, InputLabel, Select, MenuItem } from "@material-ui/core"
import { TextInputField, MultilineInputField } from "../Common/HelperInputFields"
import Loader from "../Common/Loader"
import AppMessage from "../Common/AppMessage"
import { makeStyles } from "@material-ui/styles";

import care_center_type from "../../Constants/Static_data/care_center_type.json";
import districts from "../../Constants/Static_data/districts.json"
import { validateLocationCoordinates, phonePreg } from "../../Constants/common";
import { createCenter } from "../../Redux/actions";


const initForm: any = {
    name: "",
    district: "",
    address: "",
    phone_number: "",
    latitude: "",
    longitude: "",
};

const initialState = {
    form: { ...initForm },
    errors: { ...initForm }
};

const useStyles = makeStyles(theme => ({
    formTop: {
        marginTop: '100px',
    },
    pdLogo: {
        height: '345px',
        border: 'solid 3px white'
    },
    selectEmpty: {
        marginTop: "10px",
    },
}));

const CareCenterCreateReducer = (state = initialState, action: any) => {

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

export const CareCenterJoinForm = () => {

    const dispatchAction: any = useDispatch()

    const classes = useStyles();

    const [state, dispatch] = useReducer(CareCenterCreateReducer, initialState)
    const [showAppMessage, setAppMessage] = useState({ show: false, message: "", type: "" })
    const [loading, setLoading] = useState(false)

    const handleChange = (e: any) => {
        let form = { ...state.form }

        form[e.target.name] = e.target.value

        dispatch({ type: "set_form", form })
    }

    const validateForm = () => {
        let errors = { ...initForm }
        let invalidForm = false
        Object.keys(state.form).map((field, i) => {
            if (!state.form[field].length && field !== "district") {
                errors[field] = "Field is required"
                invalidForm = true
            } else if (field == "district" && state.form[field] == "") {
                errors[field] = "Field is required"
                invalidForm = true
            }
            if (field == "phone_number" && !phonePreg(state.form.phone_number)) {
                errors[field] = "Please Enter 10/11 digit mobile number or landline as 0<std code><phone number>"
                invalidForm = true
            }
            if ((field == "latitude" || field == "longitude") && !validateLocationCoordinates(state.form[field])) {
                errors[field] = "Please enter valid coordinates"
                invalidForm = true
            }
        })

        if (invalidForm) {
            dispatch({ type: "set_error", errors })
            return false
        }
        dispatch({ type: "set_error", errors })
        return true
    }

    const handleSubmit = (e: any) => {
        e.preventDefault()
        const validated = validateForm()
        if (validated) {
            setLoading(true)
            let data = { ...state.form }
            data.location = {
                "latitude": data.latitude,
                "longitude": data.longitude,
            }
            delete data.latitude
            delete data.longitude
            dispatchAction(createCenter(data)).then((res: any) => {
                if (res.data) {
                    setLoading(false)
                    dispatch({ type: "set_form", form: initForm })
                    setAppMessage({ show: true, message: "Care Center Added Successfully", type: "success" })
                }
            })
        }
    }

    return <div className="w3-content" style={{ maxWidth: '400px' }}>
        <div>
            <Loader open={loading} />
            <form onSubmit={(e) => handleSubmit(e)}>

                <Card>
                    <AppMessage open={showAppMessage.show} type={showAppMessage.type} message={showAppMessage.message} handleClose={() => setAppMessage({ show: false, message: "", type: "" })} handleDialogClose={() => null} />
                    <CardHeader title="Create Care Center" />
                    <CardContent>
                        <Grid item xs={12}>
                            <Grid container justify="center" style={{ marginBottom: '10px' }}>
                                <Grid item xs={12}>
                                    <TextInputField
                                        name="name"
                                        placeholder="Care Center Name"
                                        variant="outlined"
                                        margin="dense"
                                        value={state.form.name}
                                        onChange={handleChange}
                                        errors={state.errors.name}
                                    />
                                </Grid>
                            </Grid>

                            <Grid container justify="center" >
                                <Grid item xs={12} style={{ marginBottom: '10px' }}>
                                    <FormControl fullWidth variant="outlined">
                                        <InputLabel id="demo-simple-select-outlined-label">Care Center Type*</InputLabel>
                                        <Select
                                            fullWidth
                                            labelId="demo-simple-select-outlined-label"
                                            id="demo-simple-select-outlined"
                                            name="care_center_type"
                                            value={state.form.district}
                                            onChange={handleChange}
                                            label="Care Center Type"
                                        >
                                            <MenuItem value="">
                                                <em>None</em>
                                            </MenuItem>
                                            {care_center_type.map((center_type) => {
                                                return <MenuItem key={center_type.id.toString()} value={center_type.id}>{center_type.name}</MenuItem>
                                            })}
                                        </Select>
                                        <span className="error-text">{state.errors.district}</span>
                                    </FormControl>
                                </Grid>
                            </Grid>

                            <Grid container justify="center" >
                                <Grid item xs={12} style={{ marginBottom: '10px' }}>
                                    <FormControl fullWidth variant="outlined">
                                        <InputLabel id="demo-simple-select-outlined-label">Pick Your District*</InputLabel>
                                        <Select
                                            fullWidth
                                            labelId="demo-simple-select-outlined-label"
                                            id="demo-simple-select-outlined"
                                            name="district"
                                            value={state.form.district}
                                            onChange={handleChange}
                                            label="District"
                                        >
                                            <MenuItem value="">
                                                <em>None</em>
                                            </MenuItem>
                                            {districts.map((district) => {
                                                return <MenuItem key={district.id.toString()} value={district.id}>{district.name}</MenuItem>
                                            })}
                                        </Select>
                                        <span className="error-text">{state.errors.district}</span>
                                    </FormControl>
                                </Grid>
                            </Grid>


                            <Grid container justify="center" >
                                <Grid item xs={12}>
                                    <MultilineInputField
                                        name="address"
                                        placeholder="Center Address*"
                                        variant="outlined"
                                        margin="dense"
                                        value={state.form.address}
                                        onChange={handleChange}
                                        errors={state.errors.address}
                                    />
                                </Grid>
                            </Grid>

                            <Grid container justify="center" >
                                <Grid item xs={12}>
                                    <TextInputField
                                        name="phone_number"
                                        placeholder="Emergency Contact Number*"
                                        variant="outlined"
                                        margin="dense"
                                        value={state.form.phone_number}
                                        onChange={handleChange}
                                        errors={state.errors.phone_number}
                                    />
                                </Grid>
                            </Grid>

                            <Grid container justify="center" >
                                <Grid item xs={12}>
                                    <TextInputField
                                        name="latitude"
                                        placeholder="Latitude*"
                                        variant="outlined"
                                        margin="dense"
                                        value={state.form.latitude}
                                        onChange={handleChange}
                                        errors={state.errors.latitude}
                                    />
                                </Grid>
                            </Grid>

                            <Grid container justify="center" >
                                <Grid item xs={12}>
                                    <TextInputField
                                        name="longitude"
                                        placeholder="Longitude*"
                                        variant="outlined"
                                        margin="dense"
                                        value={state.form.longitude}
                                        onChange={handleChange}
                                        errors={state.errors.longitude}
                                    />
                                </Grid>
                            </Grid>

                            <Grid container justify="center" spacing={5} style={{ marginTop: '10px' }}>
                                <Grid item>
                                    <Button
                                        color="primary"
                                        variant="contained"
                                        type="submit"
                                        style={{ marginLeft: 'auto' }}
                                        onClick={(e) => handleSubmit(e)}
                                    >Add</Button>
                                </Grid>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </form>
        </div>
    </div >
}
