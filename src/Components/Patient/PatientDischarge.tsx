import { Box, Button, Card, CardActions, CardContent, CardHeader, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from "@material-ui/core";
import { makeStyles, Theme } from '@material-ui/core/styles';
import { isEmpty } from "lodash";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { GENDER_TYPES } from "../../Common/constants";
import { TextInputField } from "../Common/HelperInputFields";


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


export const PatientDischarge = () => {
    const classes = useStyles();
    const dispatch: any = useDispatch();
    const inputLabel = React.useRef<HTMLLabelElement>(null);

    const initForm: any = {
        pName: "",
        age: "",
        gender: "",
        mobileNo: "",
        presentingComplaints: "",
        physicalExamination: "",
        conditionAtDischarge: "",
        adviceOnDischarge: ""

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
                case "presentingComplaints":
                    !value && (err[key] = "This field is required");
                    break;
                case "physicalExamination":
                    !value && (err[key] = "This field is required");
                    break;
                case "conditionAtDischarge":
                    !value && (err[key] = "This field is required");
                    break;
                case "adviceOnDischarge":
                    !value && (err[key] = "This field is required");
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
    

    return <div className={classes.formTop} >

        <Grid container justify="center">
            <Grid item xs={12} sm={5} md={4} lg={3}>

                <Card>
                    <CardHeader title="Patient Discharge" />

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
                                        Gender *
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
                                        {GENDER_TYPES.map((gender) => {
                                            return <MenuItem key={gender.id} value={gender.id}>{gender.text}</MenuItem>
                                        })}
                                    </Select>
                                    <span className="error-text">{errors.gender}</span>
                                </FormControl>
                            </Box>

                            <Box display="flex" flexDirection="column">
                                <Typography>
                                    Presenting Complaints *
                                </Typography>
                                <TextInputField
                                    fullWidth
                                    multiline={true}
                                    rows={4}
                                    name="presentingComplaints"
                                    label="Details"
                                    placeholder=""
                                    variant="outlined"
                                    margin="dense"
                                    InputLabelProps={{ shrink: !!form.presentingComplaints }}
                                    value={form.presentingComplaints}
                                    onChange={handleChange}
                                    errors={errors.presentingComplaints}
                                />
                                <Typography>
                                    Physical Examination *
                                </Typography>
                                <TextInputField
                                    fullWidth
                                    multiline={true}
                                    rows={4}
                                    name="physicalExamination"
                                    label="Details"
                                    placeholder=""
                                    variant="outlined"
                                    margin="dense"
                                    InputLabelProps={{ shrink: !!form.physicalExamination }}
                                    value={form.physicalExamination}
                                    onChange={handleChange}
                                    errors={errors.physicalExamination}
                                />
                                <Typography>
                                    Treatment Given *
                                </Typography>
                                <TextInputField
                                    fullWidth
                                    multiline={true}
                                    rows={4}
                                    name="treatmentGiven"
                                    label="Details"
                                    placeholder=""
                                    variant="outlined"
                                    margin="dense"
                                    InputLabelProps={{ shrink: !!form.treatmentGiven }}
                                    value={form.treatmentGiven}
                                    onChange={handleChange}
                                    errors={errors.treatmentGiven}
                                />
                                <Typography>
                                    Condition at Discharge *
                                </Typography>
                                <TextInputField
                                    fullWidth
                                    multiline={true}
                                    rows={4}
                                    name="conditionAtDischarge"
                                    label="Details"
                                    placeholder=""
                                    variant="outlined"
                                    margin="dense"
                                    InputLabelProps={{ shrink: !!form.conditionAtDischarge }}
                                    value={form.conditionAtDischarge}
                                    onChange={handleChange}
                                    errors={errors.conditionAtDischarge}
                                />
                                <Typography>
                                    Advice on Discharge *
                                </Typography>
                                <TextInputField
                                    fullWidth
                                    multiline={true}
                                    rows={4}
                                    name="adviceOnDischarge"
                                    label="Details"
                                    placeholder=""
                                    variant="outlined"
                                    margin="dense"
                                    InputLabelProps={{ shrink: !!form.adviceOnDischarge }}
                                    value={form.adviceOnDischarge}
                                    onChange={handleChange}
                                    errors={errors.adviceOnDischarge}
                                />
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
                                Submit
                            </Button>
                        </CardActions>
                    </form>
                </Card>

            </Grid>
        </Grid>
    </div>
}