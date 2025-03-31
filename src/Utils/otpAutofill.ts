import { useCallback, useEffect, useState } from "react";

type OTPCallback = (otp: string) => void;

interface OTPCredential {
  code: string;
}

export const useWebOTP = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  let abortController: AbortController | null = null;

  useEffect(() => {
    setIsSupported(
      "OTPCredential" in window &&
        "navigator" in window &&
        typeof navigator.credentials?.get === "function",
    );
  }, []);

  const startListening = useCallback(
    (callback: OTPCallback) => {
      if (!isSupported || isListening) return;

      setIsListening(true);
      abortController = new AbortController();

      navigator.credentials
        .get({
          otp: { transport: ["sms"] },
          signal: abortController.signal,
        } as CredentialRequestOptions)
        .then((credential) => {
          if (!credential || !(credential as any).code) {
            console.error("No valid OTP received.");
            return;
          }

          const otpCredential = credential as unknown as OTPCredential;
          if (otpCredential?.code) {
            callback(otpCredential.code);
          }
        })
        .catch((error) => {
          if (error.name !== "AbortError") {
            console.error("WebOTP Error:", error);
          }
        })
        .finally(() => {
          setIsListening(false);
        });

      setTimeout(() => {
        abortController?.abort();
        setIsListening(false);
      }, 60000);
    },
    [isSupported, isListening],
  );

  const stopListening = useCallback(() => {
    if (abortController) {
      abortController.abort();
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isSupported,
    isListening,
    startListening,
    stopListening,
  };
};
