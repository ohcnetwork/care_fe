import { useState } from "react";
import { AssetBedModel, AssetData } from "../Assets/AssetTypes";
import CameraFeed from "./CameraFeed";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";
import useSlug from "../../Common/hooks/useSlug";
import { CameraPresetDropdown } from "./AssetBedSelect";
import useOperateCamera from "./useOperateCamera";
import { classNames } from "../../Utils/utils";

interface Props {
  asset: AssetData;
}

export default function LocationFeedTile(props: Props) {
  const facility = useSlug("facility");
  const [preset, setPreset] = useState<AssetBedModel>();

  const { data, loading } = useQuery(routes.listAssetBeds, {
    query: { limit: 100, facility, asset: props.asset?.id },
  });

  const { operate, key } = useOperateCamera(props.asset.id, true);

  return (
    <CameraFeed
      asset={props.asset}
      key={key}
      preset={preset?.meta.position}
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
