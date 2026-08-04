import careConfig from "@careConfig";
import dayjs from "dayjs";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { AlertCircle, Check, LockKeyhole } from "lucide-react";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Switch } from "@/components/ui/switch";

import CircularProgress from "@/components/Common/CircularProgress";

import { useAuthContext } from "@/hooks/useAuthUser";
import { usePatientOtpLogin } from "@/hooks/usePatientOtpLogin";

import PatientAuthLayout from "./PatientAuthLayout";

const formatCountdown = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60,
  ).padStart(2, "0")}`;

interface PatientLoginProps {
  redirectTo?: string;
}

export default function PatientLogin({ redirectTo }: PatientLoginProps) {
  const { t } = useTranslation();
  const { patientToken } = useAuthContext();
  const [hasConsented, setHasConsented] = useState(false);

  const {
    otpLength,
    phone,
    otp,
    isOtpSent,
    phoneError,
    otpError,
    countdown,
    isSendingOtp,
    isVerifyingOtp,
    isPhoneValid,
    isOtpComplete,
    updatePhone,
    updateOtp,
    sendOtp,
    resendOtp,
    verifyOtp,
    restartLogin,
  } = usePatientOtpLogin({ redirectTo });

  const hasFreshToken =
    !!patientToken?.token &&
    dayjs(patientToken.createdAt).isAfter(
      dayjs().subtract(careConfig.patientTokenFreshnessMinutes, "minutes"),
    );

  useEffect(() => {
    if (hasFreshToken) {
      navigate(redirectTo ?? "/patient/select-profile");
    }
  }, [hasFreshToken, redirectTo]);

  if (isOtpSent) {
    return (
      <PatientAuthLayout className="overflow-hidden">
        <h1 className="text-3xl font-normal leading-tight tracking-tight text-gray-900">
          {t("patient_login__otp_heading")}
        </h1>
        <p className="flex justify-between mt-2 text-base leading-relaxed text-gray-700">
          {t("patient_login__otp_sent_to", {
            phone: formatPhoneNumberIntl(phone) || phone,
          })}
          <button
            type="button"
            onClick={restartLogin}
            className="text-blue-700 underline"
          >
            {t("change_number")}
          </button>
        </p>

        <form
          id="patient-login-otp-form"
          className="mt-9"
          onSubmit={(event) => {
            event.preventDefault();
            verifyOtp();
          }}
        >
          <InputOTP
            value={otp}
            onChange={updateOtp}
            maxLength={otpLength}
            pattern={REGEXP_ONLY_DIGITS}
            autoComplete="one-time-code"
            autoFocus
            className="opacity-0!"
            containerClassName="gap-2.5"
            aria-label={t("enter_otp")}
            aria-invalid={!!otpError}
          >
            {Array.from({ length: otpLength }).map((_, index) => (
              <InputOTPGroup key={index} className="flex-1">
                <InputOTPSlot
                  index={index}
                  className={cn(
                    "h-14 w-full rounded-xl! border-[1.5px]! text-2xl font-bold",
                    otpError
                      ? "border-red-600! text-red-600"
                      : "border-gray-300!",
                  )}
                />
              </InputOTPGroup>
            ))}
          </InputOTP>

          {otpError && (
            <div className="mt-3.5 flex items-start gap-2.5 text-red-600">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p className="text-sm font-semibold leading-snug">
                {t(otpError)}
              </p>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between">
            {countdown > 0 ? (
              <span className="text-sm text-gray-700">
                {t("patient_login__resend_in")}{" "}
                <span className="font-mono font-semibold text-gray-900">
                  {formatCountdown(countdown)}
                </span>
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={isSendingOtp}
                  className="text-blue-700 underline disabled:opacity-50"
                >
                  {t("resend_otp")}
                </button>
              </>
            )}
          </div>
        </form>

        <div className="mt-6 flex gap-2.5 rounded-xl border border-gray-100 bg-gray-50 p-3.5">
          <LockKeyhole className="mt-0.5 size-4 shrink-0 text-gray-700" />
          <p className="text-sm leading-snug text-gray-600">
            {t("patient_login__otp_security_note")}
          </p>
        </div>

        <Button
          type="submit"
          form="patient-login-otp-form"
          size="lg"
          className="h-12 w-full text-base mt-7"
          disabled={!isOtpComplete || isVerifyingOtp}
        >
          {isVerifyingOtp ? (
            <CircularProgress className="text-white" />
          ) : (
            t("patient_login__verify_continue")
          )}
        </Button>
      </PatientAuthLayout>
    );
  }

  return (
    <PatientAuthLayout
      footer={
        <div className="flex flex-col gap-4">
          {isPhoneValid && hasConsented && (
            <Button
              type="submit"
              form="patient-login-phone-form"
              size="lg"
              className="h-12 w-full text-base"
              disabled={isSendingOtp}
            >
              {isSendingOtp ? (
                <CircularProgress className="text-white" />
              ) : (
                t("send_otp")
              )}
            </Button>
          )}
          {careConfig.patientSupportPhone && (
            <p className="text-center text-sm text-gray-600">
              {t("patient_login__helpline")}{" "}
              <a
                href={`tel:${careConfig.patientSupportPhone}`}
                className="font-semibold text-primary-700 hover:underline"
              >
                {careConfig.patientSupportPhone}
              </a>
            </p>
          )}
        </div>
      }
    >
      <h1 className="text-3xl font-normal leading-tight tracking-tight text-gray-900">
        {t("patient_login__heading")}
      </h1>

      <form
        id="patient-login-phone-form"
        className="mt-8"
        onSubmit={(event) => {
          event.preventDefault();
          if (!hasConsented) {
            return;
          }
          sendOtp();
        }}
      >
        <Label
          htmlFor="patient-login-phone"
          className="mb-2 block text-sm font-medium text-gray-900"
        >
          {t("mobile_number")}
        </Label>
        <PhoneInput
          id="patient-login-phone"
          className="h-13 overflow-hidden rounded-lg border border-gray-300 [&_button]:border-0 [&_button]:bg-gray-50 [&_input]:border-0 [&_input]:border-l [&_input]:border-l-gray-300"
          value={phone}
          onChange={updatePhone}
          placeholder={t("enter_phone_number")}
          disabled={isSendingOtp}
          autoFocus
        />
        {phoneError ? (
          <p className="mt-1.5 text-sm text-red-600">{t(phoneError)}</p>
        ) : isPhoneValid ? (
          <p className="mt-1 flex items-center gap-1.5 text-sm font-normal text-primary-700">
            <Check className="size-4 shrink-0" />
            {t("patient_login__phone_valid")}
          </p>
        ) : (
          <p className="mt-1 flex items-center gap-1.5 text-sm font-normal text-gray-600">
            {t("patient_login__phone_helper")}
          </p>
        )}

        <div className="relative mt-5 flex flex-col gap-2 rounded-lg border border-gray-200 p-3.5">
          {isPhoneValid && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-primary-500 animate-[caret-blink_1.5s_ease-out_3]"
            />
          )}
          <div className="flex items-start justify-between gap-3">
            <Label
              htmlFor="patient-login-consent"
              className="cursor-pointer text-sm font-medium leading-snug text-gray-800"
            >
              {t("patient_login__consent")}
            </Label>
            <Switch
              id="patient-login-consent"
              checked={hasConsented}
              onCheckedChange={setHasConsented}
              className="mt-0.5 shrink-0 data-[state=checked]:bg-primary-700"
            />
          </div>
        </div>
      </form>
    </PatientAuthLayout>
  );
}
