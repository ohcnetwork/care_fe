import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { postForgotPassword, postLogin } from "../../Redux/actions";
import { Grid, CircularProgress } from "@material-ui/core";
import { useTranslation } from "react-i18next";
import ReCaptcha from "react-google-recaptcha";
import { RECAPTCHA_SITE_KEY } from "../../Common/env";
import * as Notification from "../../Utils/Notifications.js";
import { get } from "lodash";
import LegendInput from "../../CAREUI/interactive/LegendInput";
import LanguageSelectorLogin from "../Common/LanguageSelectorLogin";
import CareIcon from "../../CAREUI/icons/CareIcon";

export const Login = (props: { forgot?: boolean }) => {
  const dispatch: any = useDispatch();
  const initForm: any = {
    username: "",
    password: "",
  };
  const { forgot } = props;
  const initErr: any = {};
  const [form, setForm] = useState(initForm);
  const [errors, setErrors] = useState(initErr);
  const [isCaptchaEnabled, setCaptcha] = useState(false);
  const captchaKey = RECAPTCHA_SITE_KEY ?? "";
  const { t } = useTranslation();
  // display spinner while login is under progress
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(forgot);

  // Login form validation

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

  const validateForgetData = () => {
    let hasError = false;
    const err = Object.assign({}, errors);

    if (typeof form.username === "string") {
      if (!form.username.match(/\w/)) {
        hasError = true;
        err.username = t("field_request");
      }
    }
    if (!form.username) {
      hasError = true;
      err.username = t("field_request");
    }

    if (hasError) {
      setErrors(err);
      return false;
    }
    return form;
  };

  const handleForgetSubmit = (e: any) => {
    e.preventDefault();
    const valid = validateForgetData();
    if (valid) {
      setLoading(true);
      dispatch(postForgotPassword(valid)).then((resp: any) => {
        setLoading(false);
        const res = resp && resp.data;
        if (res && res.status === "OK") {
          Notification.Success({
            msg: t("password_sent"),
          });
        } else if (res && res.data) {
          setErrors(res.data);
        } else {
          Notification.Error({
            msg: t("something_wrong"),
          });
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
    <div className="flex flex-col-reverse md:flex-row md:h-screen relative overflow-hidden">
      <div className="flex p-6 md:p-0 md:px-16 md:pr-[calc(4rem+130px)] flex-col justify-center md:w-[calc(50%+130px)] md:h-full flex-auto md:flex-none login-hero relative">
        <a
          href={"https://coronasafe.network?ref=care_login"}
          className="inline-block"
          target={"_blank"}
          rel="noopener noreferrer"
        >
          <img
            src={process.env.REACT_APP_LIGHT_LOGO}
            className="h-8 hidden md:inline-block"
            alt="coronasafe logo"
          />
        </a>
        <div className="mt-4 md:mt-12 rounded-lg py-4">
          <div className="max-w-lg">
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-white leading-tight tracking-wider">
              CARE
            </h1>
            <div className="text-base md:text-lg lg:text-xl font-semibold py-6 max-w-xl text-gray-400 pl-1">
              {t("goal")}
            </div>
          </div>
        </div>
        <div className="flex items-center lg:absolute lg:inset-x-0 lg:py-12 lg:px-16 pb-10 lg:bottom-0 lg:z-20">
          <div className="text-xs md:text-sm max-w-lg">
            <a
              className="flex items-center text-gray-300 mb-2 font-bold"
              href="https://coronasafe.network/"
              rel="noopener noreferrer"
              target={"_blank"}
            >
              <span>Powered By</span>
              <img
                src="https://3451063158-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-M233b0_JITp4nk0uAFp%2F-M2Dx6gKxOSU45cjfgNX%2F-M2DxFOkMmkPNn0I6U9P%2FCoronasafe-logo.png?alt=media&token=178cc96d-76d9-4e27-9efb-88f3186368e8"
                className="h-8 inline-block"
                alt="coronasafe logo"
              />
            </a>
            <a
              href="https://coronasafe.network/"
              target={"_blank"}
              rel="noopener noreferrer"
              className="text-gray-500"
            >
              {t("footer_body")}
            </a>
            <div className="mx-auto mt-2">
              <a
                href={process.env.REACT_APP_GITHUB_URL}
                target={"_blank"}
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-500"
              >
                {t("contribute_github")}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full my-4 md:mt-0 md:w-1/2 md:h-full login-hero-form">
        <div className="flex items-center justify-center h-full relative">
          <div
            className={
              "w-full p-8 md:p-0 md:w-4/5 lg:w-[400px] transition-all " +
              (forgotPassword
                ? "invisible opacity-0 -translate-x-5"
                : "visible opacity-100 -translate-x-0")
            }
          >
            <img
              src={process.env.REACT_APP_BLACK_LOGO}
              className="h-8 w-auto mb-4 md:hidden brightness-0 contrast-[0%]"
              alt="care logo"
            />{" "}
            <div className="text-4xl w-[300px] font-black mb-8 text-primary-600">
              {t("auth_login_title")}
            </div>
            <form onSubmit={handleSubmit}>
              <div>
                <LegendInput
                  name="username"
                  id="username"
                  type="TEXT"
                  legend={t("username")}
                  value={form.username}
                  onChange={handleChange}
                  error={errors.username}
                  outerClassName="mb-4"
                  size="large"
                  className="font-extrabold"
                />
                <LegendInput
                  type="PASSWORD"
                  name="password"
                  id="password"
                  legend={t("password")}
                  value={form.password}
                  onChange={handleChange}
                  error={errors.password}
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
                    <button
                      onClick={() => {
                        setForgotPassword(true);
                      }}
                      type="button"
                      className="text-sm text-primary-400 hover:text-primary-500"
                    >
                      {t("forget_password")}
                    </button>
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
            <LanguageSelectorLogin />
          </div>
          <div
            className={
              "w-full p-8 md:p-0 md:w-4/5 lg:w-[400px] absolute transition-all " +
              (!forgotPassword
                ? "invisible opacity-0 translate-x-5"
                : "visible opacity-100 translate-x-0")
            }
          >
            <img
              src={process.env.REACT_APP_BLACK_LOGO}
              className="h-8 w-auto mb-4 md:hidden brightness-0 contrast-[0%]"
              alt="care logo"
            />{" "}
            <button
              onClick={() => {
                setForgotPassword(false);
              }}
              type="button"
              className="text-sm text-primary-400 hover:text-primary-500 mb-4"
            >
              <CareIcon className="care-l-arrow-left h-5" /> Back to login
            </button>
            <div className="text-4xl w-[300px] font-black mb-8 text-primary-600">
              {t("forget_password")}
            </div>
            <form onSubmit={handleForgetSubmit}>
              <div>
                {t("forget_password_instruction")}
                <LegendInput
                  id="forgot_username"
                  name="username"
                  type="TEXT"
                  legend={t("username")}
                  value={form.username}
                  onChange={handleChange}
                  error={errors.username}
                  outerClassName="my-4"
                  required
                  size="large"
                  className="font-extrabold"
                />
                <Grid container justify="center">
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <CircularProgress className="text-primary-500" />
                    </div>
                  ) : (
                    <button
                      type="submit"
                      className="w-full bg-primary-500 inline-flex items-center justify-center text-sm font-semibold py-2 px-4 rounded cursor-pointer text-white"
                    >
                      {t("send_reset_link")}
                    </button>
                  )}
                </Grid>
              </div>
            </form>
            <LanguageSelectorLogin />
          </div>
        </div>
      </div>
    </div>
  );
};
