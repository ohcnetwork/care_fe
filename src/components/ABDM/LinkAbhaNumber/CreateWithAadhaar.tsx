import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import useMultiStepForm, {
  InjectedStepProps,
} from "@/components/ABDM/LinkAbhaNumber/useMultiStepForm";
import { AbhaNumberModel } from "@/components/ABDM/types/abha";
import ButtonV2, { ButtonWithTimer } from "@/components/Common/ButtonV2";
import CheckBoxFormField from "@/components/Form/FormFields/CheckBoxFormField";
import OtpFormField from "@/components/Form/FormFields/OtpFormField";
import PhoneNumberFormField from "@/components/Form/FormFields/PhoneNumberFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import { validateRule } from "@/components/Users/UserAdd";

import * as Notify from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { classNames } from "@/Utils/utils";

const MAX_OTP_RESEND_ALLOWED = 2;

type ICreateWithAadhaarProps = {
  onSuccess: (abhaNumber: AbhaNumberModel) => void;
};

type Memory = {
  aadhaarNumber: string;
  mobileNumber: string;

  isLoading: boolean;
  validationError: string;

  transactionId: string;
  abhaNumber: AbhaNumberModel | null;

  resendOtpCount: number;
};

export default function CreateWithAadhaar({
  onSuccess,
}: ICreateWithAadhaarProps) {
  const { currentStep } = useMultiStepForm<Memory>(
    [
      <EnterAadhaar {...({} as IEnterAadhaarProps)} />,
      <VerifyAadhaar {...({} as IVerifyAadhaarProps)} />,
      <HandleExistingAbhaNumber
        {...({ onSuccess } as IHandleExistingAbhaNumberProps)}
      />,
      <LinkMobileNumber {...({} as ILinkMobileNumberProps)} />,
      <VerifyMobileNumber {...({} as IVerifyMobileNumberProps)} />,
      <ChooseAbhaAddress
        {...({
          onSuccess,
        } as IChooseAbhaAddressProps)}
      />,
    ],
    {
      aadhaarNumber: "",
      mobileNumber: "+91",
      isLoading: false,
      validationError: "",
      transactionId: "",
      abhaNumber: null,
      resendOtpCount: 0,
    },
  );

  return <div>{currentStep}</div>;
}

type IEnterAadhaarProps = InjectedStepProps<Memory>;

function EnterAadhaar({ memory, setMemory, next }: IEnterAadhaarProps) {
  const { t } = useTranslation();
  const [disclaimerAccepted, setDisclaimerAccepted] = useState([
    false,
    false,
    false,
    false,
  ]);

  const validateAadhaar = () => {
    if (
      memory?.aadhaarNumber.length !== 12 &&
      memory?.aadhaarNumber.length !== 16
    ) {
      setMemory((prev) => ({
        ...prev,
        validationError: t("aadhaar_validation_length_error"),
      }));
      return false;
    }

    if (memory?.aadhaarNumber.includes(" ")) {
      setMemory((prev) => ({
        ...prev,
        validationError: t("aadhaar_validation_space_error"),
      }));
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateAadhaar()) return;

    setMemory((prev) => ({ ...prev, isLoading: true }));

    const { res, data } = await request(
      routes.abdm.healthId.abhaCreateSendAadhaarOtp,
      {
        body: {
          aadhaar: memory!.aadhaarNumber,
        },
      },
    );

    if (res?.status === 200 && data) {
      setMemory((prev) => ({ ...prev, transactionId: data.transaction_id }));
      Notify.Success({
        msg: data.detail ?? t("aadhaar_otp_send_success"),
      });
      next();
    }

    setMemory((prev) => ({ ...prev, isLoading: false }));
  };

  return (
    <div>
      <div className="flex flex-col justify-center">
        <TextFormField
          type="password"
          name="aadhaar-number"
          label={t("aadhaar_number")}
          minLength={12}
          maxLength={12}
          inputClassName="text-black tracking-[0.3em] font-bold placeholder:font-normal placeholder:tracking-normal"
          placeholder={t("enter_aadhaar_number")}
          disabled={memory?.isLoading}
          value={memory?.aadhaarNumber}
          onChange={({ value }) =>
            setMemory((prev) => ({ ...prev, aadhaarNumber: value }))
          }
          error={memory?.validationError}
        />
        <span
          className={classNames(
            "ml-2 text-sm font-medium text-gray-600",
            !memory?.validationError && "-mt-4",
          )}
        >
          {t("aadhaar_number_will_not_be_stored")}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {disclaimerAccepted.map((isAccepted, i) => (
          <CheckBoxFormField
            key={`abha_disclaimer_${i + 1}`}
            name={`abha_disclaimer_${i + 1}`}
            label={t(`abha__disclaimer_${i + 1}`)}
            value={isAccepted}
            onChange={(e) => {
              setDisclaimerAccepted(
                disclaimerAccepted.map((v, j) => (j === i ? e.value : v)),
              );
            }}
            className="mr-2 rounded border-gray-700"
            labelClassName="text-xs text-gray-800"
            errorClassName="hidden"
          />
        ))}
      </div>

      <div className="mt-4 flex items-center">
        <ButtonV2
          className="w-full"
          loading={memory?.isLoading}
          disabled={
            disclaimerAccepted.some((v) => !v) ||
            memory?.aadhaarNumber.length === 0
          }
          onClick={handleSubmit}
        >
          {t("send_otp")}
        </ButtonV2>
      </div>
    </div>
  );
}

