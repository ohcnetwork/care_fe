import { AssetData } from "../Assets/AssetTypes";
import VitalsMonitorAssetPopover from "./VitalsMonitorAssetPopover";

interface IVitalsMonitorFooterProps {
  asset?: AssetData;
}

const VitalsMonitorFooter = ({ asset }: IVitalsMonitorFooterProps) => {
  return (
    <div className="flex w-full items-center gap-2 text-xs tracking-wide md:text-sm">
      <p className="text-gray-500 ">{asset?.name}</p>
      <VitalsMonitorAssetPopover asset={asset} />
    </div>
  );
};

export default VitalsMonitorFooter;
