import { useState } from "react";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { AssetData } from "../Assets/AssetTypes";
import DialogModal from "../Common/Dialog";
import ButtonV2 from "../Common/components/ButtonV2";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

interface VitalsMonitorAssetPopoverProps {
  asset?: AssetData;
}

const VitalsMonitorAssetPopover = ({
  asset,
}: VitalsMonitorAssetPopoverProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const { t } = useTranslation();

  return (
    <div>
      <CareIcon
        className="care-l-info-circle cursor-pointer text-sm text-gray-500 hover:text-white md:text-base"
        onClick={() => setShowDialog(true)}
      />
      <DialogModal
        show={showDialog}
        onClose={() => setShowDialog(false)}
        fixedWidth={false}
        title={
          <div className="flex gap-2">
            <CareIcon className="care-l-lungs" />
            <p>{asset?.name}</p>
          </div>
        }
      >
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <p>Middleware Hostname:</p>
            <p className="text-gray-500">
              {asset?.resolved_middleware?.hostname}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <p>Local IP Address:</p>
            <p className="text-gray-500">{asset?.meta?.local_ip_address}</p>
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
      </DialogModal>
    </div>
  );
};

export default VitalsMonitorAssetPopover;