type IVerifyAadhaarProps = InjectedStepProps<Memory>;

function VerifyAadhaar({ memory, setMemory, next }: IVerifyAadhaarProps) {
  const { t } = useTranslation();
  const [otp, setOtp] = useState("");

  const validateMobileNumber = () => {
    const phone = memory?.mobileNumber.replace("+91", "").replace(/ /g, "");
    if (phone?.length !== 10) {
      setMemory((prev) => ({
        ...prev,
        validationError: t("mobile_number_validation_error"),
      }));
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateMobileNumber()) return;

    setMemory((prev) => ({ ...prev, isLoading: true }));

    const { res, data } = await request(
      routes.abdm.healthId.abhaCreateVerifyAadhaarOtp,
      {
        body: {
          otp: otp,
          transaction_id: memory?.transactionId,
          mobile: memory?.mobileNumber.replace("+91", "").replace(/ /g, ""),
        },
      },
    );

    if (res?.status === 200 && data) {
      setMemory((prev) => ({
        ...prev,
        transactionId: data.transaction_id,
        abhaNumber: data.abha_number,
        resendOtpCount: 0,
      }));
      Notify.Success({
        msg: data.detail ?? t("otp_verification_success"),
      });
      next();
    }

    setMemory((prev) => ({ ...prev, isLoading: false }));
  };

  const handleResendOtp = async () => {
    setMemory((prev) => ({ ...prev, isLoading: true }));

    const { res, data } = await request(
      routes.abdm.healthId.abhaCreateSendAadhaarOtp,
      {
        body: {
          aadhaar: memory!.aadhaarNumber,
          // transaction_id: memory?.transactionId,
        },
        silent: true,
      },
    );

    if (res?.status === 200 && data) {
      setMemory((prev) => ({
        ...prev,
        transactionId: data.transaction_id,
        resendOtpCount: prev.resendOtpCount + 1,
      }));
      Notify.Success({
        msg: data.detail ?? t("aadhaar_otp_send_success"),
      });
    } else {
      setMemory((prev) => ({
        ...prev,
        resendOtpCount: Infinity,
      }));
      Notify.Success({
        msg: t("aadhaar_otp_send_error"),
      });
    }

    setMemory((prev) => ({ ...prev, isLoading: false }));
  };

  return (
    <div>
      <div className="flex flex-col justify-center">
        <TextFormField
          type="password"
          name="aadhaar-number"
          label={t("aadhaar_number")}
          min={12}
          max={16}
          inputClassName="text-black tracking-[0.3em] font-bold placeholder:font-normal placeholder:tracking-normal"
          placeholder={t("enter_aadhaar_number")}
          disabled={true}
          value={memory?.aadhaarNumber}
          onChange={({ value }) =>
            setMemory((prev) => ({ ...prev, aadhaarNumber: value }))
          }
        />
        <span
          className={classNames(
            "ml-2 text-sm font-medium text-gray-600",
            !memory?.validationError && "-mt-4",
          )}
        >
          {t("aadhaar_number_will_not_be_stored")}
        </span>
      </div>

      <div className="mt-4">
        <OtpFormField
          name="otp"
          onChange={(value) => setOtp(value as string)}
          value={otp}
          label={t("enter_aadhaar_otp")}
          disabled={memory?.isLoading}
        />
      </div>

      <div className="mt-0">
        <PhoneNumberFormField
          label={t("enter_mobile_number")}
          labelSuffix={<></>}
          name="mobile_number"
          value={memory?.mobileNumber}
          onChange={(e) => {
            if (!memory?.mobileNumber.startsWith("+91")) {
              setMemory((prev) => ({
                ...prev,
                validationError: t("only_indian_mobile_numbers_supported"),
              }));
              return;
            }

            setMemory((prev) => ({ ...prev, mobileNumber: e.value }));
          }}
          error={memory?.validationError}
          errorClassName="text-xs text-red-500"
          types={["mobile"]}
        />
      </div>

      <div className="mt-4 flex flex-col items-center gap-2">
        <ButtonV2
          className="w-full"
          loading={memory?.isLoading}
          disabled={otp.length > 6 || memory?.mobileNumber.length === 0}
          onClick={handleSubmit}
        >
          {t("verify_otp")}
        </ButtonV2>

        {(memory?.resendOtpCount ?? 0) < MAX_OTP_RESEND_ALLOWED && (
          <ButtonWithTimer
            ghost
            className="w-full"
            initialInverval={60}
            onClick={handleResendOtp}
          >
            {t("resend_otp")}
          </ButtonWithTimer>
        )}
      </div>
    </div>
  );
}

