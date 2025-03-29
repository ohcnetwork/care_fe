import { toast } from "sonner";

export interface OTPCredential {
  code: string;
}

export const autofillOtp = (
  onSuccess: (otp: string) => void,
  onError: () => void,
) => {
  if (navigator.credentials && "OTPCredential" in window) {
    toast.success("OTPCredential API is available."); // Testing toast
    navigator.credentials
      .get({ otp: { transport: ["sms"] } } as CredentialRequestOptions)
      .then((otpCredential) => {
        if (!otpCredential) {
          toast.error("No OTP received.");
          onError();
          return;
        }

        const otp = otpCredential as unknown as OTPCredential;

        if (otp.code) {
          toast.success(`Your OTP is: ${otp.code}`);
          onSuccess(otp.code);
        } else {
          toast.error("Received OTP is invalid.");
          onError();
        }
      })
      .catch((error) => {
        toast.error("OTP retrieval failed.");
        console.error("OTP retrieval error:", error);
        onError();
      });
  } else {
    toast.error("OTPCredential API is not available.");
  }
};
