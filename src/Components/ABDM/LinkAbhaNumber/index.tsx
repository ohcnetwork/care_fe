import { useState } from "react";
import DialogModal from "../../Common/Dialog";
import { AbhaNumberModel } from "../types/abha";
import ButtonV2 from "../../Common/components/ButtonV2";
import { classNames } from "../../../Utils/utils";
import CreateWithAadhaar from "./CreateWithAadhaar";
import { useTranslation } from "react-i18next";
import LinkWithOtp from "./LinkWithOtp";

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
  },
  link_with_otp: {
    title: "abha_link_options__link_with_otp__title",
    description: "abha_link_options__link_with_otp__description",
    disabled: false,
    value: "link_with_otp",
  },
  create_with_driving_license: {
    title: "abha_link_options__create_with_driving_license__title",
    description: "abha_link_options__create_with_driving_license__description",
    disabled: true,
    value: "create_with_driving_license",
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

      <div>
        <p className="mt-6 text-sm text-secondary-800">
          {t("try_different_abha_linking_option")}
        </p>
        <div className="mt-2 flex w-full flex-wrap items-center justify-start gap-2">
          {Object.values(ABHA_LINK_OPTIONS)
            .filter((option) => option.value !== currentAbhaLinkOption)
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
                  "border border-gray-400 text-secondary-800",
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
