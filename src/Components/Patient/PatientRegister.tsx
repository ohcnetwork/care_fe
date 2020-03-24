import React, { useState } from "react"
import { makeStyles, Theme } from '@material-ui/core/styles';
import { useDispatch } from "react-redux";
import { Box, Grid, Checkbox, Card, CardHeader, CardContent, CardActions, Button, FormControl, InputLabel, Select, MenuItem, Typography, FormLabel, RadioGroup, Radio, FormControlLabel } from "@material-ui/core";
import { TextInputField } from "../Common/HelperInputFields";
import { validateEmailAddress, phonePreg } from "../../Constants/common";
// import {  } from "../../Redux/actions";
import genderList from "../../Constants/Static_data/gender.json";
import { isEmpty } from "lodash";


const useStyles = makeStyles((theme: Theme) => ({
    formTop: {
        marginTop: '80px',
        marginBottom: "70px"
    },
    formControl: {
        margin: theme.spacing(1)
    },
    selectLabel: {
        background: 'white',
        padding: '2px 10px'
    },
    checkBoxLabel: {
        marginLeft: '8px'
    },
}));


export const PatientRegister = () => {
    const classes = useStyles();
    const dispatch: any = useDispatch();
    const inputLabel = React.useRef<HTMLLabelElement>(null);

    const initForm: any = {
        pName: "",
        age: "",
        gender: "",
        mobileNo: "",
        hadContactCovid: "false",
        covidDetails: "",
        diabetes: false,
        diabetesDetails: "",
        heartDisease: false,
        heartDiseaseDetails: "",
        hyperTension: false,
        hyperTensionDetails: "",
        kidneyDiseases: false,
        kidneyDiseasesDetails: ""
    };
    const initErr: any = {};
    const [form, setForm] = useState(initForm);
    const [errors, setErrors] = useState(initErr);

    const validateForm = () => {
        const err: any = {};
        Object.keys(form).forEach(key => {
            const value = form[key];
            switch (key) {
                case "pName":
                    !value && (err[key] = "This field is required");
                    break;
                case "age":
                    !value && (err[key] = "This field is required");
                    break;
                case "gender":
                    !value && (err[key] = "This field is required");
                    break;
                case "mobileNo":
                    if (!value) {
                        err[key] = "This field is required";
                    } else if (value && !(/^[0-9]{10}$/.test(value))) {
                        err[key] = "Invalid phone number";
                    }
                    break;
                case "covidDetails":
                    if (form.hadContactCovid === "true" && !value) {
                        err[key] = "please fill the details";
                    }
                    break;
                case "diabetesDetails":
                    if (form.diabetes && !value) {
                        err[key] = "please fill the details";
                    }
                    break;
                case "heartDiseaseDetails":
                    if (form.heartDisease && !value) {
                        err[key] = "please fill the details";
                    }
                    break;
                case "hyperTensionDetails":
                    if (form.hyperTension && !value) {
                        err[key] = "please fill the details";
                    }
                    break;
                case "kidneyDiseasesDetails":
                    if (form.kidneyDiseases && !value) {
                        err[key] = "please fill the details";
                    }
                    break;
                default:
                    break;
            }
        });
        if (!isEmpty(err)) {
            setErrors(err);
            return false;
        }
        setErrors({});
        return true;
    };

    const handleSubmit = (e: any) => {
        e.preventDefault()
        const validForm = validateForm();
        if (validForm) {
            console.log('form', form);
        }
    }

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        const formValues = { ...form };
        const errorField = Object.assign({}, errors);
        if (errorField[name]) {
            errorField[name] = null;
            setErrors(errorField);
        }
        formValues[name] = value;
        setForm(formValues)
    }
    const handleCheckboxFieldChange = (e: any) => {
        const { checked, name } = e.target;
        const fieldValue = Object.assign({}, form);
        fieldValue[name] = checked;
        setForm(fieldValue);
    };

    return <div className={classes.formTop} >

        <Grid container justify="center">
            <Grid item xs={12} sm={5} md={4} lg={3}>

                <Card>
                    <CardHeader title="Patient Register" />

                    <form onSubmit={(e) => handleSubmit(e)}>
                        <CardContent>
                            <TextInputField
                                name="pName"
                                label="Patient Name*"
                                placeholder=""
                                variant="outlined"
                                margin="dense"
                                InputLabelProps={{ shrink: !!form.pName }}
                                value={form.pName}
                                onChange={handleChange}
                                errors={errors.pName}
                            />

                            <TextInputField
                                type="tel"
                                name="mobileNo"
                                label="Mobile Number*"
                                placeholder=""
                                variant="outlined"
                                margin="dense"
                                value={form.mobileNo}
                                onChange={handleChange}
                                errors={errors.mobileNo}
                            />
                            <Box display="flex" flexDirection="row" justifyItems="space-between" alignItems="center">
                                <div>
                                <TextInputField
                                    type="number"
                                    name="age"
                                    label="Age*"
                                    placeholder=""
                                    variant="outlined"
                                    margin="dense"
                                    value={form.age}
                                    onChange={handleChange}
                                    errors={errors.age}
                                />
                                </div>
                                <FormControl variant="outlined" fullWidth margin="dense"
                                    className={classes.formControl}>
                                    <InputLabel className={classes.selectLabel} ref={inputLabel} id="genderLabel">
                                        Gender
                                    </InputLabel>
                                    <Select
                                        labelId="genderLabel"
                                        id="gender"
                                        name="gender"
                                        value={form.gender}
                                        onChange={handleChange}
                                        fullWidth
                                    >
                                        <MenuItem value="">
                                            <em>None</em>
                                        </MenuItem>
                                        {genderList.map((gender) => {
                                            return <MenuItem key={gender.id} value={gender.id}>{gender.name}</MenuItem>
                                        })}
                                    </Select>
                                    <span className="error-text">{errors.gender}</span>
                                </FormControl>
                            </Box>

                            <Box display="flex" flexDirection="column">
                                <Typography>
                                    Have you had contact with someone who was diagnosed with Covid 19?
                                </Typography>
                                <RadioGroup aria-label="covid" name="hadContactCovid" value={form.hadContactCovid} onChange={handleChange} style={{ padding: '0px 5px' }}>
                                    <Box display="flex" flexDirection="row">
                                        <FormControlLabel value="true" control={<Radio />} label="Yes" />
                                        <FormControlLabel value="false" control={<Radio />} label="No" />
                                    </Box>
                                </RadioGroup>
                            </Box>

                            {form.hadContactCovid == "true" && <TextInputField
                                fullWidth
                                multiline={true}
                                rows={4}
                                name="covidDetails"
                                label="Details"
                                placeholder=""
                                variant="outlined"
                                margin="dense"
                                InputLabelProps={{ shrink: !!form.covidDetails }}
                                value={form.covidDetails}
                                onChange={handleChange}
                                errors={errors.covidDetails}
                            />}

                            <Box display="flex" flexDirection="column">
                                <Typography>
                                    Any medical history?
                                </Typography>
                                <Box display="flex" flexDirection="row" justifyItems="flex-start"
                                    alignItems="center">
                                    <Checkbox
                                        checked={form.diabetes}
                                        onChange={handleCheckboxFieldChange}
                                        name="diabetes"
                                    />
                                    <Typography className={classes.checkBoxLabel}>
                                        Diabetes
                                    </Typography>
                                </Box>

                                {form.diabetes && <TextInputField
                                    fullWidth
                                    multiline={true}
                                    rows={4}
                                    name="diabetesDetails"
                                    label="Details"
                                    placeholder=""
                                    variant="outlined"
                                    margin="dense"
                                    InputLabelProps={{ shrink: !!form.diabetesDetails }}
                                    value={form.diabetesDetails}
                                    onChange={handleChange}
                                    errors={errors.diabetesDetails}
                                />}
                                <Box display="flex" flexDirection="row" justifyItems="flex-start"
                                    alignItems="center">
                                    <Checkbox
                                        checked={form.heartDisease}
                                        onChange={handleCheckboxFieldChange}
                                        name="heartDisease"
                                    />
                                    <Typography className={classes.checkBoxLabel}>
                                        Heart Disease
                                    </Typography>
                                </Box>

                                {form.heartDisease && <TextInputField
                                    fullWidth
                                    multiline={true}
                                    rows={4}
                                    name="heartDiseaseDetails"
                                    label="Details"
                                    placeholder=""
                                    variant="outlined"
                                    margin="dense"
                                    InputLabelProps={{ shrink: !!form.heartDiseaseDetails }}
                                    value={form.heartDiseaseDetails}
                                    onChange={handleChange}
                                    errors={errors.heartDiseaseDetails}
                                />}

                                <Box display="flex" flexDirection="row" justifyItems="flex-start"
                                    alignItems="center">
                                    <Checkbox
                                        checked={form.hyperTension}
                                        onChange={handleCheckboxFieldChange}
                                        name="hyperTension"
                                    />
                                    <Typography className={classes.checkBoxLabel}>
                                        HyperTension
                                    </Typography>
                                </Box>

                                {form.hyperTension && <TextInputField
                                    fullWidth
                                    multiline={true}
                                    rows={4}
                                    name="hyperTensionDetails"
                                    label="Details"
                                    placeholder=""
                                    variant="outlined"
                                    margin="dense"
                                    InputLabelProps={{ shrink: !!form.hyperTensionDetails }}
                                    value={form.hyperTensionDetails}
                                    onChange={handleChange}
                                    errors={errors.hyperTensionDetails}
                                />}

                                <Box display="flex" flexDirection="row" justifyItems="flex-start"
                                    alignItems="center">
                                    <Checkbox
                                        checked={form.kidneyDiseases}
                                        onChange={handleCheckboxFieldChange}
                                        name="kidneyDiseases"
                                    />
                                    <Typography className={classes.checkBoxLabel}>
                                        Kidney Diseases
                                    </Typography>
                                </Box>

                                {form.kidneyDiseases && <TextInputField
                                    fullWidth
                                    multiline={true}
                                    rows={4}
                                    name="kidneyDiseasesDetails"
                                    label="Details"
                                    placeholder=""
                                    variant="outlined"
                                    margin="dense"
                                    InputLabelProps={{ shrink: !!form.kidneyDiseasesDetails }}
                                    value={form.kidneyDiseasesDetails}
                                    onChange={handleChange}
                                    errors={errors.kidneyDiseasesDetails}
                                />}

                            </Box>

                        </CardContent>

                        <CardActions className="padding16">
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
                    </form>
                </Card>

            </Grid>
        </Grid>
    </div>
}