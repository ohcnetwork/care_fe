import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { postLogin } from "../../Redux/actions";
import { Grid, CircularProgress } from "@material-ui/core";
import { useTranslation } from "react-i18next";
import ReCaptcha from "react-google-recaptcha";
import LanguageSelector from "../Common/LanguageSelector";
import { RECAPTCHA_SITE_KEY } from "../../Common/env";
import { get } from "lodash";
import TextInput from "../../CAREUI/interactive/Input";

export const Login = () => {
  const dispatch: any = useDispatch();
  const initForm: any = {
    username: "",
    password: "",
  };
  const initErr: any = {};
  const [form, setForm] = useState(initForm);
  const [errors, setErrors] = useState(initErr);
  const [isCaptchaEnabled, setCaptcha] = useState(false);
  const captchaKey = RECAPTCHA_SITE_KEY ?? "";
  const { t } = useTranslation();
  // display spinner while login is under progress
  const [loading, setLoading] = useState(false);

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

  // set loading to false when component is dismounted
  useEffect(() => {
    return () => {
      setLoading(false);
    };
  }, []);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    const valid = validateData();
    if (valid) {
      // replaces button with spinner
      setLoading(true);

      dispatch(postLogin(valid)).then((resp: any) => {
        const res = get(resp, "data", null);
        const statusCode = get(resp, "status", "");
        if (res && statusCode === 429) {
          setCaptcha(true);
          // captcha displayed set back to login button
          setLoading(false);
        } else if (res && statusCode === 200) {
          localStorage.setItem("care_access_token", res.access);
          localStorage.setItem("care_refresh_token", res.refresh);

          if (
            window.location.pathname === "/" ||
            window.location.pathname === "/login"
          ) {
            window.location.href = "/facility";
          } else {
            window.location.href = window.location.pathname.toString();
          }
        } else {
          // error from server set back to login button
          setLoading(false);
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
    <div className="flex flex-col md:flex-row md:h-screen relative">
      <div className="flex px-16 flex-col justify-center md:w-[calc(50%+130px)] md:h-full login-hero relative">
        <a href={"/"} className="inline-block">
          <img
            src={process.env.REACT_APP_LIGHT_LOGO}
            className="h-8 w-auto"
            alt="care logo"
          />{" "}
        </a>
        <div className="mt-4 md:mt-12 rounded-lg py-4">
          <div className="max-w-lg">
            <h1 className="text-3xl md:text-5xl lg:text-6xl tracking-tight font-black text-white leading-tight">
              {t("coronasafe_network")}
            </h1>
            <div className="text-base md:text-lg lg:text-xl font-semibold py-6 max-w-xl text-gray-400 pl-1">
              {t("goal")}
            </div>
          </div>
        </div>
        <div className="flex items-center absolute inset-x-0 p-16 pb-10 bottom-0 z-20">
          <div className="text-sm max-w-lg">
            <a href="https://coronasafe.network/" className="text-gray-500">
              {t("footer_body")}
            </a>
            <div className="mx-auto">
              <a
                href={process.env.REACT_APP_GITHUB_URL}
                className="text-primary-400 hover:text-primary-500"
              >
                {t("contribute_github")}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full my-4 md:mt-0 md:w-1/2 md:h-full login-hero-form">
        <div className="flex items-center justify-center h-full">
          <div className="w-[400px]">
            <div className="text-4xl w-[300px] font-black mb-8 text-primary-600">
              {t("auth_login_title")}
            </div>
            <form onSubmit={handleSubmit}>
              <div>
                <TextInput
                  name="username"
                  type="TEXT"
                  legend={t("username")}
                  value={form.username}
                  onChange={handleChange}
                  error={errors.username}
                  outerClassName="mb-4"
                  required
                  size="large"
                  className="font-extrabold"
                />
                <TextInput
                  type="PASSWORD"
                  name="password"
                  legend={t("password")}
                  value={form.password}
                  onChange={handleChange}
                  error={errors.password}
                  required
                  size="large"
                  className="font-extrabold"
                />
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

                  <div className="w-full flex justify-between items-center py-4">
                    <a
                      href="/forgot-password"
                      className="text-sm text-primary-400 hover:text-primary-500"
                    >
                      {t("forget_password")}
                    </a>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center">
                      <CircularProgress className="text-primary-500" />
                    </div>
                  ) : (
                    <button
                      type="submit"
                      className="w-full bg-primary-500 inline-flex items-center justify-center text-sm font-semibold py-2 px-4 rounded cursor-pointer text-white"
                    >
                      {t("login")}
                    </button>
                  )}
                </Grid>
              </div>
            </form>
            <LanguageSelector />
          </div>
        </div>
      </div>
    </div>
  );
};
