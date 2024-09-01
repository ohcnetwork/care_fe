import { useTranslation } from "react-i18next";
import { AbhaNumberModel } from "../types/abha";
import useMultiStepForm, { InjectedStepProps } from "./useMultiStepForm";
import { useMemo, useState } from "react";
import TextFormField from "../../Form/FormFields/TextFormField";
import { classNames } from "../../../Utils/utils";
import ButtonV2 from "../../Common/components/ButtonV2";
import Dropdown, { DropdownItem } from "../../Common/components/Menu";
import OtpFormField from "../../Form/FormFields/OtpFormField";
import { capitalize } from "lodash-es";
import * as Notify from "../../../Utils/Notifications";
import request from "../../../Utils/request/request";
import routes from "../../../Redux/api";
import CheckBoxFormField from "../../Form/FormFields/CheckBoxFormField";

type ILoginWithOtpProps = {
  onSuccess: (abhaNumber: AbhaNumberModel) => void;
};

type Memory = {
  id: string;

  isLoading: boolean;
  validationError: string;

  transactionId: string;
  type: "aadhaar" | "mobile" | "abha-number" | "abha-address";
  otp_system: "abdm" | "aadhaar";
  abhaNumber: AbhaNumberModel | null;
};

export default function LinkWithOtp({ onSuccess }: ILoginWithOtpProps) {
  const { currentStep } = useMultiStepForm<Memory>(
    [
      <EnterId {...({} as IEnterIdProps)} />,
      <VerifyId {...({ onSuccess } as IVerifyIdProps)} />,
    ],
    {
      id: "",
      isLoading: false,
      validationError: "",
      transactionId: "",
      type: "aadhaar",
      otp_system: "aadhaar",
      abhaNumber: null,
    },
  );

  return <div>{currentStep}</div>;
}

type IEnterIdProps = InjectedStepProps<Memory>;

const supportedAuthMethods = ["AADHAAR_OTP", "MOBILE_OTP"];

function EnterId({ memory, setMemory, next }: IEnterIdProps) {
  const { t } = useTranslation();
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [authMethods, setAuthMethods] = useState<string[]>([]);

  const valueType = useMemo(() => {
    const id = memory?.id;
    const isNumeric = !isNaN(Number(id?.trim()));

    if (isNumeric && (id?.length === 12 || id?.length === 16)) {
      return "aadhaar";
    } else if (isNumeric && id?.length === 10) {
      return "mobile";
    } else if (isNumeric && id?.length === 14) {
      return "abha-number";
    } else {
      return "abha-address";
    }
  }, [memory?.id]);

  const handleGetAuthMethods = async () => {
    setMemory((prev) => ({ ...prev, isLoading: true }));

    if (valueType === "aadhaar") {
      setAuthMethods(["AADHAAR_OTP"]);
    } else if (valueType === "mobile") {
      setAuthMethods(["MOBILE_OTP"]);
    } else {
      const { res, data, error } = await request(
        routes.abdm.healthId.abhaLoginCheckAuthMethods,
        {
          body: {
            abha_address: memory?.id.replace(/-/g, "").replace(/ /g, ""),
          },
          silent: true,
        },
      );

      if (res?.status === 200 && data) {
        const methods = data.auth_methods.filter((method: string) =>
          supportedAuthMethods.find((supported) => supported === method),
        );

        if (methods.length === 0) {
          Notify.Warn({ msg: t("get_auth_mode_error") });
        }
      } else {
        Notify.Error({ msg: error?.message ?? t("get_auth_mode_error") });
      }
    }

    setMemory((prev) => ({ ...prev, isLoading: false }));
  };

  const handleSendOtp = async (authMethod: string) => {
    if (!supportedAuthMethods.includes(authMethod)) {
      Notify.Warn({ msg: t("auth_method_unsupported") });
      return;
    }

    const otp_system: "aadhaar" | "abdm" =
      authMethod === "AADHAAR_OTP" ? "aadhaar" : "abdm";

    setMemory((prev) => ({
      ...prev,
      isLoading: true,
      type: valueType,
      otp_system,
    }));

    const { res, data } = await request(routes.abdm.healthId.abhaLoginSendOtp, {
      body: {
        value: memory?.id,
        type: valueType,
        otp_system,
      },
    });

    if (res?.status === 200 && data) {
      setMemory((prev) => ({
        ...prev,
        transactionId: data.transaction_id,
      }));
      Notify.Success({ msg: data.detail ?? t("send_otp_success") });
      next();
    }

    setMemory((prev) => ({ ...prev, isLoading: false }));
  };

  return (
    <div>
      <div className="flex flex-col justify-center">
        <TextFormField
          name="id"
          label={t("any_id")}
          inputClassName="text-black tracking-[0.3em] font-bold placeholder:font-normal placeholder:tracking-normal text-center"
          placeholder={t("enter_any_id")}
          disabled={memory?.isLoading}
          value={memory?.id}
          onChange={({ value }) => {
            setMemory((prev) => ({ ...prev, id: value }));
            setAuthMethods([]);
          }}
          error={memory?.validationError}
        />
        <span
          className={classNames(
            "ml-2 text-sm font-medium text-gray-600",
            !memory?.validationError && "-mt-4",
          )}
        >
          {t("any_id_description")}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <CheckBoxFormField
          name="abha_link_disclaimer_1"
          label={<>{t("link_abha_disclaimer")}</>}
          value={disclaimerAccepted}
          onChange={(e) => {
            setDisclaimerAccepted(e.value);
          }}
          className="mr-2 rounded border-gray-700"
          labelClassName="text-xs text-gray-800"
          errorClassName="hidden"
        />
      </div>

      <div className="mt-4 flex items-center">
        {authMethods.length === 0 ? (
          <ButtonV2
            className="w-full"
            loading={memory?.isLoading}
            disabled={!disclaimerAccepted || memory?.id.length === 0}
            onClick={handleGetAuthMethods}
          >
            {t("get_auth_methods")}
          </ButtonV2>
        ) : (
          <Dropdown
            itemClassName="!w-full md:!w-full"
            containerClassName="w-full"
            title={t("verify_using")}
          >
            {authMethods.map((method) => (
              <DropdownItem key={method} onClick={() => handleSendOtp(method)}>
                {capitalize(method.replace(/_/g, " "))}
              </DropdownItem>
            ))}
          </Dropdown>
        )}
      </div>
    </div>
  );
}

