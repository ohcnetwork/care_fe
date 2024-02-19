import CareIcon from "../../CAREUI/icons/CareIcon";
import { AssetData } from "../Assets/AssetTypes";
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
    <div className="max-w-full">
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
          <Popover.Panel className="absolute z-50 mt-2 w-80 translate-x-[-300px] rounded-md bg-white md:w-96 md:-translate-x-full">
            <div className="flex flex-col gap-2 p-5">
              <div className="flex gap-2 text-lg font-bold">
                <CareIcon className="care-l-lungs" />
                <p>{asset?.name}</p>
              </div>
              <div className="mt-2 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <p>Middleware Hostname:</p>
                  <p className="text-gray-500">
                    {asset?.resolved_middleware?.hostname}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p>Local IP Address:</p>
                  <p className="text-gray-500">
                    {asset?.meta?.local_ip_address}
                  </p>
                </div>
              </div>
              <ButtonV2
                onClick={() =>
                  navigate(
                    `/facility/${asset?.location_object.facility?.id}/assets/${asset?.id}/configure`
                  )
                }
                id="configure-asset"
                data-testid="asset-configure-button"
                className="mt-4"
              >
                <CareIcon className="care-l-setting h-4" />
                {t("configure")}
              </ButtonV2>
            </div>
          </Popover.Panel>
        </Transition>
      </Popover>
    </div>
  );
};

export default VitalsMonitorAssetPopover;
