import careConfig from "@careConfig";
import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/input-password";
import { Spinner } from "@/components/ui/spinner";

import { AuthCard } from "@/components/Auth/AuthCard";

import { useAuthContext } from "@/hooks/useAuthUser";

import FiltersCache from "@/Utils/FiltersCache";
import ViewCache from "@/Utils/ViewCache";
import { clearQueryPersistenceCache } from "@/Utils/request/queryClient";
import { HTTPError } from "@/Utils/request/types";
import { invalidateAllPaymentReconcilationLocationCaches } from "@/atoms/paymentReconcilationLocationAtom";
import { clearQueuePractitionerCache } from "@/atoms/queuePractitionerAtom";

// Only shown after repeated failed attempts (HTTP 429).
const ReCaptcha = lazy(() => import("react-google-recaptcha"));

interface StaffLoginFormProps {
  username: string;
  onUsernameChange: (username: string) => void;
  onForgotPassword: () => void;
}

export function StaffLoginForm({
  username,
  onUsernameChange,
  onForgotPassword,
}: StaffLoginFormProps) {
  const { t } = useTranslation();
  const { signIn, isAuthenticating } = useAuthContext();
  const [password, setPassword] = useState("");
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaResponse, setCaptchaResponse] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = {
      username: /\w/.test(username) ? undefined : t("field_required"),
      password: password ? undefined : t("field_required"),
    };
    setErrors(nextErrors);
    if (nextErrors.username || nextErrors.password) return;

    ViewCache.invalidateAll();
    FiltersCache.invalidateAll();
    invalidateAllPaymentReconcilationLocationCaches();
    clearQueuePractitionerCache();
    clearQueryPersistenceCache();
    // Warm the 2FA step while credentials are being checked.
    import("@/components/Auth/Authenticate");
    try {
      await signIn({
        username,
        password,
        ...(captchaRequired && captchaResponse
          ? { "g-recaptcha-response": captchaResponse }
          : {}),
      });
    } catch (error) {
      if (error instanceof HTTPError) {
        setCaptchaRequired(error.status === 429);
      }
    }
  };

  return (
    <AuthCard
      title={t("staff_sign_in")}
      description={t("staff_sign_in_description")}
    >
      <form noValidate className="grid gap-6" onSubmit={handleSubmit}>
        <Field data-invalid={!!errors.username}>
          <FieldLabel htmlFor="username">{t("username")}</FieldLabel>
          <Input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
            required
            placeholder={t("enter_your_username")}
            value={username}
            onChange={(event) => {
              onUsernameChange(event.target.value.toLowerCase());
              setErrors((current) => ({ ...current, username: undefined }));
            }}
            aria-invalid={!!errors.username}
            aria-describedby={errors.username ? "username-error" : undefined}
          />
          {errors.username && (
            <FieldError id="username-error">{errors.username}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">{t("password")}</FieldLabel>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((current) => ({ ...current, password: undefined }));
            }}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password && (
            <FieldError id="password-error">{errors.password}</FieldError>
          )}
        </Field>

        {captchaRequired && careConfig.reCaptchaSiteKey && (
          <Suspense fallback={null}>
            <ReCaptcha
              sitekey={careConfig.reCaptchaSiteKey}
              onChange={setCaptchaResponse}
            />
          </Suspense>
        )}

        <div className="flex flex-col gap-4">
          <Button type="submit" disabled={isAuthenticating}>
            {isAuthenticating && (
              <Spinner data-icon="inline-start" aria-hidden="true" />
            )}
            {t("sign_in")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="underline underline-offset-4"
            onClick={onForgotPassword}
          >
            {t("forget_password")}
          </Button>
        </div>
      </form>
    </AuthCard>
  );
}
