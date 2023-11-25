import { SyntheticEvent } from "react";
import { AssetData } from "../AssetTypes";
import LiveFeed from "../../Facility/Consultations/LiveFeed";
import { BedSelect } from "../../Common/BedSelect";
import { BedModel } from "../../Facility/models";
import { getCameraConfig } from "../../../Utils/transformUtils";
import { Submit } from "../../Common/components/ButtonV2";
import TextFormField from "../../Form/FormFields/TextFormField";
import Card from "../../../CAREUI/display/Card";

interface CameraConfigureProps {
  asset: AssetData;
  addPreset(e: SyntheticEvent): void;
  setBed(bed: BedModel): void;
  bed: BedModel;
  newPreset: string;
  setNewPreset(preset: string): void;
  refreshPresetsHash: number;
  facilityMiddlewareHostname: string;
  isLoading: boolean;
}
export default function CameraConfigure(props: CameraConfigureProps) {
  const {
    asset,
    addPreset,
    setBed,
    bed,
    isLoading,
    newPreset,
    setNewPreset,
    refreshPresetsHash,
    facilityMiddlewareHostname,
  } = props;

  return (
    <div className="mb-5">
      <Card className="mt-4">
        <form onSubmit={addPreset} className="">
          <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label id="asset-type">Bed</label>
              <BedSelect
                name="bed"
                className="overflow-y-scoll z-50 mt-2"
                setSelected={(selected) => setBed(selected as BedModel)}
                selected={bed}
                error=""
                multiple={false}
                location={asset?.location_object?.id}
                facility={asset?.location_object?.facility?.id}
              />
            </div>
            <div>
              <label id="location">Preset Name</label>
              <TextFormField
                name="name"
                id="location"
                type="text"
                value={newPreset}
                className="mt-1"
                onChange={(e) => setNewPreset(e.value)}
                error=""
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Submit disabled={isLoading} label="Add Preset" />
          </div>
        </form>
      </Card>
      <Card className="mt-4">
        <LiveFeed
          asset={getCameraConfig(asset)}
          middlewareHostname={facilityMiddlewareHostname}
          showRefreshButton={true}
          refreshPresetsHash={refreshPresetsHash}
        />
      </Card>
    </div>
  );
}
