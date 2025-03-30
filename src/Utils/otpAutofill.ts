import { useEffect } from "react";

const autofillOtp = (
  setOtp: (otp: string) => void,
  setOtpValidationError: (error: string) => void,
) => {
  useEffect(() => {
    if (!("OTPCredential" in window)) return;

    const ac = new AbortController();

    navigator.credentials
      .get({
        // @ts-expect-error: Using experimental OTPCredential API
        otp: { transport: ["sms"] } as any,
        signal: ac.signal,
      })
      .then((otp: any) => {
        setOtp(otp.code);
        setOtpValidationError(""); // Clear error on successful OTP retrieval
      })
      .catch((err) => {
        console.error("OTP Retrieval Failed:", err);
      });

    return () => ac.abort();
  }, [setOtp, setOtpValidationError]);
};

export default autofillOtp;
