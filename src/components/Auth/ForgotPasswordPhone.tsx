import careConfig from "@careConfig";
import { useMutation } from "@tanstack/react-query";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { isValidPhoneNumber } from "react-phone-number-input";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { PhoneInput } from "@/components/ui/phone-input";
import { Spinner } from "@/components/ui/spinner";

import { AuthCard } from "@/components/Auth/AuthCard";
import {
  PasswordErrors,
  PasswordFields,
  validatePasswordFields,
} from "@/components/Auth/PasswordFields";
import { otpErrorMessages } from "@/components/Auth/otpErrorMessages";

import { LocalStorageKeys } from "@/common/constants";

import mutate from "@/Utils/request/mutate";
import { HTTPError } from "@/Utils/request/types";
import { OTP_LENGTH } from "@/types/otp/otp";
import otpApi from "@/types/otp/otpApi";

interface ForgotPasswordPhoneProps {
  onBackToEmail: () => void;
  onSuccess: () => void;
}

interface ConfirmFieldErrors extends PasswordErrors {
  otp?: string | null;
  username?: string | null;
  error?: string | null;
}

export function ForgotPasswordPhone({
  onBackToEmail,
  onSuccess,
}: ForgotPasswordPhoneProps) {
  const { t } = useTranslation();

  const [step, setStep] = useState<"phone" | "confirm">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [username, setUsername] = useState("");
  const [requiresUsername, setRequiresUsername] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<ConfirmFieldErrors>({});
  const [phoneError, setPhoneError] = useState("");
  const [isPasswordFieldFocused, setIsPasswordFieldFocused] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((seconds) => seconds - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const { mutate: sendOtp, isPending: sendOtpPending } = useMutation({
    mutationFn: mutate(otpApi.sendPasswordResetOtp),
    onSuccess: () => {
      setStep("confirm");
      setPhoneError("");
      setResendCountdown(careConfig.resendOtpTimeout);
      toast.success(t("otp_password_reset_sent"));
    },
    onError: (error) => {
      const messages = otpErrorMessages(error);
      setPhoneError(messages.error ?? messages.otp ?? t("send_otp_error"));
    },
  });

  const { mutate: confirmReset, isPending: confirmPending } = useMutation({
    mutationFn: mutate(otpApi.confirmPasswordResetOtp, { silent: true }),
    onSuccess: () => {
      localStorage.removeItem(LocalStorageKeys.accessToken);
      localStorage.removeItem(LocalStorageKeys.refreshToken);
      toast.success(t("password_reset_success"));
      onSuccess();
      navigate("/login");
    },
    onError: (error) => {
      if (!(error instanceof HTTPError)) {
        toast.error(t("something_went_wrong"));
        return;
      }

      if (error.status === 409) {
        setRequiresUsername(true);
        setErrors({
          error:
            typeof error.cause?.error === "string"
              ? error.cause.error
              : t("multiple_users_linked_to_phone"),
        });
        return;
      }

      const messages = otpErrorMessages(error);
      setErrors(messages);
      toast.error(
        messages.otp ??
          messages.error ??
          messages.password ??
          t("something_went_wrong"),
      );
    },
  });

  const handleSendOtp = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidPhoneNumber(phone)) {
      setPhoneError(t("phone_number_validation_error"));
      return;
    }
    sendOtp({ phone_number: phone });
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: null }));
  };

  const handleConfirm = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: ConfirmFieldErrors = {
      ...validatePasswordFields(passwordForm, t),
    };
    if (otp.length !== OTP_LENGTH) {
      nextErrors.otp = t("invalid_otp");
    }
    if (requiresUsername && !username.trim()) {
      nextErrors.username = t("field_required");
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    confirmReset({
      phone_number: phone,
      otp,
      password: passwordForm.password,
      ...(requiresUsername ? { username: username.trim() } : {}),
    });
  };

  const handleChangePhone = () => {
    setStep("phone");
    setOtp("");
    setUsername("");
    setRequiresUsername(false);
    setPasswordForm({ password: "", confirm: "" });
    setErrors({});
    setIsPasswordFieldFocused(false);
  };

  if (step === "phone") {
    return (
      <AuthCard
        back={{ label: t("back_to_email_reset"), onClick: onBackToEmail }}
        title={t("reset_using_phone_number")}
        description={t("forget_password_phone_instruction")}
      >
        <form noValidate className="grid gap-6" onSubmit={handleSendOtp}>
          <Field data-invalid={!!phoneError}>
            <FieldLabel htmlFor="reset_phone">{t("phone_number")}</FieldLabel>
            <PhoneInput
              id="reset_phone"
              name="phone"
              autoFocus
              required
              placeholder={t("enter_phone_number")}
              value={phone}
              onChange={(value) => {
                setPhone(value ?? "");
                setPhoneError("");
              }}
              aria-invalid={!!phoneError}
              aria-describedby={phoneError ? "reset_phone-error" : undefined}
            />
            {phoneError && (
              <FieldError id="reset_phone-error">{phoneError}</FieldError>
            )}
          </Field>
          <Button type="submit" disabled={sendOtpPending}>
            {sendOtpPending && (
              <Spinner data-icon="inline-start" aria-hidden="true" />
            )}
            {t("send_otp")}
          </Button>
        </form>
      </AuthCard>
    );
  }

  const usernameError = errors.username || errors.error;

  return (
    <AuthCard
      back={{ label: t("change_phone_number"), onClick: handleChangePhone }}
      title={t("reset_password")}
      description={t("forget_password_phone_otp_instruction")}
    >
      <form noValidate className="grid gap-6" onSubmit={handleConfirm}>
        <Field data-invalid={!!errors.otp}>
          <FieldLabel htmlFor="reset_otp">
            {t("otp_code_label", { length: OTP_LENGTH })}
          </FieldLabel>
          <InputOTP
            id="reset_otp"
            name="otp"
            maxLength={OTP_LENGTH}
            pattern={REGEXP_ONLY_DIGITS}
            inputMode="numeric"
            autoComplete="one-time-code"
            pushPasswordManagerStrategy="none"
            autoFocus
            value={otp}
            onChange={(value) => {
              setOtp(value);
              setErrors((current) => ({ ...current, otp: null }));
            }}
            aria-invalid={!!errors.otp}
            aria-describedby={errors.otp ? "reset_otp-error" : undefined}
            containerClassName="w-full"
            className="w-full"
          >
            <InputOTPGroup className="w-full justify-between">
              {Array.from({ length: OTP_LENGTH }, (_, index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className="h-12 min-w-0 flex-1 font-mono text-lg"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {errors.otp && (
            <FieldError id="reset_otp-error">{errors.otp}</FieldError>
          )}
        </Field>

        <PasswordFields
          password={passwordForm.password}
          confirm={passwordForm.confirm}
          errors={errors}
          onChange={handlePasswordChange}
          isPasswordFieldFocused={isPasswordFieldFocused}
          onPasswordFocusChange={setIsPasswordFieldFocused}
        />

        {requiresUsername && (
          <Field data-invalid={!!usernameError}>
            <FieldLabel htmlFor="reset_username">{t("username")}</FieldLabel>
            <Input
              id="reset_username"
              name="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={t("enter_your_username")}
              value={username}
              onChange={(event) => {
                setUsername(event.target.value.toLowerCase());
                setErrors((current) => ({
                  ...current,
                  username: null,
                  error: null,
                }));
              }}
              aria-invalid={!!usernameError}
              aria-describedby="reset_username-hint"
            />
            <FieldDescription id="reset_username-hint">
              {t("multiple_users_linked_to_phone_hint")}
            </FieldDescription>
            {usernameError && <FieldError>{usernameError}</FieldError>}
          </Field>
        )}

        {!requiresUsername && errors.error && (
          <FieldError>{errors.error}</FieldError>
        )}

        <Button
          type="submit"
          disabled={
            confirmPending ||
            sendOtpPending ||
            otp.length !== OTP_LENGTH ||
            !passwordForm.password ||
            !passwordForm.confirm
          }
        >
          {confirmPending && (
            <Spinner data-icon="inline-start" aria-hidden="true" />
          )}
          {t("reset_password")}
        </Button>
      </form>

      <Alert variant="warning" role="note">
        <AlertDescription>{t("dont_share_code")}</AlertDescription>
      </Alert>

      <Button
        type="button"
        variant="ghost"
        className="underline underline-offset-4"
        disabled={resendCountdown > 0 || sendOtpPending}
        onClick={() => sendOtp({ phone_number: phone })}
      >
        {resendCountdown > 0
          ? t("resend_otp_timer", { time: resendCountdown })
          : t("resend_otp")}
      </Button>
    </AuthCard>
  );
}
