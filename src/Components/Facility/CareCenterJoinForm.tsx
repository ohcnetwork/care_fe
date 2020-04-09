import React, { useState, useReducer } from "react"
import { useDispatch } from "react-redux"
import { FormControl, Grid, Card, CardHeader, CardContent, Button, InputLabel, Select, MenuItem } from "@material-ui/core"
import { TextInputField, MultilineInputField, PhoneNumberField } from "../Common/HelperInputFields"
import Loader from "../Common/Loader"
import { FACILITY_TYPES, DISTRICT_CHOICES } from "../../Common/constants";
import { validateLocationCoordinates } from "../../Common/validation";
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { createFacility } from "../../Redux/actions";
import * as Notification from '../../Utils/Notifications.js';


const initForm: any = {
    name: "",
    district: "",
    address: "",
    centertype: "",
    phone_number: "",
    latitude: "",
    longitude: "",
};

const initialState = {
    form: { ...initForm },
    errors: { ...initForm },
};

const careCenterTypes = [
    ...FACILITY_TYPES.filter(i => i.id !== 2),
]

const CareCenterCreateReducer = (state = initialState, action: any) => {

    switch (action.type) {
        case "set_form": {

            return {
                ...state,
                form: action.form,
            }
        }

        case "set_error": {
            return {
                ...state,
                errors: action.errors,
            }

        }

        default:
            return state
    }
}

export const CareCenterJoinForm = () => {

    const dispatchAction: any = useDispatch()

    const [state, dispatch] = useReducer(CareCenterCreateReducer, initialState)
    const [loading, setLoading] = useState(false)

    const handleChange = (e: any) => {
        let form = { ...state.form }
        form[e.target.name] = e.target.value
        dispatch({ type: "set_form", form })
    };

    const handleValueChange = (value: any, name: string) => {
      const form = { ...state.form };
      form[name] = value;
      dispatch({ type: "set_form", form });
    };

    const validateForm = () => {
        const errors = { ...initForm }
        let invalidForm = false
        Object.keys(state.form).forEach(key => {
            if (!state.form[key]) {
                errors[key] = "Field is required";
                invalidForm = true;
            } else if (key === "phone_number") {
                const phoneNumber = parsePhoneNumberFromString(state.form[key]);
                if (!state.form[key] || !phoneNumber?.isPossible()) {
                    errors[key] = "Please enter valid phone number";
                    invalidForm = true;
                }
            } else if ((key === "latitude" || key === "longitude") && !validateLocationCoordinates(state.form[key])) {
                errors[key] = "Please enter valid coordinates";
                invalidForm = true;
            }
        })

        if (invalidForm) {
            dispatch({ type: "set_error", errors })
            return false;
        }
        dispatch({ type: "set_error", errors })
        return true;
    }

    const handleSubmit = async (e: any) => {
        e.preventDefault()
        const validated = validateForm()
        if (validated) {
            const data = {
                name: state.form.name,
                district: state.form.district,
                address: state.form.address,
                facility_type: state.form.centertype,
                phone_number: parsePhoneNumberFromString(state.form.phone_number)?.format('E.164'),
                location: state.form.latitude && state.form.latitude ? {
                    latitude: Number(state.form.latitude),
                    longitude: Number(state.form.latitude),
                } : undefined,
            }
            setLoading(true);
            const res = await dispatchAction(createFacility(data))
            setLoading(false);
            if (res && res.data) {
                dispatch({ type: "set_form", form: initForm })
                Notification.Success({
                    msg: "Care Center Added Successfully"
                });
            }
        }
    }

    return <div className="w3-content" style={{ maxWidth: '400px' }}>
        <div>
            <Loader open={loading} />
            <form onSubmit={(e) => handleSubmit(e)}>

                <Card>
                    <CardHeader title="Create Care Center" />
                    <CardContent>
                        <Grid item xs={12}>
                            <Grid container justify="center" style={{ marginBottom: '10px' }}>
                                <Grid item xs={12}>
                                    <TextInputField
                                        name="name"
                                        placeholder="Care Center Name*"
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
                                        <InputLabel id="care-center-type-label">Care Center Type*</InputLabel>
                                        <Select
                                            fullWidth
                                            labelId="care-center-type-label"
                                            id="care-center-type"
                                            name="centertype"
                                            value={state.form.centertype}
                                            onChange={handleChange}
                                            label="Care Center Type"
                                        >
                                            <MenuItem value="">
                                                <em>None</em>
                                            </MenuItem>
                                            {careCenterTypes.map(center_type => {
                                                return <MenuItem key={center_type.id.toString()} value={center_type.id}>{center_type.text}</MenuItem>
                                            })}
                                        </Select>
                                        <span className="error-text">{state.errors.district}</span>
                                    </FormControl>
                                </Grid>
                            </Grid>

                            <Grid container justify="center" >
                                <Grid item xs={12} style={{ marginBottom: '10px' }}>
                                    <FormControl fullWidth variant="outlined">
                                        <InputLabel id="pick-your-district-label">Pick Your District*</InputLabel>
                                        <Select
                                            fullWidth
                                            labelId="pick-your-district-label"
                                            id="pick-your-district"
                                            name="district"
                                            value={state.form.district}
                                            onChange={handleChange}
                                            label="Pick Your District"
                                        >
                                            <MenuItem value="">
                                                <em>None</em>
                                            </MenuItem>
                                            {DISTRICT_CHOICES.map(district => {
                                                return <MenuItem key={district.id.toString()} value={district.id}>{district.text}</MenuItem>
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
                                    <PhoneNumberField
                                        label="Emergency Contact Number*"
                                        value={state.form.phone_number}
                                        onChange={(value: any) => handleValueChange(value, 'phone_number')}
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
