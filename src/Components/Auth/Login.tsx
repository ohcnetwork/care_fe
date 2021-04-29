import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { postLogin } from "../../Redux/actions";
import {  navigate } from "raviger";
import {
  CardActions,
  CardContent,
  Grid
} from "@material-ui/core";
import { TextInputField } from "../Common/HelperInputFields";
import { PublicDashboard } from "../Dashboard/PublicDashboard";
import ReCaptcha from "react-google-recaptcha";
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
const get = require('lodash.get');

export const Login = () => {
  const dispatch: any = useDispatch();
  const initForm: any = {
    username: "",
    password: ""
  };
  const initErr: any = {};
  const [form, setForm] = useState(initForm);
  const [errors, setErrors] = useState(initErr);
  const [isCaptchaEnabled, setCaptcha] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const captchaKey = '6LdvxuQUAAAAADDWVflgBqyHGfq-xmvNJaToM0pN';

  const handleChange = (e: any) => {
    const { value, name } = e.target;
    const fieldValue = Object.assign({}, form);
    const errorField = Object.assign({}, errors);
    if (errorField[name]) {
      errorField[name] = null;
      setErrors(errorField);
    }
    fieldValue[name] = value;
    if (name === "username") {
      fieldValue[name] = value.toLowerCase();
    }
    setForm(fieldValue);
  };

  const validateData = () => {
    let hasError = false;
    const err = Object.assign({}, errors);
    Object.keys(form).forEach(key => {
      if (
        typeof form[key] === "string" &&
        key !== "password" &&
        key !== "confirm"
      ) {
        if (!form[key].match(/\w/)) {
          hasError = true;
          err[key] = "This field is required";
        }
      }
      if (!form[key]) {
        hasError = true;
        err[key] = "This field is required";
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
        const res = get(resp, "data", null);
        const statusCode = get(resp, "status", "");
        if (res && statusCode === 429) {
          setCaptcha(true);
        } else if (res && statusCode === 200) {
          if(rememberMe) {
            localStorage.setItem("care_access_token", res.access);
            localStorage.setItem("care_refresh_token", res.refresh);
          }
          navigate("/facility");
          window.location.reload();
        }
      });
    }
  };

  const onCaptchaChange = (value: any) => {
    if (value && isCaptchaEnabled) {
      const formCaptcha = { ...form };
      formCaptcha["g-recaptcha-response"] = value;
      setForm(formCaptcha);
    }
  };

  return (
    <div className="flex flex-col md:flex-row my-20 md:my-40 items-center justify-between ">
      <PublicDashboard />
      <div className="w-full md:w-auto mt-10 md:mt-0">
        <div className="bg-white mt-4 md:mt-20 rounded-lg shadow-lg px-4 py-4">
          <div className="text-2xl font-bold text-center pt-4 text-green-600">
            Authorized Login
          </div>
          <form onSubmit={e => handleSubmit(e)}>
            <CardContent>
              <TextInputField
                name="username"
                label="User Name"
                variant="outlined"
                margin="dense"
                InputLabelProps={{ shrink: !!form.username }}
                value={form.username}
                onChange={handleChange}
                errors={errors.username}
              />
              <div className="relative w-full">
                <TextInputField
                  className="w-full bg-gray-400"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  label="Password"
                  variant="outlined"
                  margin="dense"
                  autoComplete='off'
                  InputLabelProps={{ shrink: !!form.password }}
                  value={form.password}
                  onChange={handleChange}
                  errors={errors.password}
                />
                {showPassword ? <VisibilityIcon onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-4" /> : <VisibilityOffIcon onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-4" />}
              </div>
            </CardContent>
            <CardActions className="padding16">
              <Grid container justify="center">
                {isCaptchaEnabled && (
                  <Grid item className="px-8 py-4">
                    <ReCaptcha
                      sitekey={captchaKey}
                      onChange={onCaptchaChange}
                    />
                    <span className="text-red-500">{errors.captcha}</span>
                  </Grid>
                )}

                <div className="w-full flex justify-between items-center px-4 pb-4">
                  <div onClick={() => setRememberMe(!rememberMe)} className="flex items-center">
                    <input type="checkbox" className="form-checkbox h-4 w-4 text-green-500 focus:border-green-600 border-gray-600" checked={rememberMe} />
                    <p className="text-sm text-green-400 hover:text-green-500 ml-2">Remember me</p>
                  </div>
                  <a href="/forgot-password"
                      className="text-sm text-green-400 hover:text-green-500">
                    Forgot password?
                  </a>
                </div>

                <button className="w-full bg-green-500 btn text-white" onClick={e => handleSubmit(e)}>
                  Login
                </button>
              </Grid>
            </CardActions>
          </form>
        </div>
      </div>
    </div>
  );
};
