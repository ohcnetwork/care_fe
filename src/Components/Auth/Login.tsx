import { useEffect, useState } from "react";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import { useTranslation } from "react-i18next";
import ReCaptcha from "react-google-recaptcha";
import * as Notification from "../../Utils/Notifications.js";
import LegendInput from "../../CAREUI/interactive/LegendInput";
import LanguageSelectorLogin from "../Common/LanguageSelectorLogin";
import CareIcon from "../../CAREUI/icons/CareIcon";
import useConfig from "../../Common/hooks/useConfig";
import CircularProgress from "../Common/components/CircularProgress";
import { LocalStorageKeys } from "../../Common/constants";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

export const Login = (props: { forgot?: boolean }) => {
  const {
    main_logo,
    recaptcha_site_key,
    github_url,
    coronasafe_url,
    state_logo,
    custom_logo,
    custom_logo_alt,
    custom_description,
  } = useConfig();
  const initForm: any = {
    username: "",
    password: "",
  };
  const { forgot } = props;
  const initErr: any = {};
  const [form, setForm] = useState(initForm);
  const [errors, setErrors] = useState(initErr);
  const [isCaptchaEnabled, setCaptcha] = useState(false);
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

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const valid = validateData();
    if (valid) {
      // replaces button with spinner
      setLoading(true);

      const { res, data } = await request(routes.login);
      if (res && res.status === 429) {
        setCaptcha(true);
        // captcha displayed set back to login button
        setLoading(false);
      } else if (res && res.status === 200 && data) {
        localStorage.setItem(LocalStorageKeys.accessToken, data.access);
        localStorage.setItem(LocalStorageKeys.refreshToken, data.refresh);

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
    }
  };

  const validateForgetData = () => {
    let hasError = false;
    const err = Object.assign({}, errors);

    if (typeof form.username === "string") {
      if (!form.username.match(/\w/)) {
        hasError = true;
        err.username = t("field_required");
      }
    }
    if (!form.username) {
      hasError = true;
      err.username = t("field_required");
    }

    if (hasError) {
      setErrors(err);
      return false;
    }
    return form;
  };

  const handleForgetSubmit = async (e: any) => {
    e.preventDefault();
    const valid = validateForgetData();
    if (valid) {
      setLoading(true);
      const { res, error } = await request(routes.forgotPassword);
      setLoading(false);
      if (res && res.statusText === "OK") {
        Notification.Success({
          msg: t("password_sent"),
        });
      } else if (res && error) {
        setErrors(error);
      } else {
        Notification.Error({
          msg: t("something_wrong"),
        });
      }
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
    <div className="relative flex flex-col-reverse overflow-hidden md:h-screen md:flex-row">
      <div className="login-hero relative flex flex-auto flex-col justify-between p-6 md:h-full md:w-[calc(50%+130px)] md:flex-none md:p-0 md:px-16 md:pr-[calc(4rem+130px)]">
        <div></div>
        <div className="mt-4 flex flex-col items-start rounded-lg py-4 md:mt-12">
          <div className="mb-4 hidden items-center gap-6 md:flex">
            {(custom_logo || state_logo) && (
              <>
                <img
                  src={custom_logo?.light ?? state_logo?.light}
                  className="h-16 rounded-lg py-3"
                  alt="state logo"
                />
                <div className="h-10 w-0.5 rounded-full bg-white/50" />
              </>
            )}
            <a
              href={coronasafe_url}
              className="inline-block"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={custom_logo_alt?.light ?? main_logo.light}
                className="h-8"
                alt="coronasafe logo"
              />
            </a>
          </div>
          <div className="max-w-lg">
            <h1 className="text-4xl font-black leading-tight tracking-wider text-white lg:text-5xl">
              {t("care")}
            </h1>
            {custom_description ? (
              <div className="py-6">
                <ReactMarkdown
                  rehypePlugins={[rehypeRaw]}
                  className="max-w-xl text-gray-400"
                >
                  {custom_description || t("goal")}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="max-w-xl py-6 pl-1 text-base font-semibold text-gray-400 md:text-lg lg:text-xl">
                {t("goal")}
              </div>
            )}
          </div>
        </div>
        <div className="mb-6 flex items-center">
          <div className="max-w-lg text-xs md:text-sm">
            <div className="mb-2 ml-1 flex items-center gap-4">
              <a
                href="https://digitalpublicgoods.net/registry/coronasafe-care.html"
                rel="noopener noreferrer"
                target="_blank"
              >
                <img
                  src="https://digitalpublicgoods.net/wp-content/themes/dpga/images/logo-w.svg"
                  className="h-12"
                  alt="Logo of Digital Public Goods Alliance"
                />
              </a>
              <div className="ml-2 h-8 w-[1px] rounded-full bg-white/50" />
              <a
                href={coronasafe_url}
                rel="noopener noreferrer"
                target="_blank"
              >
                <img
                  src="https://cdn.coronasafe.network/ohc_logo_light.png"
                  className="inline-block h-10"
                  alt="coronasafe logo"
                />
              </a>
            </div>
            <a
              href={coronasafe_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500"
            >
              {t("footer_body")}
            </a>
            <div className="mx-auto mt-2">
              <a
                href={github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-500"
              >
                {t("contribute_github")}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="login-hero-form my-4 w-full md:mt-0 md:h-full md:w-1/2">
        <div className="relative flex h-full items-center justify-center">
          <div
            className={
              "w-full p-8 transition-all md:w-4/5 md:p-0 lg:w-[400px] " +
              (forgotPassword
                ? "invisible -translate-x-5 opacity-0"
                : "visible -translate-x-0 opacity-100")
            }
          >
            <div className="flex items-center gap-1">
              {(custom_logo || state_logo) && (
                <>
                  <img
                    src={custom_logo?.dark ?? state_logo?.dark}
                    className="h-14 rounded-lg py-3 md:hidden"
                    alt="state logo"
                  />
                  <div className="mx-4 h-8 w-[1px] rounded-full bg-gray-600 md:hidden" />
                </>
              )}
              <img
                src={custom_logo_alt?.dark ?? main_logo.dark}
                className="h-8 w-auto md:hidden"
                alt="care logo"
              />
            </div>{" "}
            <div className="mb-8 w-[300px] text-4xl font-black text-primary-600">
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
                <div className="justify-start">
                  {isCaptchaEnabled && (
                    <div className="grid px-8 py-4">
                      <ReCaptcha
                        sitekey={recaptcha_site_key}
                        onChange={onCaptchaChange}
                      />
                      <span className="text-red-500">{errors.captcha}</span>
                    </div>
                  )}

                  <div className="flex w-full items-center justify-between py-4">
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
                      className="inline-flex w-full cursor-pointer items-center justify-center rounded bg-primary-500 px-4 py-2 text-sm font-semibold text-white"
                    >
                      {t("login")}
                    </button>
                  )}
                </div>
              </div>
            </form>
            <LanguageSelectorLogin />
          </div>
          <div
            className={
              "absolute w-full p-8 transition-all md:w-4/5 md:p-0 lg:w-[400px] " +
              (!forgotPassword
                ? "invisible translate-x-5 opacity-0"
                : "visible translate-x-0 opacity-100")
            }
          >
            <img
              src={main_logo.dark}
              className="mb-4 h-8 w-auto md:hidden"
              alt="care logo"
            />{" "}
            <button
              onClick={() => {
                setForgotPassword(false);
              }}
              type="button"
              className="mb-4 text-sm text-primary-400 hover:text-primary-500"
            >
              <div className="flex justify-center">
                <CareIcon className="care-l-arrow-left text-lg" />
                <span>{t("back_to_login")}</span>
              </div>
            </button>
            <div className="mb-8 w-[300px] text-4xl font-black text-primary-600">
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
                  size="large"
                  className="font-extrabold"
                />
                <div className="justify-start">
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <CircularProgress className="text-primary-500" />
                    </div>
                  ) : (
                    <button
                      type="submit"
                      className="inline-flex w-full cursor-pointer items-center justify-center rounded bg-primary-500 px-4 py-2 text-sm font-semibold text-white"
                    >
                      {t("send_reset_link")}
                    </button>
                  )}
                </div>
              </div>
            </form>
            <LanguageSelectorLogin />
          </div>
        </div>
      </div>
    </div>
  );
};
