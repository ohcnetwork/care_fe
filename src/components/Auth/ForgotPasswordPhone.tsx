import careConfig from "@careConfig";
import { useMutation } from "@tanstack/react-query";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { isValidPhoneNumber } from "react-phone-number-input";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";

import {
  PasswordErrors,
  PasswordFields,
  validatePasswordFields,
} from "@/components/Auth/PasswordFields";
import CircularProgress from "@/components/Common/CircularProgress";

import { LocalStorageKeys } from "@/common/constants";

import mutate from "@/Utils/request/mutate";
import { HTTPError } from "@/Utils/request/types";
import otpApi from "@/types/otp/otpApi";

const OTP_LENGTH = 5;

type PhoneResetStep = "phone" | "confirm";

interface ForgotPasswordPhoneProps {
  onBackToEmail: () => void;
  onSuccess: () => void;
}

interface ConfirmFieldErrors extends PasswordErrors {
  otp?: string | null;
  username?: string | null;
  error?: string | null;
}

function extractFieldErrors(cause: unknown): ConfirmFieldErrors {
  const result: ConfirmFieldErrors = {};
  if (!cause || typeof cause !== "object") return result;

  const data = cause as Record<string, unknown>;
  const errors = data.errors;

  if (Array.isArray(errors)) {
    for (const entry of errors) {
      if (!entry || typeof entry !== "object") continue;
      const msg = (entry as { msg?: unknown }).msg;
      if (typeof msg === "string") {
        result.error = msg;
      } else if (msg && typeof msg === "object") {
        for (const [key, value] of Object.entries(
          msg as Record<string, unknown>,
        )) {
          if (typeof value === "string") {
            result[key as keyof ConfirmFieldErrors] = value;
          } else if (Array.isArray(value) && typeof value[0] === "string") {
            result[key as keyof ConfirmFieldErrors] = value[0];
          }
        }
      }
    }
  }

  if (typeof data.error === "string") {
    result.error = data.error;
  }
  if (typeof data.otp === "string") {
    result.otp = data.otp;
  }
  if (typeof data.password === "string") {
    result.password = data.password;
  }

  return result;
}