type IHandleExistingAbhaNumberProps = InjectedStepProps<Memory> & {
  onSuccess: (abhaNumber: AbhaNumberModel) => void;
};

function HandleExistingAbhaNumber({
  memory,
  onSuccess,
  next,
}: IHandleExistingAbhaNumberProps) {
  const { t } = useTranslation();

  // skip this step for new abha number
  useEffect(() => {
    if (memory?.abhaNumber?.new) {
      next();
    }
  }, [memory?.abhaNumber, memory?.mobileNumber]); // eslint-disable-line

  return (
    <div>
      <h2 className="text-xl font-semibold text-secondary-800">
        {t("abha_number_exists")}
      </h2>
      <p className="text-sm text-secondary-800">
        {t("abha_number_exists_description")}
      </p>
      <div className="mt-4 flex flex-col items-center justify-center gap-2">
        <ButtonV2 className="w-full" onClick={next}>
          {t("create_new_abha_address")}
        </ButtonV2>
        <ButtonV2
          variant="secondary"
          className="w-full"
          onClick={() => onSuccess(memory?.abhaNumber as AbhaNumberModel)}
        >
          {t("use_existing_abha_address")}
        </ButtonV2>
        <p className="text-xs text-secondary-800">
          {memory?.abhaNumber?.health_id}
        </p>
      </div>
    </div>
  );
}

type ILinkMobileNumberProps = InjectedStepProps<Memory>;

