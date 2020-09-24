import React, { useState } from 'react';
import { Typography, Grid, Card, CardHeader, CardContent, CardActions, Button } from '@material-ui/core';
import { TextInputField, ErrorHelperText } from '../Common/HelperInputFields';
import { useDispatch } from 'react-redux';
import * as Notification from "../../Utils/Notifications.js";
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import {postResetPassword} from "../../Redux/actions";
import {navigate} from "raviger";

const useStyles = makeStyles(theme => ({
    formTop:{
        marginTop: '100px',
    }
}));

const panelStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            width: '100%'
        },
        heading: {
            fontSize: theme.typography.pxToRem(15),
            fontWeight: theme.typography.fontWeightRegular
        }
    })
);


export const ResetPassword = (props: any) => {
    const classes = useStyles();
    const panel = panelStyles();

    const dispatch: any = useDispatch();
    const initForm: any = {
        password: '',
        confirm: ''
    };

    const initErr: any = {};
    const [ form, setForm ] = useState(initForm);
    const [ errors, setErrors ] = useState(initErr);
    const [passReg, setPassReg] = useState(0);

    const handleChange = (e: any) => {
        const { value, name } = e.target;
        const fieldValue = Object.assign({}, form);
        const errorField = Object.assign({}, errors);
        if (errorField[name]) {
            errorField[name] = null;
            setErrors(errorField);
        }
        fieldValue[name] = value;
        setPassReg(0)
        setForm(fieldValue);
    };

    const validateData = () => {
        let hasError = false;
        const err = Object.assign({}, errors);
        if (form.password !== form.confirm) {
            hasError = true;
            setPassReg(1)
            err.confirm = "Password and confirm password must be same."
        }

        const regex = /^(?=.*[a-z]+)(?=.*[A-Z]+)(?=.*[0-9]+)(?=.*[!@#$%^&*]).{8,}$/;
        if (!regex.test(form.password)) {
            hasError = true;
            err.password = 'Password Doesnt meet the requirements';
        }

        Object.keys(form).forEach((key) => {
            if (!form[key]) {
                hasError = true;
                err[key] = 'This field is required';
            }
        });
        if (hasError) {
            setErrors(err);
            return false;
        }
        return form;
    };


    const handleSubmit = (e: any) => {
        e.preventDefault();
        const valid = validateData();
        if (valid) {
            valid.token = props.token;
            dispatch(postResetPassword(valid)).then((resp: any) => {
                const res = resp && resp.data;
                if (res && res.status === 'OK') {
                    localStorage.removeItem('care_access_token');
                    Notification.Success({
                        msg: "Password Reset successfully"
                    });
                    navigate('/login');
                } else if (res && res.data) {
                    setErrors(res.data);
                } else {
                    Notification.Error({
                        msg: "Password Reset Failed"
                    });
                }
            });
        }
    }
    return (
        <div>
            <Grid container className={classes.formTop} >
                <Grid item xs={12} md={4} className="marginAuto marginTop50">
                    <Card>
                        <form onSubmit={(e) => {handleSubmit(e)}}>
                            <CardHeader title="Reset Password" />
                            <CardContent>
                                <TextInputField
                                    type="password"
                                    name="password"
                                    placeholder="New Password"
                                    variant="outlined"
                                    margin="dense"
                                    onChange={handleChange}
                                    errors={errors.password}
                                />
                                {
                                    passReg === 0 &&
                                    <div className={panel.root}>
                                        <ExpansionPanel>
                                            <ExpansionPanelDetails>
                                                <Typography className="text-red-500">
                                                    <li> Minimum password length 8</li>
                                                    <li>Require at least one digit</li>
                                                    <li>Require at least one upper case</li>
                                                    <li> Require at least one lower case letter</li>
                                                    <li>Require at least one symbol</li>
                                                </Typography>
                                            </ExpansionPanelDetails>
                                        </ExpansionPanel>
                                    </div>
                                }
                                <TextInputField
                                    type="password"
                                    name="confirm"
                                    placeholder="Confirm Password"
                                    variant="outlined"
                                    margin="dense"
                                    onChange={handleChange}
                                    errors={errors.confirm}
                                />
                                <ErrorHelperText error={errors.token} />
                            </CardContent>

                            <CardActions className="padding16">
                                <Button
                                    color="primary"
                                    variant="contained"
                                    type="submit"
                                    style={{ marginLeft: 'auto' }}
                                    onClick={(e) => handleSubmit(e)}
                                >Reset
                                </Button>
                            </CardActions>
                        </form>
                    </Card>
                </Grid>
            </Grid>
        </div>
    );
}
