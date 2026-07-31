import careConfig from "@careConfig";
import { useMutation } from "@tanstack/react-query";
import { navigate, useQueryParams } from "raviger";
import { useEffect, useState } from "react";
import ReCaptcha from "react-google-recaptcha";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/input-password";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ForgotPasswordPanel } from "@/components/Auth/ForgotPasswordPanel";
import CircularProgress from "@/components/Common/CircularProgress";
import LanguageSelectorLogin from "@/components/Common/LanguageSelectorLogin";

import { useAuthContext } from "@/hooks/useAuthUser";

import { LocalStorageKeys } from "@/common/constants";

import FiltersCache from "@/Utils/FiltersCache";
import ViewCache from "@/Utils/ViewCache";
import mutate from "@/Utils/request/mutate";
import { HTTPError } from "@/Utils/request/types";
import authApi from "@/types/auth/authApi";

import { clearQueryPersistenceCache } from "@/Utils/request/queryClient";
import { invalidateAllPaymentReconcilationLocationCaches } from "@/atoms/paymentReconcilationLocationAtom";
import { clearQueuePractitionerCache } from "@/atoms/queuePractitionerAtom";
import { AuthHero } from "./AuthHero";

type LoginMode = "staff" | "patient";

interface LoginProps {
  forgot?: boolean;
}