function LinkMobileNumber({
  memory,
  goTo,
  setMemory,
  next,
}: ILinkMobileNumberProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (
      memory?.abhaNumber?.mobile ===
      memory?.mobileNumber.replace("+91", "").replace(/ /g, "")
    ) {
      goTo(5); // skip linking mobile number
    }
  }, [memory?.abhaNumber, memory?.mobileNumber]); // eslint-disable-line

  const handleSubmit = async () => {
    setMemory((prev) => ({ ...prev, isLoading: true }));

    const { res, data } = await request(
      routes.abdm.healthId.abhaCreateLinkMobileNumber,
      {
        body: {
          mobile: memory?.mobileNumber.replace("+91", "").replace(/ /g, ""),
          transaction_id: memory?.transactionId,
        },
      },
    );

    if (res?.status === 200 && data) {
      setMemory((prev) => ({
        ...prev,
        transactionId: data.transaction_id,
      }));
      Notify.Success({
        msg: data.detail ?? t("mobile_otp_send_success"),
      });
      next();
    }

    setMemory((prev) => ({ ...prev, isLoading: false }));
  };

  return (
    <div>
      <div className="mt-0">
        <PhoneNumberFormField
          label={t("enter_mobile_number")}
          labelSuffix={<></>}
          name="mobile_number"
          value={memory?.mobileNumber}
          disabled={true}
          onChange={() => null}
          types={["mobile"]}
        />
      </div>

      <p className="mb-4 text-sm text-secondary-800">
        {t("mobile_number_different_from_aadhaar_mobile_number")}
      </p>

      <div className="mt-4 flex items-center">
        <ButtonV2
          className="w-full"
          loading={memory?.isLoading}
          onClick={handleSubmit}
        >
          {t("send_otp")}
        </ButtonV2>
      </div>
    </div>
  );
}

type IVerifyMobileNumberProps = InjectedStepProps<Memory>;

function VerifyMobileNumber({
  memory,
  setMemory,
  next,
}: IVerifyMobileNumberProps) {
  const { t } = useTranslation();
  const [otp, setOtp] = useState("");

  const handleSubmit = async () => {
    setMemory((prev) => ({ ...prev, isLoading: true }));

    const { res, data } = await request(
      routes.abdm.healthId.abhaCreateVerifyMobileNumber,
      {
        body: {
          transaction_id: memory?.transactionId,
          otp: otp,
        },
      },
    );

    if (res?.status === 200 && data) {
      setMemory((prev) => ({
        ...prev,
        transactionId: data.transaction_id,
        resendOtpCount: 0,
      }));
      Notify.Success({
        msg: data.detail ?? t("mobile_otp_verify_success"),
      });
      next();
    }

    setMemory((prev) => ({ ...prev, isLoading: false }));
  };

  const handleResendOtp = async () => {
    setMemory((prev) => ({ ...prev, isLoading: true }));

    const { res, data } = await request(
      routes.abdm.healthId.abhaCreateLinkMobileNumber,
      {
        body: {
          mobile: memory?.mobileNumber.replace("+91", "").replace(/ /g, ""),
          transaction_id: memory?.transactionId,
        },
      },
    );

    if (res?.status === 200 && data) {
      setMemory((prev) => ({
        ...prev,
        transactionId: data.transaction_id,
        resendOtpCount: prev.resendOtpCount + 1,
      }));
      Notify.Success({
        msg: data.detail ?? t("mobile_otp_send_success"),
      });
    } else {
      setMemory((prev) => ({
        ...prev,
        resendOtpCount: Infinity,
      }));
      Notify.Success({
        msg: t("mobile_otp_send_error"),
      });
    }

    setMemory((prev) => ({ ...prev, isLoading: false }));
  };

  return (
    <div>
      <div className="mt-0">
        <PhoneNumberFormField
          label={t("enter_mobile_number")}
          labelSuffix={<></>}
          name="mobile_number"
          value={memory?.mobileNumber}
          disabled={true}
          onChange={() => null}
          types={["mobile"]}
        />
      </div>

      <div className="mt-4">
        <OtpFormField
          name="otp"
          onChange={(value) => setOtp(value as string)}
          value={otp}
          label={t("enter_mobile_otp")}
          disabled={memory?.isLoading}
        />
      </div>

      <div className="mt-4 flex flex-col items-center gap-2">
        <ButtonV2
          className="w-full"
          loading={memory?.isLoading}
          onClick={handleSubmit}
        >
          {t("verify_otp")}
        </ButtonV2>

        {(memory?.resendOtpCount ?? 0) < MAX_OTP_RESEND_ALLOWED && (
          <ButtonWithTimer
            ghost
            className="w-full"
            initialInverval={60}
            onClick={handleResendOtp}
          >
            {t("resend_otp")}
          </ButtonWithTimer>
        )}
      </div>
    </div>
  );
}

