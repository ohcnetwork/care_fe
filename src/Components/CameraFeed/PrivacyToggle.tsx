import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface PrivacyToggleProps {
  consultationBedId: string;
  initalValue?: boolean;
  onChange?: (value: boolean) => void;
}

export default function PrivacyToggle({
  consultationBedId,
  initalValue,

  onChange,
}: PrivacyToggleProps) {
  const [isPrivacyEnabled, setIsPrivacyEnabled] = useState(
    initalValue ?? false,
  );

  const updatePrivacyChange = (value: boolean) => {
    setIsPrivacyEnabled(value);
    onChange?.(value);
  };

  useQuery(routes.getConsultationBed, {
    pathParams: { externalId: consultationBedId },
    onResponse(res) {
      updatePrivacyChange(res.data?.is_privacy_enabled ?? false);
    },
  });

  return (
    <TogglePrivacyButton
      value={isPrivacyEnabled}
      consultationBedId={consultationBedId}
      onChange={updatePrivacyChange}
      iconOnly
    />
  );
}

type TogglePrivacyButtonProps = {
  value: boolean;
  consultationBedId: string;
  onChange: (value: boolean) => void;
  iconOnly?: boolean;
};

export function TogglePrivacyButton({
  value: isPrivacyEnabled,
  consultationBedId,
  onChange: updatePrivacyChange,
  iconOnly = false,
}: TogglePrivacyButtonProps) {
  const { t } = useTranslation();

  return (
    <ButtonV2
      size="small"
      variant={isPrivacyEnabled ? "primary" : "secondary"}
      border
      tooltip={
        !iconOnly
          ? undefined
          : isPrivacyEnabled
            ? t("privacy_enabled_tooltip")
            : t("privacy_disabled_tooltip")
      }
      tooltipClassName="left-0 top-full translate-y-2 text-xs"
      className="mr-2"
      onClick={async () => {
        const { res, data } = await request(
          routes.toggleConsultationBedPrivacy,
          {
            pathParams: { externalId: consultationBedId },
            body: {
              is_privacy_enabled: !isPrivacyEnabled,
            },
          },
        );

        if (res?.ok && data) {
          updatePrivacyChange(data.is_privacy_enabled);
        }
      }}
    >
      {!iconOnly && (
        <span className="text-xs font-bold">
          {isPrivacyEnabled ? t("disable_privacy") : t("enable_privacy")}
        </span>
      )}
      <CareIcon
        icon={isPrivacyEnabled ? "l-eye" : "l-eye-slash"}
        className="text-lg"
      />
    </ButtonV2>
  );
}
