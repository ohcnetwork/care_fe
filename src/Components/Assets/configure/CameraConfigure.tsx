import React from "react";
import { AssetData } from "../AssetTypes";
import { Card, CardContent } from "@material-ui/core";
import LiveFeed from "../../Facility/Consultations/LiveFeed";
import { BedSelect } from "../../Common/BedSelect";
import { BedModel } from "../../Facility/models";
import { getCameraConfig } from "../../../Utils/transformUtils";
import { Submit } from "../../Common/components/ButtonV2";
import TextFormField from "../../Form/FormFields/TextFormField";

interface CameraConfigureProps {
  asset: AssetData;
  addPreset(e: React.SyntheticEvent): void;
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
      <Card>
        <form onSubmit={addPreset}>
          <CardContent>
            <div className="mt-2 grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
                <label id="asset-type">Bed</label>
                <BedSelect
                  name="bed"
                  className="overflow-y-scoll mt-2"
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
                  className="mt-2"
                  onChange={(e) => setNewPreset(e.value)}
                  error=""
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Submit disabled={isLoading} label="Add Preset" />
            </div>
          </CardContent>
        </form>
      </Card>
      <Card>
        <CardContent>
          <LiveFeed
            middlewareHostname={facilityMiddlewareHostname}
            asset={getCameraConfig(asset)}
            showRefreshButton={true}
            refreshPresetsHash={refreshPresetsHash}
          />
        </CardContent>
      </Card>
    </div>
  );
}
