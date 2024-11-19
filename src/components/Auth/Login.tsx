import careConfig from "@careConfig";
import { Link } from "raviger";
import { useEffect, useState } from "react";
import ReCaptcha from "react-google-recaptcha";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import LegendInput from "@/CAREUI/interactive/LegendInput";

import CircularProgress from "@/components/Common/CircularProgress";
import LanguageSelectorLogin from "@/components/Common/LanguageSelectorLogin";
import BrowserWarning from "@/components/ErrorPages/BrowserWarning";

import { useAuthContext } from "@/hooks/useAuthUser";

import FiltersCache from "@/Utils/FiltersCache";
import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { classNames } from "@/Utils/utils";

const Login = (props: { forgot?: boolean }) => {
  const { signIn } = useAuthContext();
  const {
    mainLogo,
    reCaptchaSiteKey,
    urls,
    stateLogo,
    customLogo,
    customLogoAlt,
  } = careConfig;
  const customDescriptionHtml = __CUSTOM_DESCRIPTION_HTML__;
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
          err[key] = "field_required";
        }
      }
      if (!form[key]) {
        hasError = true;
        err[key] = "field_required";
      }
    });
    if (hasError) {
      setErrors(err);
      return false;
    }

    return form;
  };

  // set loading to false when component is unmounted
  useEffect(() => {
    return () => {
      setLoading(false);
    };
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    setLoading(true);
    FiltersCache.invaldiateAll();
    const validated = validateData();
    if (!validated) {
      setLoading(false);
      return;
    }
    const { res } = await signIn(validated);
    setCaptcha(res?.status === 429);
    setLoading(false);
  };

  const validateForgetData = () => {
    let hasError = false;
    const err = Object.assign({}, errors);

    if (typeof form.username === "string") {
      if (!form.username.match(/\w/)) {
        hasError = true;
        err.username = "field_required";
      }
    }
    if (!form.username) {
      hasError = true;
      err.username = "field_required";
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
      const { res, error } = await request(routes.forgotPassword, {
        body: { ...valid },
      });
      setLoading(false);
      if (res?.ok) {
        Notification.Success({
          msg: t("password_sent"),
        });
      } else if (res && error) {
        setErrors(error);
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
      {!forgotPassword && <BrowserWarning />}
      <div className="login-hero relative flex flex-auto flex-col justify-between p-6 md:h-full md:w-[calc(50%+130px)] md:flex-none md:p-0 md:px-16 md:pr-[calc(4rem+130px)]">
        <div></div>
        <div className="mt-4 flex flex-col items-start rounded-lg py-4 md:mt-12">
          <div className="mb-4 hidden items-center gap-6 md:flex">
            {(customLogo || stateLogo) && (
              <>
                <img
                  src={customLogo?.light ?? stateLogo?.light}
                  className="h-16 rounded-lg py-3"
                  alt="state logo"
                />
                <div className="h-10 w-0.5 rounded-full bg-white/50" />
              </>
            )}
            <a
              href={urls.ohcn}
              className="inline-block"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={customLogoAlt?.light ?? "/images/ohc_logo_light.svg"}
                className="h-8"
                alt="Open Healthcare Network logo"
              />
            </a>
          </div>
          <div className="max-w-lg">
            <h1 className="text-4xl font-black leading-tight tracking-wider text-white lg:text-5xl">
              {t("care")}
            </h1>
            {customDescriptionHtml ? (
              <div className="py-6">
                <div
                  className="max-w-xl text-secondary-400"
                  dangerouslySetInnerHTML={{
                    __html: __CUSTOM_DESCRIPTION_HTML__,
                  }}
                />
              </div>
            ) : (
              <div className="max-w-xl py-6 pl-1 text-base font-semibold text-secondary-400 md:text-lg lg:text-xl">
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
                  src="https://cdn.ohc.network/dpg-logo.svg"
                  className="h-12"
                  alt="Logo of Digital Public Goods Alliance"
                />
              </a>
              <div className="ml-2 h-8 w-px rounded-full bg-white/50" />
              <a href={urls.ohcn} rel="noopener noreferrer" target="_blank">
                <img
                  src="/images/ohc_logo_light.svg"
                  className="inline-block h-10"
                  alt="Open Healthcare Network logo"
                />
              </a>
            </div>
            <a
              href={urls.ohcn}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary-500"
            >
              {t("footer_body")}
            </a>
            <div className="mx-auto mt-2">
              <a
                href={urls.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-500"
              >
                {t("contribute_github")}
              </a>
              <span className="mx-2 text-primary-400">|</span>
              <Link
                href="/licenses"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-500"
              >
                {t("third_party_software_licenses")}
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="login-hero-form my-4 w-full md:mt-0 md:h-full md:w-1/2">
        <div className="relative h-full items-center justify-center md:flex">
          <div className="p-8 md:w-4/5 md:p-0 lg:w-[400px]">
            <div className="flex items-center gap-1 md:hidden">
              {(customLogo || stateLogo) && (
                <>
                  <img
                    src={customLogo?.dark ?? stateLogo?.dark}
                    className="h-14 rounded-lg py-3"
                    alt="state logo"
                  />
                  <div className="mx-4 h-8 w-px rounded-full bg-secondary-600" />
                </>
              )}
              <img
                src={customLogoAlt?.dark ?? mainLogo?.dark}
                className="h-8 w-auto"
                alt="care logo"
              />
            </div>

            <div className="relative flex h-full w-full items-center">
              <div
                className={classNames(
                  "w-full transition-all",
                  forgotPassword && "hidden",
                )}
              >
                <div className="mb-8 w-64 max-w-full text-2xl font-black text-primary-600 lg:w-72 lg:text-4xl">
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
                            sitekey={reCaptchaSiteKey}
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
                          id="forgot-pass-btn"
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
                          id="login-button"
                          type="submit"
                          className="inline-flex w-full cursor-pointer items-center justify-center rounded bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600"
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
                className={classNames(
                  "w-full transition-all",
                  !forgotPassword && "hidden",
                )}
              >
                <button
                  onClick={() => {
                    setForgotPassword(false);
                  }}
                  type="button"
                  id="back-to-login-btn"
                  className="mb-4 text-sm text-primary-400 hover:text-primary-500"
                >
                  <div className="flex justify-center">
                    <CareIcon icon="l-arrow-left" className="text-lg" />
                    <span>{t("back_to_login")}</span>
                  </div>
                </button>
                <div
                  className="mb-8 w-[300px] text-4xl font-black text-primary-600"
                  id="forgot-password-heading"
                >
                  {t("forget_password")}
                </div>
                <form onSubmit={handleForgetSubmit}>
                  <div id="forgot-password-instruction">
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
                          id="send-reset-link-btn"
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
      </div>
    </div>
  );
};

export default Login;
