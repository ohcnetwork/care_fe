import careConfig from "@careConfig";
import { useMutation } from "@tanstack/react-query";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Edit } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  formatPhoneNumberIntl,
  isValidPhoneNumber,
} from "react-phone-number-input";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { PhoneInput } from "@/components/ui/phone-input";
import { Spinner } from "@/components/ui/spinner";

import { AuthCard } from "@/components/Auth/AuthCard";
import { otpErrorMessages } from "@/components/Auth/otpErrorMessages";

import { useAuthContext } from "@/hooks/useAuthUser";

import mutate from "@/Utils/request/mutate";
import { LoginByOtpResponse, OTP_LENGTH } from "@/types/otp/otp";
import otpApi from "@/types/otp/otpApi";

export function PatientLoginForm() {
  const { t } = useTranslation();
  const { patientLogin } = useAuthContext();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((seconds) => seconds - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const { mutate: sendOtp, isPending: isSendingOtp } = useMutation({
    mutationFn: mutate(otpApi.send, { silent: true }),
    onSuccess: () => {
      setStep("otp");
      setOtp("");
      setOtpError("");
      setResendCountdown(careConfig.resendOtpTimeout);
      toast.success(t("send_otp_success"));
    },
    onError: (error) => {
      const messages = otpErrorMessages(error);
      const message =
        messages.phone_number ?? messages.error ?? t("send_otp_error");
      if (step === "phone") setPhoneError(message);
      else setOtpError(message);
    },
  });

  const { mutate: verifyOtp, isPending: isVerifyingOtp } = useMutation({
    mutationFn: mutate(otpApi.login, { silent: true }),
    onSuccess: (response: LoginByOtpResponse) => {
      patientLogin(
        {
          token: response.access,
          phoneNumber: phone,
          createdAt: new Date().toISOString(),
        },
        "/patient/home",
      );
    },
    onError: (error) => {
      const messages = otpErrorMessages(error);
      setOtpError(messages.otp ?? messages.error ?? t("invalid_otp"));
    },
  });

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step === "phone") {
      if (!isValidPhoneNumber(phone)) {
        setPhoneError(t("phone_number_validation_error"));
        return;
      }
      sendOtp({ phone_number: phone });
      return;
    }
    if (otp.length !== OTP_LENGTH) {
      setOtpError(t("invalid_otp"));
      return;
    }
    verifyOtp({ phone_number: phone, otp });
  };

  if (step === "phone") {
    return (
      <AuthCard
        title={t("patient_sign_in")}
        description={t("patient_sign_in_description")}
      >
        <form noValidate className="grid gap-6" onSubmit={handleSubmit}>
          <Field data-invalid={!!phoneError}>
            <FieldLabel htmlFor="patient-phone">{t("phone_number")}</FieldLabel>
            <PhoneInput
              id="patient-phone"
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
              aria-describedby={phoneError ? "patient-phone-error" : undefined}
            />
            {phoneError && (
              <FieldError id="patient-phone-error">{phoneError}</FieldError>
            )}
          </Field>
          <Button type="submit" disabled={isSendingOtp}>
            {isSendingOtp && (
              <Spinner data-icon="inline-start" aria-hidden="true" />
            )}
            {t("send_code")}
          </Button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={t("enter_the_code")}
      description={t("otp_sent_by_sms", { length: OTP_LENGTH })}
    >
      <form noValidate className="grid gap-6" onSubmit={handleSubmit}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xl font-semibold text-soft-foreground" dir="ltr">
            {formatPhoneNumberIntl(phone)}
          </p>
          <Button
            type="button"
            variant="tertiary"
            aria-label={t("edit_phone_number")}
            onClick={() => {
              setStep("phone");
              setOtpError("");
            }}
          >
            <Edit data-icon="inline-start" aria-hidden="true" />
            {t("edit")}
          </Button>
        </div>
        <Field data-invalid={!!otpError}>
          <FieldLabel htmlFor="patient-otp">
            {t("otp_code_label", { length: OTP_LENGTH })}
          </FieldLabel>
          <InputOTP
            id="patient-otp"
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
              setOtpError("");
            }}
            aria-invalid={!!otpError}
            aria-describedby={otpError ? "patient-otp-error" : undefined}
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
          {otpError && (
            <FieldError id="patient-otp-error">{otpError}</FieldError>
          )}
        </Field>
        <div className="flex flex-col gap-4">
          <Button type="submit" disabled={isVerifyingOtp}>
            {isVerifyingOtp && (
              <Spinner data-icon="inline-start" aria-hidden="true" />
            )}
            {t("verify_and_sign_in")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="underline underline-offset-4"
            disabled={resendCountdown > 0 || isSendingOtp}
            onClick={() => sendOtp({ phone_number: phone })}
          >
            {resendCountdown > 0
              ? t("resend_otp_timer", { time: resendCountdown })
              : t("resend_otp")}
          </Button>
        </div>
      </form>
    </AuthCard>
  );
}
