import { useState } from "react";
import { AssetBedModel, AssetData } from "../Assets/AssetTypes";
import CameraFeed from "./CameraFeed";
import AssetBedSelect from "./AssetBedSelect";

interface Props {
  asset: AssetData;
  facilityId: string;
}

export default function LocationFeedTile(props: Props) {
  const [preset, setPreset] = useState<AssetBedModel>();

  return (
    <CameraFeed
      asset={props.asset}
      silent
      patient={preset?.patient}
      preset={preset?.meta.position}
      shortcutsDisabled
    >
      <div className="w-64">
        <AssetBedSelect
          asset={props.asset}
          facilityId={props.facilityId}
          value={preset}
          onChange={setPreset}
        />
      </div>
    </CameraFeed>
  );
}
