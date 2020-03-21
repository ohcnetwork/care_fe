import {useDispatch} from "react-redux";
import React, {useState} from "react";
import {postLogin} from "../../Redux/actions";
import {A, navigate} from 'hookrouter';

export const login = () => {
    const dispatch: any = useDispatch();
    const initForm: any = {
        username: '',
        password: '',
    };
    const initErr: any = {};
    const [form, setForm] = useState(initForm);
    const [errors, setErrors] = useState(initErr);

    const handleChange = (e: any) => {
        const {value, name} = e.target;
        const fieldValue = Object.assign({}, form);
        const errorField = Object.assign({}, errors);
        if (errorField[name]) {
            errorField[name] = null;
            setErrors(errorField);
        }
        fieldValue[name] = value;
        if (name === 'username') {
            fieldValue[name] = value.toLowerCase();
        }
        setForm(fieldValue);
    };
    const validateData = () => {
        let hasError = false;
        const err = Object.assign({}, errors);
        Object.keys(form).forEach((key) => {
            if (typeof (form[key]) === 'string' && key !== 'password' && key !== 'confirm') {
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
            dispatch(postLogin(valid)).then((resp: any) => {
                const res = resp && resp.data;
                if (res && res.statusCode && res.statusCode === 401) {
                    const err = {
                        password: 'Username or Password incorrect',
                    };
                    setErrors(err);
                } else if (res.success) {
                    localStorage.setItem('care_access_token', res.access_token);
                    navigate('/dashboard');
                    window.location.reload();
                }
            });
        }
    };

    return (
        <div>

    </div>
    );
};
