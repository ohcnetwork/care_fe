import {useDispatch} from "react-redux";
import React, {useState} from "react";
import {postLogin} from "../../Redux/actions";
import { navigate} from 'hookrouter';

export const Login = () => {
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
        <div className="w-full max-w-xs">
            <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2"
                           htmlFor="username">
                        Username
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="username"
                        name="username"
                        value={form.username}
                        onChange={handleChange}  type="text" placeholder="Username"/>
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                        Password
                    </label>
                    <input
                        className="shadow appearance-none border border-red-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                        id="password"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange} placeholder="Enter your password"/>
                        <p className="text-red-500 text-xs italic">Please choose a password.</p>
                </div>
                <div className="flex items-center justify-between">
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        onClick={handleSubmit}
                        type="button">
                        Sign In
                    </button>
                    <a className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
                       href="#">
                        Forgot Password?
                    </a>
                </div>
            </form>
        </div>
    );
};
