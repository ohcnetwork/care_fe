import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import { navigate } from "raviger";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { isValidPhoneNumber } from "react-phone-number-input";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";

import CircularProgress from "@/components/Common/CircularProgress";

import useAppHistory from "@/hooks/useAppHistory";
import { useAuthContext } from "@/hooks/useAuthUser";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import { TokenData } from "@/types/auth/otp";

const FormSchema = z.object({
  pin: z.string().min(5, {
    message: "Your one-time password must be 5 characters.",
  }),
});

export default function PatientLogin({
  facilityId,
  staffId,
  page,
}: {
  facilityId: string;
  staffId: string;
  page: string;
}) {
  const { goBack } = useAppHistory();
  const { t } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const OTPForm = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      pin: "",
    },
  });
  const { patientLogin } = useAuthContext();
  const { patientToken: tokenData } = useAuthContext();

  if (
    tokenData &&
    Object.keys(tokenData).length > 0 &&
    dayjs(tokenData.createdAt).isAfter(dayjs().subtract(14, "minutes"))
  ) {
    navigate(
      `/facility/${facilityId}/appointments/${staffId}/book-appointment`,
    );
  }

  const { mutate: sendOTP, isPending: isSendOTPLoading } = useMutation({
    mutationFn: mutate(routes.otp.sendOtp),
    onSuccess: () => {
      if (page === "send") {
        navigate(`/facility/${facilityId}/appointments/${staffId}/otp/verify`);
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValidPhoneNumber(phoneNumber)) {
      setError(t("phone_number_validation_error"));
      return;
    }
    sendOTP({ phone_number: phoneNumber });
  };

  const { mutate: verifyOTP, isPending: isVerifyOTPLoading } = useMutation({
    mutationFn: mutate(routes.otp.loginByOtp),
    onSuccess: (response: { access: string }) => {
      if (response.access) {
        const tokenData: TokenData = {
          token: response.access,
          phoneNumber: phoneNumber,
          createdAt: new Date().toISOString(),
        };
        patientLogin(
          tokenData,
          `/facility/${facilityId}/appointments/${staffId}/book-appointment`,
        );
      }
    },
  });

  const handleVerifySubmit = async (data: z.infer<typeof FormSchema>) => {
    verifyOTP({ phone_number: phoneNumber, otp: data.pin });
  };

  const renderPhoneNumberForm = () => {
    return (
      <div className="mt-4 flex flex-col gap-2">
        <span className="text-xl font-semibold">
          {t("enter_phone_number_to_login_register")}
        </span>
        <form
          onSubmit={handleSubmit}
          className="flex mt-2 flex-col gap-4 shadow border p-8 rounded-lg"
        >
          <div className="space-y-2">
            <Label>{t("phone_number")}</Label>
            <PhoneInput
              value={phoneNumber}
              onChange={(value) => {
                setPhoneNumber(value || "");
                setError("");
              }}
              placeholder={t("enter_phone_number")}
              disabled={isSendOTPLoading}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
          <Button
            variant="primary_gradient"
            type="submit"
            disabled={isSendOTPLoading}
          >
            <span className="bg-gradient-to-b from-white/15 to-transparent"></span>
            {isSendOTPLoading ? (
              <CircularProgress className="text-white" />
            ) : (
              t("send_otp")
            )}
          </Button>
        </form>
      </div>
    );
  };

  const renderVerifyForm = () => {
    return (
      <div className="mt-4 flex flex-col gap-1">
        <span className="text-xl font-semibold">
          {t("please_check_your_messages")}
        </span>
        <span className="text-sm">
          {t("we_ve_sent_you_a_code_to")}{" "}
          <span className="font-bold">{phoneNumber}</span>
        </span>
        <Form {...OTPForm}>
          <form
            onSubmit={OTPForm.handleSubmit(handleVerifySubmit)}
            className="flex mt-2 flex-col gap-4 shadow border p-8 rounded-lg"
          >
            <FormField
              control={OTPForm.control}
              name="pin"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center">
                  <FormLabel className="text-base flex-wrap">
                    {t("enter_the_verification_code")}
                  </FormLabel>
                  <FormControl>
                    <InputOTP
                      maxLength={5}
                      {...field}
                      className="focus:ring-0"
                      autoFocus
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot index={1} />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot index={2} />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot index={3} />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot index={4} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              variant="primary_gradient"
              type="submit"
              className="w-full h-12 text-lg"
              disabled={isVerifyOTPLoading}
            >
              {isVerifyOTPLoading ? (
                <CircularProgress className="text-white" />
              ) : (
                t("verify_otp")
              )}
            </Button>
            <a
              className="w-full text-sm underline text-center cursor-pointer text-secondary-800"
              onClick={() => sendOTP({ phone_number: phoneNumber })}
            >
              {t("didnt_receive_a_message")} {t("resend_otp")}
            </a>
          </form>
        </Form>
      </div>
    );
  };

  return (
    <div className="container max-w-3xl mx-auto p-10">
      <Button
        variant="outline"
        className="border border-secondary-400"
        onClick={() =>
          page === "send"
            ? goBack(`/facility/${facilityId}`)
            : navigate(
                `/facility/${facilityId}/appointments/${staffId}/otp/send`,
              )
        }
      >
        <span className="text-sm underline">{t("back")}</span>
      </Button>
      {page === "send" ? renderPhoneNumberForm() : renderVerifyForm()}
    </div>
  );
}
