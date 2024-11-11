import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { AssetData, assetClassProps } from "@/components/Assets/AssetTypes";
import ButtonV2 from "@/components/Common/ButtonV2";

interface AssetInfoPopoverProps {
  asset?: AssetData;
  className?: string;
}

const AssetInfoPopover = ({ asset, className }: AssetInfoPopoverProps) => {
  const { t } = useTranslation();

  return (
    <Popover className="relative">
      <PopoverButton>
        <CareIcon
          icon="l-info-circle"
          className="cursor-pointer text-sm text-secondary-500 hover:text-white md:text-base"
        />
      </PopoverButton>
      <Transition
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <PopoverPanel className={className}>
          <div className="flex flex-col gap-3 p-5">
            <div className="flex items-center gap-2 text-lg font-bold text-black">
              <CareIcon
                icon={
                  (
                    (asset?.asset_class &&
                      assetClassProps[asset.asset_class]) ||
                    assetClassProps.NONE
                  ).icon
                }
                className="text-2xl"
              />
              <p>{asset?.name}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm text-black md:text-base">
                {t("middleware_hostname")}:
              </p>
              <p className="break-words text-secondary-600">
                {asset?.resolved_middleware?.hostname}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm text-black md:text-base">
                {t("local_ip_address")}:
              </p>
              <p className="break-words text-secondary-600">
                {asset?.meta?.local_ip_address}
              </p>
            </div>
            <ButtonV2
              onClick={() =>
                navigate(
                  `/facility/${asset?.location_object.facility?.id}/assets/${asset?.id}/configure`,
                )
              }
              id="configure-asset"
              data-testid="asset-configure-button"
            >
              <CareIcon icon="l-setting" className="h-4" />
              {t("configure")}
            </ButtonV2>
          </div>
        </PopoverPanel>
      </Transition>
    </Popover>
  );
};

export default AssetInfoPopover;
