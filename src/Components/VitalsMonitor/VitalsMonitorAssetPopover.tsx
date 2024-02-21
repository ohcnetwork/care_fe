import CareIcon from "../../CAREUI/icons/CareIcon";
import { AssetData, assetClassProps } from "../Assets/AssetTypes";
import ButtonV2 from "../Common/components/ButtonV2";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";
import { Popover, Transition } from "@headlessui/react";
import { Fragment } from "react";

interface VitalsMonitorAssetPopoverProps {
  asset?: AssetData;
}

const VitalsMonitorAssetPopover = ({
  asset,
}: VitalsMonitorAssetPopoverProps) => {
  const { t } = useTranslation();

  return (
    <Popover className="relative">
      <Popover.Button>
        <CareIcon className="care-l-info-circle cursor-pointer text-sm text-gray-500 hover:text-white md:text-base" />
      </Popover.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel className="absolute z-[100] mt-2 w-56 -translate-x-1/3 translate-y-[-280px] rounded-md bg-white md:w-[350px] md:-translate-y-full md:translate-x-6">
          <div className="flex flex-col gap-3 p-5">
            <div className="flex items-center gap-2 text-lg font-bold">
              <CareIcon
                className={`care-l-${
                  (
                    (asset?.asset_class &&
                      assetClassProps[asset.asset_class]) ||
                    assetClassProps.NONE
                  ).icon
                } text-2xl`}
              />
              <p>{asset?.name}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm md:text-base">Middleware Hostname:</p>
              <p className="break-words text-gray-600">
                {asset?.resolved_middleware?.hostname}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm md:text-base">Local IP Address:</p>
              <p className="break-words text-gray-600">
                {asset?.meta?.local_ip_address}
              </p>
            </div>
            <ButtonV2
              onClick={() =>
                navigate(
                  `/facility/${asset?.location_object.facility?.id}/assets/${asset?.id}/configure`
                )
              }
              id="configure-asset"
              data-testid="asset-configure-button"
            >
              <CareIcon className="care-l-setting h-4" />
              {t("configure")}
            </ButtonV2>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};

export default VitalsMonitorAssetPopover;