export function ForgotPasswordPhone({
  onBackToEmail,
  onSuccess,
}: ForgotPasswordPhoneProps) {
  const { t } = useTranslation();
  const { resendOtpTimeout } = careConfig;

  const [step, setStep] = useState<PhoneResetStep>("phone");
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
  const [resendOtpCountdown, setResendOtpCountdown] = useState(0);

  useEffect(() => {
    if (resendOtpCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendOtpCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendOtpCountdown]);

  const { mutate: sendOtp, isPending: sendOtpPending } = useMutation({
    mutationFn: mutate(otpApi.sendPasswordResetOtp),
    onSuccess: () => {
      setStep("confirm");
      setPhoneError("");
      setResendOtpCountdown(resendOtpTimeout);
      toast.success(t("otp_password_reset_sent"));
    },
    onError: (error) => {
      const fieldErrors = extractFieldErrors(error.cause);
      setPhoneError(
        fieldErrors.error || fieldErrors.otp || t("send_otp_error"),
      );
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
        const message =
          typeof error.cause?.error === "string"
            ? error.cause.error
            : t("multiple_users_linked_to_phone");
        setErrors({ error: message });
        return;
      }

      const fieldErrors = extractFieldErrors(error.cause);
      setErrors(fieldErrors);
      if (fieldErrors.otp) {
        toast.error(fieldErrors.otp);
      } else if (fieldErrors.error) {
        toast.error(fieldErrors.error);
      } else if (fieldErrors.password) {
        toast.error(
          typeof fieldErrors.password === "string"
            ? fieldErrors.password
            : t("invalid_password"),
        );
      } else {
        toast.error(t("something_went_wrong"));
      }
    },
  });

  const handleSendOtp = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValidPhoneNumber(phone)) {
      setPhoneError(t("phone_number_validation_error"));
      return;
    }
    setPhoneError("");
    sendOtp({ phone_number: phone });
  };

  const handleResendOtp = () => {
    if (resendOtpCountdown > 0 || !isValidPhoneNumber(phone)) return;
    sendOtp({ phone_number: phone });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ConfirmFieldErrors]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleConfirm = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nextErrors: ConfirmFieldErrors = {};
    if (otp.length !== OTP_LENGTH) {
      nextErrors.otp = t("invalid_otp");
    }

    const passwordErrors = validatePasswordFields(passwordForm, t);
    if (passwordErrors) {
      Object.assign(nextErrors, passwordErrors);
    }

    if (requiresUsername && !username.trim()) {
      nextErrors.username = t("field_required");
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
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
      <form onSubmit={handleSendOtp} className="space-y-4">
        <Button
          variant="link"
          type="button"
          onClick={onBackToEmail}
          className="px-0 mb-4 flex items-center gap-2"
        >
          <CareIcon icon="l-arrow-left" className="text-lg" />
          <span>{t("back_to_email_reset")}</span>
        </Button>

        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t("reset_using_phone_number")}
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              {t("forget_password_phone_instruction")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset_phone">{t("phone_number")}</Label>
            <PhoneInput
              id="reset_phone"
              name="phone"
              value={phone}
              onChange={(value) => {
                setPhone(value ?? "");
                setPhoneError("");
              }}
              placeholder={t("enter_phone_number")}
            />
            {phoneError && <p className="text-sm text-red-500">{phoneError}</p>}
          </div>

          <Button
            type="submit"
            className="w-full"
            variant="primary"
            disabled={sendOtpPending || !isValidPhoneNumber(phone)}
          >
            {sendOtpPending ? (
              <CircularProgress className="text-white" />
            ) : (
              t("send_otp")
            )}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleConfirm} className="space-y-4">
      <Button
        variant="link"
        type="button"
        onClick={handleChangePhone}
        className="px-0 mb-4 flex items-center gap-2"
      >
        <CareIcon icon="l-arrow-left" className="text-lg" />
        <span>{t("change_phone_number")}</span>
      </Button>

      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {t("reset_password")}
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            {t("forget_password_phone_otp_instruction")}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reset_otp">{t("enter_otp")}</Label>
          <div className="flex justify-center">
            <InputOTP
              id="reset_otp"
              maxLength={OTP_LENGTH}
              value={otp}
              onChange={(value) => {
                setOtp(value);
                if (errors.otp) {
                  setErrors((prev) => ({ ...prev, otp: null }));
                }
              }}
              pattern={REGEXP_ONLY_DIGITS}
            >
              <InputOTPGroup>
                {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className={cn(errors.otp && "border-red-500")}
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          {errors.otp && (
            <p className="text-sm text-red-500 text-center">{errors.otp}</p>
          )}
        </div>

        <PasswordFields
          password={passwordForm.password}
          confirm={passwordForm.confirm}
          errors={errors}
          onChange={handlePasswordChange}
          isPasswordFieldFocused={isPasswordFieldFocused}
          onPasswordFocusChange={setIsPasswordFieldFocused}
        />

        {requiresUsername && (
          <div className="space-y-2">
            <Label htmlFor="reset_username">{t("username")}</Label>
            <Input
              id="reset_username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.toLowerCase());
                if (errors.username || errors.error) {
                  setErrors((prev) => ({
                    ...prev,
                    username: null,
                    error: null,
                  }));
                }
              }}
              placeholder={t("enter_your_username")}
              className={cn(
                (errors.username || errors.error) &&
                  "border-red-500 focus-visible:ring-red-500",
              )}
            />
            {(errors.username || errors.error) && (
              <p className="text-sm text-red-500">
                {errors.username || errors.error}
              </p>
            )}
            <p className="text-xs text-gray-500">
              {t("multiple_users_linked_to_phone_hint")}
            </p>
          </div>
        )}

        {!requiresUsername && errors.error && (
          <p className="text-sm text-red-500">{errors.error}</p>
        )}

        <Button
          type="submit"
          className="w-full"
          variant="primary"
          disabled={
            confirmPending ||
            otp.length !== OTP_LENGTH ||
            !passwordForm.password ||
            !passwordForm.confirm
          }
        >
          {confirmPending ? (
            <CircularProgress className="text-white" />
          ) : (
            t("reset_password")
          )}
        </Button>

        <p className="text-sm text-red-500 font-base">{t("dont_share_code")}</p>

        <div className="text-center">
          {resendOtpCountdown <= 0 ? (
            <Button
              variant="link"
              type="button"
              onClick={handleResendOtp}
              disabled={sendOtpPending}
              className="px-0"
            >
              {t("resend_otp")}
            </Button>
          ) : (
            <p className="text-sm text-gray-500">
              {t("resend_otp_timer", { time: resendOtpCountdown })}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
