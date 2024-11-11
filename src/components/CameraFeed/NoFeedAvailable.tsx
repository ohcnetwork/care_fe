import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import { AssetData } from "@/components/Assets/AssetTypes";
import ButtonV2 from "@/components/Common/ButtonV2";

import { classNames } from "@/Utils/utils";

interface Props {
  className?: string;
  icon: IconName;
  message: string;
  streamUrl: string;
  onResetClick: () => void;
  asset: AssetData;
}

export default function NoFeedAvailable(props: Props) {
  const redactedURL = props.streamUrl
    // Replace all uuids in the URL with "ID_REDACTED"
    .replace(/[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}/gi, "***")
    // Replace all numbers in the URL's path params with "ID_REDACTED"
    .replace(/\/\d+/g, "/***");

  return (
    <div
      className={classNames(
        "absolute inset-x-0 inset-y-0 z-[5] flex flex-col items-center justify-center gap-2 text-center",
        props.className,
      )}
    >
      <CareIcon icon={props.icon} className="text-2xl" />
      <span className="text-xs font-bold">{props.message}</span>
      <span className="hidden px-10 font-mono text-xs text-secondary-500 md:block">
        {redactedURL}
      </span>
      <div className="mt-4 flex items-center gap-2">
        <ButtonV2
          variant="secondary"
          className="bg-black text-white hover:bg-white/30"
          border
          size="small"
          onClick={props.onResetClick}
        >
          <CareIcon icon="l-redo" className="text-base" />
          Retry
        </ButtonV2>
        <ButtonV2
          variant="secondary"
          className="bg-black text-white hover:bg-white/30"
          border
          size="small"
          href={`/facility/${props.asset.location_object.facility?.id}/assets/${props.asset.id}/configure`}
        >
          <CareIcon icon="l-cog" className="text-base" />
          Configure
        </ButtonV2>
      </div>
    </div>
  );
}
