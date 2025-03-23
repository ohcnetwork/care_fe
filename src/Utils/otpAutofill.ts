export interface OTPCredential {
  code: string;
}

export const autofillOtp = (
  onSuccess: (otp: string) => void,
  onError: () => void,
) => {
  if ("OTPCredential" in window) {
    navigator.credentials
      .get({ otp: { transport: ["sms"] } } as CredentialRequestOptions)
      .then((otpCredential) => {
        const otp = otpCredential as OTPCredential | null;
        if (otp) {
          onSuccess(otp.code);
        }
      })
      .catch(() => {
        onError();
      });
  }
};
