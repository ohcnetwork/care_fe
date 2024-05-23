import { useState } from "react";
import { AssetBedModel, AssetData } from "../Assets/AssetTypes";
import CameraFeed from "./CameraFeed";
import AssetBedSelect from "./AssetBedSelect";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";
import useSlug from "../../Common/hooks/useSlug";

interface Props {
  asset: AssetData;
}

export default function LocationFeedTile(props: Props) {
  const facility = useSlug("facility");
  const [preset, setPreset] = useState<AssetBedModel>();

  const { data, loading } = useQuery(routes.listAssetBeds, {
    query: { limit: 100, facility, asset: props.asset?.id },
  });

  return (
    <CameraFeed
      asset={props.asset}
      silent
      preset={preset?.meta.position}
      shortcutsDisabled
    >
      <div className="w-64">
        {loading ? (
          <span>loading presets...</span>
        ) : (
          <AssetBedSelect
            options={data?.results ?? []}
            value={preset}
            onChange={setPreset}
          />
        )}
      </div>
    </CameraFeed>
  );
}