type IVerifyIdProps = InjectedStepProps<Memory> & {
  onSuccess: (abhaNumber: AbhaNumberModel) => void;
};

function VerifyId({ memory, setMemory, onSuccess }: IVerifyIdProps) {
  const { t } = useTranslation();
  const [otp, setOtp] = useState("");

  const handleSubmit = async () => {
    setMemory((prev) => ({ ...prev, isLoading: true }));

    const { res, data } = await request(
      routes.abdm.healthId.abhaLoginVerifyOtp,
      {
        body: {
          type: memory?.type,
          transaction_id: memory?.transactionId,
          otp,
          otp_system: memory?.otp_system,
        },
      },
    );

    if (res?.status === 200 && data) {
      Notify.Success({ msg: t("verify_otp_success") });
      onSuccess(data.abha_number);
    }

    setMemory((prev) => ({ ...prev, isLoading: false }));
  };

  return (
    <div>
      <div className="flex flex-col justify-center">
        <TextFormField
          name="id"
          label={t("any_id")}
          inputClassName="text-black tracking-[0.3em] font-bold placeholder:font-normal placeholder:tracking-normal text-center"
          placeholder={t("enter_any_id")}
          disabled={true}
          value={memory?.id}
          onChange={() => null}
        />
        <span
          className={classNames(
            "ml-2 text-sm font-medium text-gray-600",
            !memory?.validationError && "-mt-4",
          )}
        >
          {t("any_id_description")}
        </span>
      </div>

      <div className="mt-4">
        <OtpFormField
          name="otp"
          onChange={(value) => setOtp(value as string)}
          value={otp}
          label={t("enter_otp")}
          disabled={memory?.isLoading}
        />
      </div>

      <div className="mt-4 flex items-center">
        <ButtonV2
          className="w-full"
          loading={memory?.isLoading}
          disabled={otp.length !== 6}
          onClick={handleSubmit}
        >
          {t("verify_and_link")}
        </ButtonV2>
      </div>
    </div>
  );
}