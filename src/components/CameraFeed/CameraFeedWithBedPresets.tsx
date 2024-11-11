import { useState } from "react";

import { AssetData } from "@/components/Assets/AssetTypes";
import CameraFeed from "@/components/CameraFeed/CameraFeed";
import { CameraPresetDropdown } from "@/components/CameraFeed/CameraPresetSelect";
import { CameraPreset, FeedRoutes } from "@/components/CameraFeed/routes";
import useOperateCamera from "@/components/CameraFeed/useOperateCamera";

import useQuery from "@/Utils/request/useQuery";
import { classNames } from "@/Utils/utils";

interface Props {
  asset: AssetData;
}

export default function LocationFeedTile(props: Props) {
  const [preset, setPreset] = useState<CameraPreset>();
  const { operate, key } = useOperateCamera(props.asset.id);
  const { data, loading } = useQuery(FeedRoutes.listAssetPresets, {
    pathParams: { asset_id: props.asset.id },
    query: { limit: 100 },
  });

  return (
    <CameraFeed
      asset={props.asset}
      key={key}
      preset={preset?.position}
      shortcutsDisabled
      className="overflow-hidden rounded-lg"
      operate={operate}
    >
      <div
        className={classNames(
          "w-64 transition-all duration-200 ease-in-out",
          loading && "pointer-events-none animate-pulse opacity-40",
        )}
      >
        <CameraPresetDropdown
          options={data?.results ?? []}
          value={preset}
          onChange={setPreset}
          placeholder={loading ? "Fetching presets..." : "Select preset"}
        />
      </div>
    </CameraFeed>
  );
}
