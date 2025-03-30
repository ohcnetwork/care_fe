import { useEffect } from "react";

interface OtpCredentialRequestOptions extends CredentialRequestOptions {
  otp?: { transport: string[] };
}

const autofillOtp = (
  setOtp: (otp: string) => void,
  setOtpValidationError: (error: string) => void,
) => {
  useEffect(() => {
    if (!("OTPCredential" in window)) return;

    const ac = new AbortController();

    navigator.credentials
      .get({
        otp: { transport: ["sms"] },
        signal: ac.signal,
      } as OtpCredentialRequestOptions)
      .then((otp: any) => {
        setOtp(otp.code);
        setOtpValidationError("");
      })
      .catch((err) => {
        console.error("OTP Retrieval Failed:", err);
      });

    return () => ac.abort();
  }, [setOtp, setOtpValidationError]);
};

export default autofillOtp;
