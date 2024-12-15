import { navigate } from "raviger";
import { useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import { PhoneNumberValidator } from "@/components/Form/FieldValidators";
import OtpFormField from "@/components/Form/FormFields/OtpFormField";
import PhoneNumberFormField from "@/components/Form/FormFields/PhoneNumberFormField";

import useAppHistory from "@/hooks/useAppHistory";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { parsePhoneNumber } from "@/Utils/utils";

export default function OTP({
  facilityId,
  staffUsername,
  page,
}: {
  facilityId: string;
  staffUsername: string;
  page: string;
}) {
  const { goBack } = useAppHistory();
  const [phoneNumber, setPhoneNumber] = useState("+91");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const validate = (phoneNumber: string) => {
    let errors = "";

    const parsedPhoneNumber = parsePhoneNumber(phoneNumber);
    if (
      !parsedPhoneNumber ||
      !(PhoneNumberValidator(["mobile"])(parsedPhoneNumber ?? "") === undefined)
    ) {
      errors = "Please enter valid phone number";
    }
    return errors;
  };

  const handleSendOTP = async (phoneNumber: string) => {
    const response = await request(routes.otp.sendOtp, {
      body: {
        phone_number: phoneNumber,
      },
    });
    if (response.res?.status === 200 && page === "send") {
      navigate(
        `/facility/${facilityId}/appointments/${staffUsername}/otp/verify`,
      );
    }
    // To Do: Mock, remove this
    navigate(
      `/facility/${facilityId}/appointments/${staffUsername}/otp/verify`,
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validate(phoneNumber);
    if (errors !== "") {
      setError(errors);
      return;
    }
    handleSendOTP(phoneNumber);
  };

  const handleVerifySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const response = await request(routes.otp.loginByOtp, {
      body: {
        phone_number: phoneNumber,
        otp: otp,
      },
    });
    if (response.res?.status === 200) {
      navigate(
        `/facility/${facilityId}/appointments/${staffUsername}/book-appointment`,
      );
      localStorage.setItem("phoneNumber", phoneNumber);
    }
    // To Do: Mock, remove this
    navigate(
      `/facility/${facilityId}/appointments/${staffUsername}/book-appointment`,
    );
    localStorage.setItem("phoneNumber", phoneNumber);
  };

  const renderPhoneNumberForm = () => {
    return (
      <div className="mt-4 flex flex-col gap-2">
        <span className="text-xl font-semibold">
          Enter phone number to login/register
        </span>
        <form
          onSubmit={handleSubmit}
          className="flex mt-2 flex-col gap-4 shadow border p-8 rounded-lg"
        >
          <div className="space-y-4">
            <PhoneNumberFormField
              name="phone_number"
              label="Phone Number"
              required
              types={["mobile"]}
              onChange={(e) => setPhoneNumber(e.value)}
              value={phoneNumber}
              error={error}
            />
          </div>
          <Button
            variant="primary_gradient"
            type="submit"
            className="w-full h-12 text-lg"
          >
            <span className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent"></span>
            Send OTP
          </Button>
        </form>
      </div>
    );
  };

  const renderVerifyForm = () => {
    return (
      <div className="mt-4 flex flex-col gap-1">
        <span className="text-xl font-semibold">
          Please check your messages
        </span>
        <span className="text-sm">
          We've sent you a code to{" "}
          <span className="font-bold">{phoneNumber}</span>
        </span>
        <form
          onSubmit={handleVerifySubmit}
          className="flex mt-2 flex-col gap-4 shadow border p-8 rounded-lg"
        >
          <div className="flex flex-col space-y-4">
            <span className="text-xl self-center">
              Enter the verification code sent to your phone
            </span>
            <OtpFormField
              name="otp"
              required
              onChange={(e) => setOtp(e.toString())}
              value={otp}
              error={error}
              length={4}
            />
          </div>
          <Button
            variant="primary_gradient"
            type="submit"
            className="w-full h-12 text-lg"
          >
            Verify OTP
          </Button>
          <a
            className="w-full text-sm underline text-center cursor-pointer text-secondary-800"
            onClick={() => handleSendOTP(phoneNumber)}
          >
            Didn't receive a message? Resend
          </a>
        </form>
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
            ? goBack()
            : navigate(
                `/facility/${facilityId}/appointments/${staffUsername}/otp/send`,
              )
        }
      >
        <CareIcon icon="l-square-shape" className="h-4 w-4 mr-1" />
        <span className="text-sm underline">Back</span>
      </Button>
      {page === "send" ? renderPhoneNumberForm() : renderVerifyForm()}
    </div>
  );
}
