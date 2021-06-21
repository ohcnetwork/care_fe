import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { postLogin } from "../../Redux/actions";
import { navigate } from "raviger";
import { CardActions, CardContent, Grid } from "@material-ui/core";
import { TextInputField } from "../Common/HelperInputFields";
import { PublicDashboard } from "../Dashboard/PublicDashboard";
import { withTranslation } from "react-i18next";
import ReCaptcha from "react-google-recaptcha";
import VisibilityIcon from "@material-ui/icons/Visibility";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";
import LanguageSelector from "../Common/LanguageSelector";
import msinsLogo from "../../Common/mahakavach/msinsLogo-removebg.png";

const get = require("lodash.get");

const LoginPage = (props: any) => {
  const dispatch: any = useDispatch();
  const initForm: any = {
    username: "",
    password: "",
  };
  const initErr: any = {};
  const [form, setForm] = useState(initForm);
  const [errors, setErrors] = useState(initErr);
  const [isCaptchaEnabled, setCaptcha] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const captchaKey = "6LdvxuQUAAAAADDWVflgBqyHGfq-xmvNJaToM0pN";
  const { t } = props;

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
    Object.keys(form).forEach((key) => {
      if (
        typeof form[key] === "string" &&
        key !== "password" &&
        key !== "confirm"
      ) {
        if (!form[key].match(/\w/)) {
          hasError = true;
          err[key] = t("field_required");
        }
      }
      if (!form[key]) {
        hasError = true;
        err[key] = t("field_required");
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
          localStorage.setItem("care_access_token", res.access);
          localStorage.setItem("care_refresh_token", res.refresh);
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
    <div className="flex flex-col md:flex-row h-screen relative">
      <div className="absolute top-2 right-2">
        <LanguageSelector className="md:bg-primary-500 md:text-white bg-white" />
      </div>
      <div className="flex flex-col justify-center items-center p-2 h-1/2 md:w-1/2 md:h-full bg-primary-500">
        <div>
          <a href={"/"}>
            <img src={msinsLogo} className="my-auto max-h-36" alt="care logo" />{" "}
          </a>
        </div>
        <div className="mt-4 md:mt-20 rounded-lg py-4">
          <PublicDashboard />
        </div>
      </div>

      <div className="flex items-center justify-center w-full mt-4 md:mt-0 md:w-1/2 md:h-full">
        <div className="bg-white mt-4 md:mt-20 rounded-lg px-4 py-4">
          <div className="text-2xl font-bold text-center pt-4 text-primary-600">
            {t("auth_login_title")}
          </div>
          <form onSubmit={(e) => handleSubmit(e)}>
            <CardContent>
              <TextInputField
                name="username"
                label={t("username")}
                variant="outlined"
                margin="dense"
                InputLabelProps={{ shrink: !!form.username }}
                value={form.username}
                onChange={handleChange}
                errors={errors.username}
              />
              <div className="relative w-full">
                <TextInputField
                  className="w-full"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  label={t("password")}
                  variant="outlined"
                  margin="dense"
                  autoComplete="off"
                  InputLabelProps={{ shrink: !!form.password }}
                  value={form.password}
                  onChange={handleChange}
                  errors={errors.password}
                />
                {showPassword ? (
                  <VisibilityIcon
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-4"
                  />
                ) : (
                  <VisibilityOffIcon
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-4"
                  />
                )}
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
                  <a
                    href="/forgot-password"
                    className="text-sm text-primary-400 hover:text-primary-500"
                  >
                    {t("forget_password")}
                  </a>
                </div>

                <button
                  className="w-full bg-primary-500 btn text-white"
                  onClick={(e) => handleSubmit(e)}
                >
                  {t("login")}
                </button>
              </Grid>
            </CardActions>
          </form>
        </div>
      </div>
    </div>
  );
};

export const Login = withTranslation()(LoginPage);