const Login = (props: LoginProps) => {
  const { signIn, isAuthenticating } = useAuthContext();
  const {
    reCaptchaSiteKey,
    urls,
    stateLogo,
    customLogo,
    customLogoAlt,
    disablePatientLogin,
  } = careConfig;
  const initForm: any = {
    username: "",
    password: "",
  };
  const { forgot } = props;
  const [params, setQueryParams] = useQueryParams();
  const { mode } = params;
  const initErr: any = {};
  const [form, setForm] = useState(initForm);
  const [errors, setErrors] = useState(initErr);
  const [isCaptchaEnabled, setCaptcha] = useState(false);
  const { t } = useTranslation();
  const [forgotPassword, setForgotPassword] = useState(forgot);

  // Remember the last login mode
  useEffect(() => {
    localStorage.setItem(LocalStorageKeys.loginPreference, mode);
  }, [mode]);

  // Forgot Password Mutation
  const { mutate: submitForgetPassword, isPending: forgotPasswordPending } =
    useMutation({
      mutationFn: mutate(authApi.forgotPassword),
      onSuccess: () => {
        toast.success(t("password_sent"));
      },
    });

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

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    ViewCache.invalidateAll();
    const validated = validateData();
    if (!validated) return;

    FiltersCache.invalidateAll();
    invalidateAllPaymentReconcilationLocationCaches();
    clearQueuePractitionerCache();
    clearQueryPersistenceCache();
    try {
      await signIn(validated);
    } catch (error) {
      if (error instanceof HTTPError) {
        setCaptcha(error.status == 429);
      }
    }
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
  const handleForgetSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const valid = validateForgetData();
    if (!valid) return;

    submitForgetPassword(valid);
  };

  const onCaptchaChange = (value: any) => {
    if (value && isCaptchaEnabled) {
      const formCaptcha = { ...form };
      formCaptcha["g-recaptcha-response"] = value;
      setForm(formCaptcha);
    }
  };

  // Loading state derived from mutations
  const isLoading = isAuthenticating;

  const logos = [stateLogo, customLogo].filter(
    (logo) => logo?.light || logo?.dark,
  );

  return (
    <div className="relative flex min-h-screen flex-col md:h-screen md:flex-row">
      <AuthHero />

      {/* Login Forms Section */}
      <div className="login-hero-form my-4 w-full md:mt-0 md:h-full md:w-1/2">
        <div className="relative h-full items-center flex justify-center md:flex">
          <div className="w-full max-w-[400px] space-y-6">
            {/* Logo for Mobile */}
            <div className="px-4 flex items-center mx-auto gap-4 md:hidden">
              {logos.map((logo, index) =>
                logo && logo.dark ? (
                  <div key={index} className="flex items-center">
                    <img
                      src={logo.dark}
                      className="h-14 rounded-lg py-3"
                      alt="state logo"
                    />
                  </div>
                ) : null,
              )}
              {logos.length === 0 && (
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
              )}
            </div>
            <Card className="mx-4">
              <CardHeader className="space-y-1 px-4">
                <CardTitle className="text-2xl font-bold">
                  {t("welcome_back")}
                </CardTitle>
                <CardDescription>
                  {disablePatientLogin
                    ? t("sign_in_to_your_account_to_continue")
                    : t("choose_your_login_method_to_continue")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {disablePatientLogin ? (
                  <>
                    {/* Staff Login */}
                    {!forgotPassword ? (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="username">{t("username")}</Label>
                          <Input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            value={form.username}
                            onChange={handleChange}
                            className={cn(
                              errors.username &&
                                "border-red-500 focus-visible:ring-red-500",
                            )}
                          />
                          {errors.username && (
                            <p className="text-sm text-red-500">
                              {t(errors.username)}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">{t("password")}</Label>
                          <PasswordInput
                            id="password"
                            name="password"
                            autoComplete="current-password"
                            value={form.password}
                            onChange={handleChange}
                            className={cn(
                              errors.password &&
                                "border-red-500 focus-visible:ring-red-500",
                            )}
                          />
                          {errors.password && (
                            <p className="text-sm text-red-500">
                              {t(errors.password)}
                            </p>
                          )}
                        </div>

                        {isCaptchaEnabled && reCaptchaSiteKey && (
                          <div className="py-4">
                            <ReCaptcha
                              sitekey={reCaptchaSiteKey}
                              onChange={onCaptchaChange}
                            />
                          </div>
                        )}

                        <Button
                          variant="link"
                          type="button"
                          onClick={() => setForgotPassword(true)}
                          className="px-0"
                        >
                          {t("forget_password")}
                        </Button>

                        <Button
                          type="submit"
                          className="w-full"
                          variant="primary"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <CircularProgress className="text-white" />
                          ) : (
                            t("login")
                          )}
                        </Button>
                      </form>
                    ) : (
                      <ForgotPasswordPanel
                        username={form.username}
                        usernameError={errors.username}
                        onUsernameChange={handleChange}
                        onSubmitEmail={handleForgetSubmit}
                        onBackToLogin={() => setForgotPassword(false)}
                        isSubmitting={isLoading || forgotPasswordPending}
                      />
                    )}
                  </>
                ) : (
                  <Tabs
                    value="staff"
                    onValueChange={(value) =>
                      setQueryParams({ mode: value as LoginMode })
                    }
                  >
                    <TabsList className="flex w-full">
                      <TabsTrigger className="flex-1" value="staff">
                        {t("staff_login")}
                      </TabsTrigger>
                      {!disablePatientLogin && (
                        <TabsTrigger
                          className="flex-1"
                          value="patient"
                          onClick={() => navigate("/patient/login")}
                        >
                          {t("patient_login")}
                        </TabsTrigger>
                      )}
                    </TabsList>

                    {/* Staff Login */}
                    <TabsContent value="staff">
                      {!forgotPassword ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="username">{t("username")}</Label>
                            <Input
                              id="username"
                              name="username"
                              type="text"
                              autoComplete="username"
                              value={form.username}
                              onChange={handleChange}
                              className={cn(
                                errors.username &&
                                  "border-red-500 focus-visible:ring-red-500",
                              )}
                            />
                            {errors.username && (
                              <p className="text-sm text-red-500">
                                {t(errors.username)}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="password">{t("password")}</Label>
                            <PasswordInput
                              id="password"
                              name="password"
                              autoComplete="current-password"
                              value={form.password}
                              onChange={handleChange}
                              className={cn(
                                errors.password &&
                                  "border-red-500 focus-visible:ring-red-500",
                              )}
                            />
                            {errors.password && (
                              <p className="text-sm text-red-500">
                                {t(errors.password)}
                              </p>
                            )}
                          </div>

                          {isCaptchaEnabled && reCaptchaSiteKey && (
                            <div className="py-4">
                              <ReCaptcha
                                sitekey={reCaptchaSiteKey}
                                onChange={onCaptchaChange}
                              />
                            </div>
                          )}

                          <Button
                            variant="link"
                            type="button"
                            onClick={() => setForgotPassword(true)}
                            className="px-0"
                          >
                            {t("forget_password")}
                          </Button>

                          <Button
                            type="submit"
                            className="w-full"
                            variant="primary"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <CircularProgress className="text-white" />
                            ) : (
                              t("login")
                            )}
                          </Button>
                        </form>
                      ) : (
                        <ForgotPasswordPanel
                          username={form.username}
                          usernameError={errors.username}
                          onUsernameChange={handleChange}
                          onSubmitEmail={handleForgetSubmit}
                          onBackToLogin={() => setForgotPassword(false)}
                          isSubmitting={isLoading || forgotPasswordPending}
                        />
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>

            <LanguageSelectorLogin />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
