import React from "react";
import { AssetData } from "../AssetTypes";
import LiveFeed from "../../Facility/Consultations/LiveFeed";
import { BedSelect } from "../../Common/BedSelect";
import { BedModel } from "../../Facility/models";
import { getCameraConfig } from "../../../Utils/transformUtils";
import { Submit } from "../../Common/components/ButtonV2";
import TextFormField from "../../Form/FormFields/TextFormField";
import Card from "../../../CAREUI/display/Card";
import CameraBoundaryConfigure from "./CameraBoundayConfigure";

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
  boundaryPreset: any;
  setBoundaryPreset: (preset: any) => void;
  addBoundaryPreset(e: any): void;
  updateBoundaryPreset(e: any): void;
  deleteBoundaryPreset(e: any): void;
  toUpdateBoundary: boolean;
  setToUpdateBoundary(toUpdate: boolean): void;
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
    boundaryPreset,
    setBoundaryPreset,
    addBoundaryPreset,
    updateBoundaryPreset,
    deleteBoundaryPreset,
    toUpdateBoundary,
    setToUpdateBoundary,
  } = props;
  return (
    <div className="mb-5">
      <Card className="mt-4">
        <div className="mb-2 grid gap-2 grid-cols-1 md:grid-cols-2">
          <div>
            <label id="asset-type">Bed</label>
            <BedSelect
              name="bed"
              className="overflow-y-scoll mt-2 z-50"
              setSelected={(selected) => setBed(selected as BedModel)}
              selected={bed}
              error=""
              multiple={false}
              location={asset?.location_object?.id}
              facility={asset?.location_object?.facility?.id}
            />
          </div>
        </div>
        <div className="my-6 grid gap-x-20 gap-y-10 grid-cols-1 md:grid-cols-2">
          <div className="flex flex-col justify-between">
            <div className="text-lg font-semibold">Add Preset</div>
            <form onSubmit={addPreset} className="mt-2">
              <label id="location">Preset Name</label>
              <TextFormField
                name="name"
                id="location"
                type="text"
                value={newPreset}
                className=""
                onChange={(e) => setNewPreset(e.value)}
                error=""
              />
              <div className="flex justify-start mt-4">
                <Submit disabled={isLoading} label="Add Preset" />
              </div>
            </form>
          </div>

          <CameraBoundaryConfigure
            addBoundaryPreset={addBoundaryPreset}
            updateBoundaryPreset={updateBoundaryPreset}
            deleteBoundaryPreset={deleteBoundaryPreset}
            boundaryPreset={boundaryPreset}
            toUpdateBoundary={toUpdateBoundary}
            setToUpdateBoundary={setToUpdateBoundary}
            bed={bed}
          />
        </div>
      </Card>
      <Card className="mt-4">
        <LiveFeed
          middlewareHostname={facilityMiddlewareHostname}
          asset={getCameraConfig(asset)}
          showRefreshButton={true}
          refreshPresetsHash={refreshPresetsHash}
          boundaryPreset={boundaryPreset}
          setBoundaryPreset={setBoundaryPreset}
          updateBoundaryPreset={updateBoundaryPreset}
          toUpdateBoundary={toUpdateBoundary}
        />
      </Card>
    </div>
  );
}
