import careConfig from "@careConfig";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { isValidPhoneNumber } from "react-phone-number-input";
import { toast } from "sonner";

import { useAuthContext } from "@/hooks/useAuthUser";
import {
  LoginByOtpRequest,
  LoginByOtpResponse,
  TokenData,
} from "@/types/otp/otp";
import otpApi from "@/types/otp/otpApi";
import mutate from "@/Utils/request/mutate";

const extractOtpErrorMessage = (error: unknown, fallback: string) => {
  const cause = (error as { cause?: unknown })?.cause;

  // Backend validation errors: { errors: [{ msg: "..." | { otp: "..." } }] }
  const errors = (cause as { errors?: unknown })?.errors;
  if (Array.isArray(errors)) {
    for (const item of errors) {
      const msg = (item as { msg?: unknown })?.msg;
      if (typeof msg === "string") {
        return msg;
      }
      if (msg && typeof msg === "object") {
        const firstValue = Object.values(msg).find(
          (value) => typeof value === "string",
        );
        if (firstValue) {
          return firstValue as string;
        }
      }
    }
  }

  // Fallback to the raw error message the request layer produced.
  const message = (error as { message?: unknown })?.message;
  return typeof message === "string" && message ? message : fallback;
};

/**
 * Drives the phone-number → OTP login used by both the dedicated patient
 * login screen and the patient tab on `/login`.
 *
 * The number of OTP digits comes from `careConfig.otpLength` so it tracks the
 * backend's `OTP_LENGTH` setting rather than being hardcoded per call site.
 */
export function usePatientOtpLogin({
  redirectTo = "/patient/select-profile",
}: { redirectTo?: string } = {}) {
  const { t } = useTranslation();
  const { patientLogin } = useAuthContext();
  const { otpLength, resendOtpTimeout } = careConfig;

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setCountdown((remaining) => remaining - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const { mutate: sendOtpRequest, isPending: isSendingOtp } = useMutation({
    mutationFn: mutate(otpApi.send, { silent: true }),
    onSuccess: () => {
      setIsOtpSent(true);
      setPhoneError("");
      setCountdown(resendOtpTimeout);
      toast.success(t("send_otp_success"));
    },
    onError: (error: unknown) => {
      setPhoneError(extractOtpErrorMessage(error, "send_otp_error"));
    },
  });

  const { mutate: verifyOtpRequest, isPending: isVerifyingOtp } = useMutation({
    mutationFn: async (data: LoginByOtpRequest) => {
      const response = await mutate(otpApi.login, { silent: true })(data);
      if ("errors" in response) {
        throw response;
      }
      return response;
    },
    onSuccess: (response: LoginByOtpResponse) => {
      if (!response.access) {
        return;
      }
      setOtpError("");
      const tokenData: TokenData = {
        token: response.access,
        phoneNumber: phone,
        createdAt: new Date().toISOString(),
      };
      patientLogin(tokenData, redirectTo);
    },
    onError: (error: unknown) => {
      setOtpError(extractOtpErrorMessage(error, "invalid_otp"));
    },
  });

  const sendOtp = useCallback(() => {
    if (!isValidPhoneNumber(phone)) {
      setPhoneError("phone_number_validation_error");
      return;
    }
    sendOtpRequest({ phone_number: phone });
  }, [phone, sendOtpRequest]);

  const resendOtp = useCallback(() => {
    setOtp("");
    setOtpError("");
    sendOtpRequest({ phone_number: phone });
  }, [phone, sendOtpRequest]);

  const verifyOtp = useCallback(() => {
    verifyOtpRequest({ phone_number: phone, otp });
  }, [otp, phone, verifyOtpRequest]);

  /**
   * Returns to a pristine login screen. Everything is cleared, including the
   * number itself — a partial reset that keeps the previous E.164 value around
   * is what made "Change" flaky, and re-entering the number is the point.
   */
  const restartLogin = useCallback(() => {
    setIsOtpSent(false);
    setPhone("");
    setOtp("");
    setPhoneError("");
    setOtpError("");
    setCountdown(0);
  }, []);

  const updatePhone = useCallback((value?: string) => {
    setPhone(value ?? "");
    setPhoneError("");
  }, []);

  const updateOtp = useCallback((value: string) => {
    setOtp(value);
    setOtpError("");
  }, []);

  return {
    otpLength,
    phone,
    otp,
    isOtpSent,
    phoneError,
    otpError,
    countdown,
    isSendingOtp,
    isVerifyingOtp,
    isPhoneValid: isValidPhoneNumber(phone),
    isOtpComplete: otp.length === otpLength,
    updatePhone,
    updateOtp,
    sendOtp,
    resendOtp,
    verifyOtp,
    restartLogin,
  };
}