type IChooseAbhaAddressProps = InjectedStepProps<Memory> & {
  onSuccess: (abhaNumber: AbhaNumberModel) => void;
};

function ChooseAbhaAddress({
  memory,
  setMemory,
  onSuccess,
}: IChooseAbhaAddressProps) {
  const { t } = useTranslation();
  const [healthId, setHealthId] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      const { res, data } = await request(
        routes.abdm.healthId.abhaCreateAbhaAddressSuggestion,
        {
          body: {
            transaction_id: memory?.transactionId,
          },
        },
      );

      if (res?.status === 200 && data) {
        setMemory((prev) => ({ ...prev, transactionId: data.transaction_id }));
        setSuggestions(data.abha_addresses);
      }
    };

    fetchSuggestions();
  }, [healthId, memory?.transactionId, setMemory]);

  const handleSubmit = async () => {
    setMemory((prev) => ({ ...prev, isLoading: true }));

    const { res, data } = await request(
      routes.abdm.healthId.abhaCreateEnrolAbhaAddress,
      {
        body: {
          abha_address: healthId,
          transaction_id: memory?.transactionId,
        },
      },
    );

    if (res?.status === 200 && data) {
      setMemory((prev) => ({
        ...prev,
        transactionId: data.transaction_id,
        abhaNumber: data.abha_number,
      }));
      Notify.Success({
        msg: data.detail ?? t("abha_address_created_success"),
      });
      onSuccess(data.abha_number);
    }

    setMemory((prev) => ({ ...prev, isLoading: false }));
  };

  return (
    <div className="mt-4 flex flex-col gap-4">
      <TextFormField
        name="health-id"
        label={t("enter_abha_address")}
        placeholder={t("enter_abha_address")}
        disabled={memory?.isLoading}
        value={healthId}
        onChange={({ value }) => {
          setHealthId(value);
        }}
      />

      <div className="-mt-4 mb-2 pl-2 text-sm text-secondary-500">
        {validateRule(
          healthId.length >= 4,
          t("abha_address_validation_length_error"),
          false,
        )}
        {validateRule(
          Number.isNaN(Number(healthId[0])) && healthId[0] !== ".",
          t("abha_address_validation_start_error"),
          false,
        )}
        {validateRule(
          healthId[healthId.length - 1] !== ".",
          t("abha_address_validation_end_error"),
          false,
        )}
        {validateRule(
          /^[0-9a-zA-Z._]+$/.test(healthId),
          t("abha_address_validation_character_error"),
          false,
        )}
      </div>

      {suggestions.length > 0 && (
        <div>
          <h4 className="text-sm text-secondary-800">
            {t("abha_address_suggestions")}
          </h4>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            {suggestions
              .filter((suggestion) => suggestion !== healthId)
              .map((suggestion) => (
                <p
                  onClick={() => setHealthId(suggestion)}
                  className="cursor-pointer rounded-md bg-primary-400 px-2.5 py-1 text-xs text-white"
                >
                  {suggestion}
                </p>
              ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-center gap-2">
        <ButtonV2
          className="w-full"
          disabled={
            memory?.isLoading ||
            !/^(?![\d.])[a-zA-Z0-9._]{4,}(?<!\.)$/.test(healthId)
          }
          onClick={handleSubmit}
        >
          {t("create_abha_address")}
        </ButtonV2>
      </div>
    </div>
  );
}
