import { Box, Button, Card, CardActions, CardContent, CardHeader, Checkbox, Grid, Typography } from "@material-ui/core";
import { makeStyles, Theme } from '@material-ui/core/styles';
import { isEmpty } from "lodash";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
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


export const TeleConsultation = () => {
    const classes = useStyles();
    const dispatch: any = useDispatch();
    const inputLabel = React.useRef<HTMLLabelElement>(null);

    const initForm: any = {
        fever: false,
        feverDuration:"",
        soreThroat:false,
        soreThroatDuration:"",
        cough: false,
        coughDuration:"",
        breathlessness: false,
        breathlessnessDuration: "",
        otherSymptoms: false,
        otherSymptomsDetails: "",
        reasonForCall:""
        
    };
    const initErr: any = {};
    const [form, setForm] = useState(initForm);
    const [errors, setErrors] = useState(initErr);

    const validateForm = () => {
        const err: any = {};
        Object.keys(form).forEach(key => {
            const value = form[key];
            switch (key) {
                case "feverDuration":
                    if (form.fever && !value) {
                        err[key] = "please fill the duration";
                    }
                    break;
                case "soreThroatDuration":
                    if (form.soreThroat && !value) {
                        err[key] = "please fill the duration";
                    }
                    break;
                case "coughDuration":
                    if (form.cough && !value) {
                        err[key] = "please fill the duration";
                    }
                    break;
                case "breathlessnessDuration":
                    if (form.breathlessness && !value) {
                        err[key] = "please fill the duration";
                    }
                    break;
                case "otherSymptomsDetails":
                    if (form.otherSymptoms && !value) {
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
                    <CardHeader title="Patient Tele Consultation" />

                    <form onSubmit={(e) => handleSubmit(e)}>
                        <CardContent>
                            <Box display="flex" flexDirection="column">
                                <Typography>
                                    Symptoms (Yes / No) and Duration (in days)
                                </Typography>
                                <Box display="flex" flexDirection="row" justifyItems="flex-start"
                                    alignItems="center">
                                    <Checkbox
                                        checked={form.fever}
                                        onChange={handleCheckboxFieldChange}
                                        name="fever"
                                    />
                                    <Typography className={classes.checkBoxLabel}>
                                        Fever
                                    </Typography>
                                </Box>

                                {form.fever && <TextInputField
                                    fullWidth
                                    name="feverDuration"
                                    label="Fever Duration"
                                    placeholder=""
                                    variant="outlined"
                                    margin="dense"
                                    InputLabelProps={{ shrink: !!form.feverDuration }}
                                    value={form.feverDuration}
                                    onChange={handleChange}
                                    errors={errors.feverDuration}
                                />}
                                <Box display="flex" flexDirection="row" justifyItems="flex-start"
                                    alignItems="center">
                                    <Checkbox
                                        checked={form.soreThroat}
                                        onChange={handleCheckboxFieldChange}
                                        name="soreThroat"
                                    />
                                    <Typography className={classes.checkBoxLabel}>
                                        Sore Throat
                                    </Typography>
                                </Box>

                                {form.soreThroat && <TextInputField
                                    fullWidth
                                    name="soreThroatDuration"
                                    label="Sore Throat Duration"
                                    placeholder=""
                                    variant="outlined"
                                    margin="dense"
                                    InputLabelProps={{ shrink: !!form.soreThroatDuration }}
                                    value={form.soreThroatDuration}
                                    onChange={handleChange}
                                    errors={errors.soreThroatDuration}
                                />}

                                <Box display="flex" flexDirection="row" justifyItems="flex-start"
                                    alignItems="center">
                                    <Checkbox
                                        checked={form.cough}
                                        onChange={handleCheckboxFieldChange}
                                        name="cough"
                                    />
                                    <Typography className={classes.checkBoxLabel}>
                                        Cough
                                    </Typography>
                                </Box>

                                {form.cough && <TextInputField
                                    fullWidth
                                    name="coughDuration"
                                    label="Cough Duration"
                                    placeholder=""
                                    variant="outlined"
                                    margin="dense"
                                    InputLabelProps={{ shrink: !!form.coughDuration }}
                                    value={form.coughDuration}
                                    onChange={handleChange}
                                    errors={errors.coughDuration}
                                />}

                                <Box display="flex" flexDirection="row" justifyItems="flex-start"
                                    alignItems="center">
                                    <Checkbox
                                        checked={form.breathlessness}
                                        onChange={handleCheckboxFieldChange}
                                        name="breathlessness"
                                    />
                                    <Typography className={classes.checkBoxLabel}>
                                        Breathlessness
                                    </Typography>
                                </Box>

                                {form.breathlessness && <TextInputField
                                    fullWidth
                                    name="breathlessnessDuration"
                                    label="Breathlessness Duration"
                                    placeholder=""
                                    variant="outlined"
                                    margin="dense"
                                    InputLabelProps={{ shrink: !!form.breathlessnessDuration }}
                                    value={form.breathlessnessDuration}
                                    onChange={handleChange}
                                    errors={errors.breathlessnessDuration}
                                />}
                                <Typography>
                                    Any other symptoms?
                                </Typography>
                                <Box display="flex" flexDirection="row" justifyItems="flex-start"
                                    alignItems="center">
                                    <Checkbox
                                        checked={form.otherSymptoms}
                                        onChange={handleCheckboxFieldChange}
                                        name="otherSymptoms"
                                    />
                                    <Typography className={classes.checkBoxLabel}>
                                        Other symptoms
                                    </Typography>
                                </Box>

                                {form.otherSymptoms && <TextInputField
                                    fullWidth
                                    multiline={true}
                                    rows={4}
                                    name="otherSymptomsDetails"
                                    label="Other Symptoms"
                                    placeholder=""
                                    variant="outlined"
                                    margin="dense"
                                    InputLabelProps={{ shrink: !!form.otherSymptomsDetails }}
                                    value={form.otherSymptomsDetails}
                                    onChange={handleChange}
                                    errors={errors.otherSymptomsDetails}
                                />}

                                <Typography>
                                    Reason for calling
                                </Typography>
                                <TextInputField
                                    fullWidth
                                    multiline={true}
                                    rows={4}
                                    name="reasonForCall"
                                    label="Reason"
                                    placeholder=""
                                    variant="outlined"
                                    margin="dense"
                                    InputLabelProps={{ shrink: !!form.reasonForCall }}
                                    value={form.reasonForCall}
                                    onChange={handleChange}
                                    errors={errors.reasonForCall}
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
