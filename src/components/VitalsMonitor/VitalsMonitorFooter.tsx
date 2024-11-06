import { AssetData } from "@/components/Assets/AssetTypes";
import AssetInfoPopover from "@/components/Common/AssetInfoPopover";

interface IVitalsMonitorFooterProps {
  asset?: AssetData;
}

const VitalsMonitorFooter = ({ asset }: IVitalsMonitorFooterProps) => {
  return (
    <div className="flex w-full items-center gap-2 text-xs tracking-wide md:text-sm">
      <p className="text-secondary-500">{asset?.name}</p>
      <AssetInfoPopover
        asset={asset}
        className="absolute z-[100] mt-2 w-56 -translate-x-1/3 translate-y-[-280px] rounded-md bg-white md:w-[350px] md:-translate-y-full md:translate-x-6"
      />
    </div>
  );
};

export default VitalsMonitorFooter;
