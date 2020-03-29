import React, { useState } from "react"
import { makeStyles, Theme } from '@material-ui/core/styles';
import { useDispatch } from "react-redux";
import { Box, Grid, Checkbox, Card, CardHeader, CardContent, CardActions, Button, FormControl, InputLabel, Select, MenuItem, Typography, FormLabel, RadioGroup, Radio, FormControlLabel } from "@material-ui/core";
import { TextInputField, TimeInputField } from "../Common/HelperInputFields";
// import {  } from "../../Redux/actions";
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


export const TreatmentForm = (props:any) => {
    const classes = useStyles();
    const dispatch: any = useDispatch();
    const inputLabel = React.useRef<HTMLLabelElement>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const initForm: any = {
        patientExamDetails: "",
        physicalExamSigns: "",
        medicationAlready: "",
        medProvidedAtCenter: "",
        otherDetails: "",
        temperature: "",
        time: selectedDate
    };
    const initErr: any = {};
    const [form, setForm] = useState(initForm);
    const [errors, setErrors] = useState(initErr);

    const validateForm = () => {
        const err: any = {};
        Object.keys(form).forEach(key => {
            const value = form[key];
            switch (key) {
                case "patientExamDetails":
                    if (!value) {
                        err[key] = "please fill the details";
                    }
                    break;
                case "physicalExamSigns":
                    if (!value) {
                        err[key] = "please fill the details";
                    }
                    break;
                case "medicationAlready":
                    if (!value) {
                        err[key] = "please fill the details";
                    }
                    break;
                case "medProvidedAtCenter":
                    if (!value) {
                        err[key] = "please fill the details";
                    }
                    break;
                case "temperature":
                    if (!value) {
                        err[key] = "please fill the temperature";
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

    const handleTimeFieldChange = (date: any) => {
        const formValues = { ...form };
        formValues['time'] = date;
        setSelectedDate(date);
        setForm(formValues);
    };

    return <div className={classes.formTop} >

        <Grid container justify="center">
            <Grid item xs={12} sm={5} md={4} lg={3}>

                <Card>
                    <CardHeader title="Patient Treatment/Diagnostic" />

                    <form onSubmit={(e) => handleSubmit(e)}>
                        <CardContent>
                            <Box display="flex" flexDirection="column">
                                <TextInputField
                                    fullWidth
                                    multiline={true}
                                    rows={4}
                                    name="patientExamDetails"
                                    label="Patient Examination Details"
                                    placeholder=""
                                    variant="outlined"
                                    margin="dense"
                                    InputLabelProps={{ shrink: !!form.patientExamDetails }}
                                    value={form.patientExamDetails}
                                    onChange={handleChange}
                                    errors={errors.patientExamDetails}
                                />

                                <Typography>
                                    Patient Daily Progress
                                </Typography>
                                <Grid container justify="space-between" alignItems="center" spacing={1}>
                                    <Grid item xs={6}>
                                        <TextInputField
                                            type="number"
                                            name="temperature"
                                            label="Temperature"
                                            placeholder=""
                                            variant="outlined"
                                            margin="dense"
                                            value={form.temperature}
                                            onChange={handleChange}
                                            errors={errors.temperature}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TimeInputField
                                            label="Time"
                                            value={form.time}
                                            onChange={handleTimeFieldChange}
                                        />
                                    </Grid>
                                </Grid>
                                <TextInputField
                                    fullWidth
                                    multiline={true}
                                    rows={4}
                                    name="physicalExamSigns"
                                    label="Physical Examination Signs"
                                    placeholder=""
                                    variant="outlined"
                                    margin="dense"
                                    InputLabelProps={{ shrink: !!form.physicalExamSigns }}
                                    value={form.physicalExamSigns}
                                    onChange={handleChange}
                                    errors={errors.physicalExamSigns}
                                />
                                <TextInputField
                                    fullWidth
                                    multiline={true}
                                    rows={4}
                                    name="otherDetails"
                                    label="Any Other Details"
                                    placeholder=""
                                    variant="outlined"
                                    margin="dense"
                                    InputLabelProps={{ shrink: !!form.otherDetails }}
                                    value={form.otherDetails}
                                    onChange={handleChange}
                                    errors={errors.otherDetails}
                                />

                                <Typography>
                                    Patient Medication
                                </Typography>

                                <TextInputField
                                    fullWidth
                                    multiline={true}
                                    rows={4}
                                    name="medicationAlready"
                                    label="Medication Already Taking"
                                    placeholder="Medication that the patient is already taking"
                                    variant="outlined"
                                    margin="dense"
                                    InputLabelProps={{ shrink: !!form.medicationAlready }}
                                    value={form.medicationAlready}
                                    onChange={handleChange}
                                    errors={errors.medicationAlready}
                                />

                                <TextInputField
                                    fullWidth
                                    multiline={true}
                                    rows={4}
                                    name="medProvidedAtCenter"
                                    label="Medication Provided at Center/Hospital"
                                    placeholder="Medication being provided at Center/Hospital"
                                    variant="outlined"
                                    margin="dense"
                                    InputLabelProps={{ shrink: !!form.medProvidedAtCenter }}
                                    value={form.medProvidedAtCenter}
                                    onChange={handleChange}
                                    errors={errors.medProvidedAtCenter}
                                />

                            </Box>

                        </CardContent>

                        <CardActions className="padding16 w3-right">
                            <Button
                                color="primary"
                                variant="contained"
                                type="submit"
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