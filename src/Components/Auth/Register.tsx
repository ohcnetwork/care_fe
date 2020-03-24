import React, { useState } from "react"
import { makeStyles } from "@material-ui/styles";
import { useDispatch } from "react-redux";
import { Grid, Card, CardHeader, CardContent, CardActions, Button, FormControl, InputLabel, Select, MenuItem } from "@material-ui/core";
import { TextInputField } from "../Common/HelperInputFields";
import { validateEmailAddress, phonePreg } from "../../Constants/common";
import districts from "../../Constants/Static_data/districts.json"
import gendorList from "../../Constants/Static_data/gender.json"
import { signupUser } from "../../Redux/actions";

const optionalFields = ["first_name", "last_name", "email", "skill", "district", "gender", "user_type"]

const useStyles = makeStyles(theme => ({
    formTop: {
        marginTop: '80px',
        marginBottom: "70px"
    },
    pdLogo: {
        height: '345px',
        border: 'solid 3px white'
    },
    formControl: {
        margin: "10px",
        minWidth: 120,
    },
}));


export const Register = () => {
    const classes = useStyles();
    const dispatch: any = useDispatch();

    const initForm: any = {
        username: '',
        first_name: "",
        last_name: "",
        email: "",
        user_type: 20,
        district: "",
        phone_number: "",
        gender: "",
        age: "",
        skill: "",
        password: '',
        c_password: '',
    };
    const initErr: any = {};
    const [form, setForm] = useState(initForm);
    const [errors, setErrors] = useState(initErr);

    const validateForm = () => {
        const oldError: any = {}
        let hasError: boolean = false
        Object.keys(form).map((field: string) => {
            if ((optionalFields.indexOf(field) === -1) && !form[field].length) {
                oldError[field] = "Field is required"
                hasError = true
            } else if (field === "username" && !form[field].match(/^[\w.@+-]+$/)) {
                oldError[field] = "Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only."
                hasError = true
            } else if (field === "email" && (form[field].length && !validateEmailAddress(form[field]))) {
                oldError[field] = "Please Enter a Valid Email Address"
                hasError = true
            } else if (field === "phone_number" && !phonePreg(form[field])) {
                oldError[field] = "Please Enter 10/11 digit mobile number or landline as 0<std code><phone number>"
                hasError = true
            } else if ((field === "district" || field === "gender") && form[field] === "") {
                oldError[field] = "Field is required"
                hasError = true
            } else if (field === "age" && isNaN(form[field])) {
                oldError[field] = "Please Enter Valid Age"
                hasError = true
            } else if ((field === "password" || field === "c_password") && form["password"] !== form["c_password"]) {
                oldError["c_password"] = "Password Mismatch"
                hasError = true
            }
        })

        if (hasError) {
            setErrors(oldError)
            return false
        }
        setErrors({})
        return true
    }

    const handleSubmit = (e: any) => {
        e.preventDefault()
        const validForm = validateForm()
        if (validForm) {
            dispatch(signupUser(form)).then((res: any) => {
                if(res.status === 201) {
                    window.location.href = "/login"
                } else {
                    const error = { ...errors }
                    Object.keys(res.data).map((field: string) => {
                        error[field] = res.data[field][0]
                        setErrors(error)
                    })
                }
            })
        }
    }

    const handleChange = (e: any) => {
        const { name, value } = e.target
        const formOld = { ...form }
        formOld[name] = value
        setForm(formOld)
    }

    return <div className={classes.formTop} >

        <Grid container justify="center">
            <Grid item xs={12} sm={5} md={4} lg={3}>

                <Card>
                    <CardHeader title="Register" />

                    <form onSubmit={(e) => handleSubmit(e)}>
                        <CardContent>
                            <TextInputField
                                name="username"
                                placeholder="User Name*"
                                variant="outlined"
                                margin="dense"
                                InputLabelProps={{ shrink: !!form.username }}
                                value={form.username}
                                onChange={handleChange}
                                errors={errors.username}
                            />

                            <TextInputField
                                name="first_name"
                                placeholder="First Name"
                                variant="outlined"
                                margin="dense"
                                value={form.first_name}
                                onChange={handleChange}
                                errors={errors.first_name}
                            />

                            <TextInputField
                                name="last_name"
                                placeholder="Last Name"
                                variant="outlined"
                                margin="dense"
                                value={form.last_name}
                                onChange={handleChange}
                                errors={errors.last_name}
                            />

                            <TextInputField
                                type="email"
                                name="email"
                                placeholder="Email Address"
                                variant="outlined"
                                margin="dense"
                                value={form.email}
                                onChange={handleChange}
                                errors={errors.email}
                            />

                            <TextInputField
                                type="tel"
                                name="phone_number"
                                placeholder="Phone Number*"
                                variant="outlined"
                                margin="dense"
                                value={form.phone_number}
                                onChange={handleChange}
                                errors={errors.phone_number}
                            />

                            <FormControl variant="outlined" className={classes.formControl}>
                                <InputLabel id="demo-simple-select-outlined-label">District*</InputLabel>
                                <Select
                                    fullWidth
                                    labelId="demo-simple-select-outlined-label"
                                    id="demo-simple-select-outlined"
                                    name="district"
                                    value={form.district}
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
                                <span>{errors.district}</span>
                            </FormControl>

                            <FormControl variant="outlined" className={classes.formControl}>
                                <InputLabel id="demo-simple-select-outlined-label">Gender*</InputLabel>
                                <Select
                                    fullWidth
                                    labelId="demo-simple-select-outlined-label"
                                    id="demo-simple-select-outlined"
                                    name="gender"
                                    value={form.gender}
                                    onChange={handleChange}
                                    label="Gender"
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {gendorList.map((gender) => {
                                        return <MenuItem key={gender.id} value={gender.id}>{gender.name}</MenuItem>
                                    })}
                                </Select>
                                <span>{errors.gender}</span>
                            </FormControl>

                            <TextInputField
                                type="tel"
                                name="age"
                                placeholder="Age*"
                                variant="outlined"
                                margin="dense"
                                value={form.age}
                                onChange={handleChange}
                                errors={errors.age}
                            />

                            <TextInputField
                                name="skill"
                                placeholder="Skill"
                                variant="outlined"
                                margin="dense"
                                InputLabelProps={{ shrink: !!form.skill }}
                                value={form.skill}
                                onChange={handleChange}
                                errors={errors.skill}
                            />

                            <TextInputField
                                type="password"
                                name="password"
                                placeholder="Password*"
                                variant="outlined"
                                margin="dense"
                                value={form.password}
                                onChange={handleChange}
                                errors={errors.password}
                            />

                            <TextInputField
                                type="password"
                                name="c_password"
                                placeholder="Confirm Password*"
                                variant="outlined"
                                margin="dense"
                                value={form.c_password}
                                onChange={handleChange}
                                errors={errors.c_password}
                            />
                        </CardContent>

                        <CardActions className="padding16">
                            {/*<A href="/forgot-password">Forgot password ?</A>*/}
                            <Button
                                color="primary"
                                variant="contained"
                                type="submit"
                                style={{ marginLeft: 'auto' }}
                                onClick={(e) => handleSubmit(e)}
                            >Register
                                </Button>
                        </CardActions>
                    </form>
                </Card>

            </Grid>
        </Grid>
    </div>
}