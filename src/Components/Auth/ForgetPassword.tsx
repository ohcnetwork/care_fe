import { Button,  CardActions, CardContent } from '@material-ui/core';
import { Link } from 'raviger';
import loadable from '@loadable/component';
import React, {  useState } from 'react';
import { useDispatch } from 'react-redux';
import { postForgotPassword } from '../../Redux/actions';
import { TextInputField } from '../Common/HelperInputFields';
import * as Notification from "../../Utils/Notifications.js";
const Loading = loadable( () => import("../Common/Loading"));

export const ForgotPassword = () => {
    const dispatch: any = useDispatch();
    const initForm: any = {
        username: '',
    };
    const initErr: any = {};
    const [form, setForm] = useState(initForm);
    const [errors, setErrors] = useState(initErr);
    const [disableBtn, setDisableBtn] = useState(false);
    const [showLoader, setShowLoader] = useState(false);

    const handleChange = (e: any) => {
        const { value, name } = e.target;
        const fieldValue = Object.assign({}, form);
        const errorField = Object.assign({}, errors);
        if (errorField[name]) {
            errorField[name] = null;
            setErrors(errorField);
        }
        fieldValue[name] = value;
        setForm(fieldValue);
    };

    const validateData = () => {
        let hasError = false;
        const err = Object.assign({}, errors);
        Object.keys(form).forEach((key) => {
            if (typeof (form[key]) === 'string') {
                if (!form[key].match(/\w/)) {
                    hasError = true;
                    err[key] = 'This field is required';
                }
            }
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
            setShowLoader(true)
            setDisableBtn(true);
            dispatch(postForgotPassword(valid)).then((resp: any) => {
                setShowLoader(false)
                const res = resp && resp.data;
                if (res && res.status === 'OK') {
                    Notification.Success({
                        msg: "Password Reset Email Sent"
                    });
                } else if (res && res.data) {
                    setErrors(res.data);
                } else {
                    Notification.Error({
                        msg: "Something went wrong try again later "
                    });
                }
                setDisableBtn(false);
            });
        }
    };
    if (showLoader) {
        return <Loading />;
    }
    return (
        <div>
            <div className="py-10 md:py-40">
                <form className="max-w-xl bg-white shadow rounded-lg mx-auto" onSubmit={(e) => {
                    handleSubmit(e);
                }}>
                    <div className="text-xl font-bold pt-4 text-center">
                        Forgot Password
                    </div>
                    <CardContent>
                        Enter your username and we will send you a link to reset your password.
                                <TextInputField
                            name="username"
                            placeholder="username"
                            variant="outlined"
                            margin="dense"
                            value={form.username.toLowerCase()}
                            onChange={handleChange}
                            errors={errors.username}
                        />
                    </CardContent>

                    <CardActions style={{ justifyContent: 'center' }}>
                        <Button
                            disabled={disableBtn}
                            color="primary"
                            variant="contained"
                            onClick={handleSubmit}
                        >Send Reset Link
                                </Button>
                    </CardActions>
                    <CardContent className="alignCenter">
                        Already a member? <Link href="/login">Login</Link>
                    </CardContent>
                </form>
            </div>
        </div>
    );
};
