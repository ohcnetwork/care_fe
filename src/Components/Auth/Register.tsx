import React, { useState } from "react"
import { makeStyles, Theme } from '@material-ui/core/styles';
import { useDispatch } from "react-redux";
import {
    Grid,
    Card,
    CardHeader,
    CardContent,
    CardActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from "@material-ui/core";
import { TextInputField } from "../Common/HelperInputFields";
import { validateEmailAddress, phonePreg } from "../../Constants/common";
import districts from "../../Constants/Static_data/districts.json"
import gendorList from "../../Constants/Static_data/gender.json"
import { signupUser } from "../../Redux/actions";
import ReCaptcha from "react-google-recaptcha";

const optionalFields = ["first_name", "last_name", "email", "skill", "district", "gender", "user_type"];

const useStyles = makeStyles((theme: Theme) => ({
    formTop: {
        marginTop: '80px',
        marginBottom: "70px"
    },
    pdLogo: {
        height: '345px',
        border: 'solid 3px white'
    },
    cardActions: {
        padding: 0,
        paddingTop: 16
    }
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
        password: '',
        c_password: '',
    };
    const initErr: any = {};
    const [form, setForm] = useState(initForm);
    const [errors, setErrors] = useState(initErr);
    const [isCaptchaEnabled, setCaptcha] = useState(false);
    
    const validateForm = () => {
        const oldError: any = {};
        let hasError: boolean = false;
        Object.keys(form).map((field: string) => {
            if ((optionalFields.indexOf(field) === -1) && !form[field].length) {
                oldError[field] = "Field is required";
                hasError = true
            } else if (field === "username" && !form[field].match(/^[\w.@+-]+$/)) {
                oldError[field] = "Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.";
                hasError = true
            } else if (field === "email" && (form[field].length && !validateEmailAddress(form[field]))) {
                oldError[field] = "Please Enter a Valid Email Address";
                hasError = true
            } else if (field === "phone_number" && !phonePreg(form[field])) {
                oldError[field] = "Please Enter 10/11 digit mobile number or landline as 0<std code><phone number>";
                hasError = true
            } else if ((field === "district" || field === "gender") && form[field] === "") {
                oldError[field] = "Field is required";
                hasError = true
            } else if (field === "age" && isNaN(form[field])) {
                oldError[field] = "Please Enter Valid Age";
                hasError = true
            } else if ((field === "password" || field === "c_password") && form["password"] !== form["c_password"]) {
                oldError["c_password"] = "Password Mismatch";
                hasError = true
            }
        });

        if (hasError) {
            setErrors(oldError);
            return false
        }
        setErrors({});
        return true
    };

    const handleSubmit = (e: any) => {
        e.preventDefault();
        const validForm = validateForm();
        if (validForm && isCaptchaEnabled) {
            dispatch(signupUser(form)).then((res: any) => {
                if(res.status === 201) {
                    window.location.href = "/login"
                } else {
                    const error = { ...errors };
                    Object.keys(res.data).map((field: string) => {
                        error[field] = res.data[field][0];
                        setErrors(error)
                    });
                    setCaptcha(false);
                }
            });
        }
    };

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        const formOld = { ...form };
        formOld[name] = value;
        setForm(formOld)
    };

    const onCaptchaChange = (value: any) => {
        if (value) {
            setCaptcha(true);
        } else {
            setCaptcha(false);
        }
    }

    return (
        <div className={classes.formTop}>
            <Grid container justify="center">
                <Grid item xs={12} sm={5} md={5} lg={3}>
                    <Card>
                        <CardHeader title="Register" />
                        <form onSubmit={(e) => handleSubmit(e)}>
                            <CardContent>
                                <TextInputField
                                    name="username"
                                    label="User Name*"
                                    placeholder=""
                                    variant="outlined"
                                    margin="dense"
                                    InputLabelProps={{ shrink: !!form.username }}
                                    value={form.username}
                                    onChange={handleChange}
                                    errors={errors.username}
                                />
                                <TextInputField
                                    name="first_name"
                                    label="First Name"
                                    placeholder=""
                                    variant="outlined"
                                    margin="dense"
                                    value={form.first_name}
                                    onChange={handleChange}
                                    errors={errors.first_name}
                                />
                                <TextInputField
                                    name="last_name"
                                    label="Last Name"
                                    placeholder=""
                                    variant="outlined"
                                    margin="dense"
                                    value={form.last_name}
                                    onChange={handleChange}
                                    errors={errors.last_name}
                                />
                                <TextInputField
                                    type="email"
                                    name="email"
                                    label="Email Address"
                                    placeholder=""
                                    variant="outlined"
                                    margin="dense"
                                    value={form.email}
                                    onChange={handleChange}
                                    errors={errors.email}
                                />
                                <TextInputField
                                    type="tel"
                                    name="phone_number"
                                    label="Phone Number*"
                                    placeholder=""
                                    variant="outlined"
                                    margin="dense"
                                    value={form.phone_number}
                                    onChange={handleChange}
                                    errors={errors.phone_number}
                                />
                                <Grid container justify="space-between" alignItems="center" spacing={1} style={{marginTop:'5px'}}>
                                    <Grid item xs={6}>
                                        <FormControl fullWidth variant="outlined">
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
                                            <span className="w3-text-red">{errors.district}</span>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <FormControl fullWidth variant="outlined">
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
                                            <span className="w3-text-red">{errors.gender}</span>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                                <TextInputField
                                    type="tel"
                                    name="age"
                                    label="Age*"
                                    placeholder=""
                                    variant="outlined"
                                    margin="dense"
                                    value={form.age}
                                    onChange={handleChange}
                                    errors={errors.age}
                                />
                                <TextInputField
                                    type="password"
                                    name="password"
                                    label="Password*"
                                    placeholder=""
                                    variant="outlined"
                                    margin="dense"
                                    value={form.password}
                                    onChange={handleChange}
                                    errors={errors.password}
                                />
                                <TextInputField
                                    type="password"
                                    name="c_password"
                                    label="Confirm Password*"
                                    placeholder=""
                                    variant="outlined"
                                    margin="dense"
                                    value={form.c_password}
                                    onChange={handleChange}
                                    errors={errors.c_password}
                                />
                                <CardActions className={classes.cardActions}>
                                    {/*<A href="/forgot-password">Forgot password ?</A>*/}
                                    <ReCaptcha
                                        // For production
                                        sitekey="6Lcwm-QUAAAAAB7RjVwBLGSYt3bXtmjtP_9qplfV"
                                        // For development
                                        // sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                                        onChange={onCaptchaChange}
                                    /> 
                                    <Button
                                        color="primary"
                                        variant="contained"
                                        type="submit"
                                        style={{ marginLeft: 'auto' }}
                                        onClick={(e) => handleSubmit(e)}
                                    >
                                        Register
                                    </Button>
                                </CardActions>
                            </CardContent>
                        </form>
                    </Card>

                </Grid>
            </Grid>
        </div>
    );
};
