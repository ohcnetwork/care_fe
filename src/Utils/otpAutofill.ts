import { toast } from "sonner";

export interface OTPCredential {
  code: string;
}

export const autofillOtp = (
  onSuccess: (otp: string) => void,
  onError: () => void,
) => {
  if ("OTPCredential" in window) {
    toast.success("OTPCredential API is available."); // Testing toast
    navigator.credentials
      .get({ otp: { transport: ["sms"] } } as CredentialRequestOptions)
      .then((otpCredential) => {
        toast.success("OTP retrieval initiated."); // Testing toast
        const otp = otpCredential as OTPCredential | null;
        if (otp) {
          onSuccess(otp.code);
          toast.success(`Your OTP is: ${otp.code}`);
        } else {
          toast.error("No OTP received."); // Testing toast
        }
      })
      .catch(() => {
        toast.error("OTP retrieval failed."); // Testing toast
        onError();
      });
  } else {
    toast.error("OTPCredential API is not available."); // Testing toast
  }
};
