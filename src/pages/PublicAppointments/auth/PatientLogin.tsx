import careConfig from "@careConfig";
import dayjs from "dayjs";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { AlertCircle, Lock } from "lucide-react";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";

import CircularProgress from "@/components/Common/CircularProgress";

import { useAuthContext } from "@/hooks/useAuthUser";
import { usePatientOtpLogin } from "@/hooks/usePatientOtpLogin";

import PatientAuthLayout from "./PatientAuthLayout";

/** Tokens are minted for 15 minutes; re-use one that still has life in it. */
const TOKEN_FRESHNESS_MINUTES = 14;

const formatCountdown = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60,
  ).padStart(2, "0")}`;

interface PatientLoginProps {
  /** Where to land after a successful verification. */
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
      dayjs().subtract(TOKEN_FRESHNESS_MINUTES, "minutes"),
    );

  useEffect(() => {
    if (hasFreshToken) {
      navigate(redirectTo ?? "/patient/select-profile");
    }
  }, [hasFreshToken, redirectTo]);

  if (isOtpSent) {
    return (
      <PatientAuthLayout onBack={restartLogin}>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          {t("patient_login__otp_heading")}
        </h1>
        <p className="mt-2.5 text-base leading-relaxed text-gray-600">
          {t("patient_login__otp_sent_to", { phone })}
          {" · "}
          <button
            type="button"
            onClick={restartLogin}
            className="font-semibold text-primary-700 hover:underline"
          >
            {t("patient_login__back_to_login")}
          </button>
        </p>

        <form
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
            containerClassName="gap-2.5"
            aria-label={t("enter_otp")}
            aria-invalid={!!otpError}
          >
            {Array.from({ length: otpLength }).map((_, index) => (
              <InputOTPGroup key={index} className="flex-1">
                <InputOTPSlot
                  index={index}
                  className={cn(
                    "h-14 w-full rounded-xl! border! text-2xl font-bold",
                    otpError
                      ? "border-red-500! text-red-600"
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
              <>
                <span className="text-sm text-gray-600">
                  {t("patient_login__resend_in")}{" "}
                  <span className="font-mono font-bold text-gray-900">
                    {formatCountdown(countdown)}
                  </span>
                </span>
                <span className="text-sm font-semibold text-gray-400">
                  {t("resend_otp")}
                </span>
              </>
            ) : (
              <>
                <span className="text-sm text-gray-600">
                  {t("didnt_receive_a_message")}
                </span>
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={isSendingOtp}
                  className="text-sm font-bold text-primary-700 hover:underline disabled:opacity-50"
                >
                  {t("resend_otp")}
                </button>
              </>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-8 h-12 w-full text-base"
            disabled={!isOtpComplete || isVerifyingOtp}
          >
            {isVerifyingOtp ? (
              <CircularProgress className="text-white" />
            ) : (
              t("patient_login__verify_continue")
            )}
          </Button>
        </form>

        <div className="mt-6 flex gap-2.5 rounded-lg border border-gray-200 bg-gray-50 p-3.5">
          <Lock className="mt-0.5 size-4 shrink-0 text-primary-700" />
          <p className="text-xs leading-snug text-gray-600">
            {t("patient_login__otp_security_note")}
          </p>
        </div>
      </PatientAuthLayout>
    );
  }

  return (
    <PatientAuthLayout
      showLogo
      footer={
        careConfig.patientSupportPhone && (
          <p className="text-center text-sm text-gray-600">
            {t("patient_login__helpline")}{" "}
            <a
              href={`tel:${careConfig.patientSupportPhone}`}
              className="font-semibold text-primary-700 hover:underline"
            >
              {careConfig.patientSupportPhone}
            </a>
          </p>
        )
      }
    >
      <h1 className="text-[28px] font-bold leading-tight tracking-tight text-gray-900">
        {t("patient_login__heading")}
      </h1>
      <p className="mt-2.5 text-base leading-relaxed text-gray-600">
        {t("patient_login__subheading", { length: otpLength })}
      </p>

      <form
        className="mt-8"
        onSubmit={(event) => {
          event.preventDefault();
          sendOtp();
        }}
      >
        <Label htmlFor="patient-login-phone" className="mb-2 block text-sm">
          {t("phone_number")}
        </Label>
        <PhoneInput
          id="patient-login-phone"
          value={phone}
          onChange={updatePhone}
          placeholder={t("enter_phone_number")}
          disabled={isSendingOtp}
          autoFocus
        />
        {phoneError && (
          <p className="mt-2 text-sm text-red-500">{t(phoneError)}</p>
        )}

        {/* Sibling label rather than a wrapping one: a <label> around a Radix
            checkbox forwards its click to the button and double-toggles it. */}
        <div className="mt-5 flex items-start gap-2.5">
          <Checkbox
            id="patient-login-consent"
            checked={hasConsented}
            onCheckedChange={(checked) => setHasConsented(checked === true)}
            className="mt-px"
          />
          <Label
            htmlFor="patient-login-consent"
            className="cursor-pointer text-xs font-normal leading-snug text-gray-600"
          >
            {t("patient_login__consent")}
          </Label>
        </div>

        <Button
          type="submit"
          size="lg"
          className="mt-7 h-12 w-full text-base"
          disabled={!isPhoneValid || !hasConsented || isSendingOtp}
        >
          {isSendingOtp ? (
            <CircularProgress className="text-white" />
          ) : (
            t("send_otp")
          )}
        </Button>
      </form>
    </PatientAuthLayout>
  );
}
