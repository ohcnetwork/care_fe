import { useState } from "react";
import { useTranslation } from "react-i18next";

import CreateWithAadhaar from "@/components/ABDM/LinkAbhaNumber/CreateWithAadhaar";
import LinkWithOtp from "@/components/ABDM/LinkAbhaNumber/LinkWithOtp";
import LinkWithQr from "@/components/ABDM/LinkAbhaNumber/LinkWithQr";
import { AbhaNumberModel } from "@/components/ABDM/types/abha";
import ButtonV2 from "@/components/Common/ButtonV2";
import DialogModal from "@/components/Common/Dialog";

import { classNames } from "@/Utils/utils";

interface ILinkAbhaNumberProps {
  show: boolean;
  onClose: () => void;
  onSuccess: (abhaNumber: AbhaNumberModel) => void;
}

const ABHA_LINK_OPTIONS = {
  create_with_aadhaar: {
    title: "abha_link_options__create_with_aadhaar__title",
    description: "abha_link_options__create_with_aadhaar__description",
    disabled: false,
    value: "create_with_aadhaar",
    create: true,
  },
  link_with_otp: {
    title: "abha_link_options__link_with_otp__title",
    description: "abha_link_options__link_with_otp__description",
    disabled: false,
    value: "link_with_otp",
    create: false,
  },
  create_with_driving_license: {
    title: "abha_link_options__create_with_driving_license__title",
    description: "abha_link_options__create_with_driving_license__description",
    disabled: true,
    value: "create_with_driving_license",
    create: true,
  },
  link_with_demographics: {
    title: "abha_link_options__link_with_demographics__title",
    description: "abha_link_options__link_with_demographics__description",
    disabled: true,
    value: "link_with_demographics",
    create: false,
  },
  link_with_qr: {
    title: "abha_link_options__link_with_qr__title",
    description: "abha_link_options__link_with_qr__description",
    disabled: false,
    value: "link_with_qr",
    create: false,
  },
};

export default function LinkAbhaNumber({
  show,
  onClose,
  onSuccess,
}: ILinkAbhaNumberProps) {
  const { t } = useTranslation();
  const [currentAbhaLinkOption, setCurrentAbhaLinkOption] = useState<
    keyof typeof ABHA_LINK_OPTIONS
  >("create_with_aadhaar");

  return (
    <DialogModal
      title={t(ABHA_LINK_OPTIONS[currentAbhaLinkOption].title)}
      show={show}
      onClose={onClose}
    >
      {currentAbhaLinkOption === "create_with_aadhaar" && (
        <CreateWithAadhaar onSuccess={onSuccess} />
      )}

      {currentAbhaLinkOption === "link_with_otp" && (
        <LinkWithOtp onSuccess={onSuccess} />
      )}

      {currentAbhaLinkOption === "link_with_qr" && (
        <LinkWithQr onSuccess={onSuccess} />
      )}

      <div className="mt-6">
        <p
          onClick={() =>
            setCurrentAbhaLinkOption(
              ABHA_LINK_OPTIONS[currentAbhaLinkOption].create
                ? "link_with_otp"
                : "create_with_aadhaar",
            )
          }
          className="cursor-pointer text-center text-sm text-blue-800"
        >
          {ABHA_LINK_OPTIONS[currentAbhaLinkOption].create
            ? t("link_existing_abha_profile")
            : t("create_new_abha_profile")}
        </p>
      </div>

      <div>
        <p className="mt-6 text-sm text-secondary-800">
          {t("try_different_abha_linking_option")}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-start gap-2">
          {Object.values(ABHA_LINK_OPTIONS)
            .filter(
              (option) =>
                option.value !== currentAbhaLinkOption &&
                ABHA_LINK_OPTIONS[currentAbhaLinkOption]?.create ===
                  option.create,
            )
            .sort((a) => (a.disabled ? 1 : -1))
            .map((option) => (
              <ButtonV2
                onClick={() =>
                  setCurrentAbhaLinkOption(
                    option.value as keyof typeof ABHA_LINK_OPTIONS,
                  )
                }
                ghost
                tooltip={
                  option.disabled
                    ? t("abha_link_options__disabled_tooltip")
                    : t(option.description)
                }
                disabled={option.disabled}
                tooltipClassName="top-full mt-1"
                className={classNames(
                  "w-full border border-gray-400 text-secondary-800",
                  !option.disabled && "hover:border-primary-100",
                )}
              >
                {t(option.title)}
              </ButtonV2>
            ))}
        </div>
      </div>
    </DialogModal>
  );
}
