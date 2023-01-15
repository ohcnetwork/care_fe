import { Fragment, SyntheticEvent, useState } from "react";
import React from "react";
import { AssetData } from "../AssetTypes";
import { Card, CardContent } from "@material-ui/core";
import { TextInputField } from "../../Common/HelperInputFields";
import LiveFeed from "../../Facility/Consultations/LiveFeed";
import { BedSelect } from "../../Common/BedSelect";
import { BedModel } from "../../Facility/models";
import { getCameraConfig } from "../../../Utils/transformUtils";
import { Submit } from "../../Common/components/ButtonV2";
import { FieldLabel } from "../../Form/FormFields/FormField";

interface CameraConfigureProps {
  asset: AssetData;
  addPreset(e: React.SyntheticEvent): void;
  setBed(bed: BedModel): void;
  bed: BedModel;
  newPreset: string;
  setNewPreset(preset: string): void;
  refreshPresetsHash: number;
  facilityMiddlewareHostname: string;
}
export default function CameraConfigure(props: CameraConfigureProps) {
  const {
    asset,
    addPreset,
    setBed,
    bed,
    newPreset,
    setNewPreset,
    refreshPresetsHash,
    facilityMiddlewareHostname,
  } = props;
  const [bedError, setBedError] = useState("");
  const [newPresetError, setnewPresetError] = useState("");

  const isFormValid = () => {
    console.log(bed);
    if (!bed || Object.keys(bed).length === 0) {
      setBedError("Please Select a Bed");
      return false;
    }
    if (newPreset.trim() === "") {
      setnewPresetError("Please enter a preset");
      return false;
    }
    setBedError("");
    setnewPresetError("");
    return true;
  };

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault();
    if (isFormValid()) {
      addPreset(e);
    }
  };
  return (
    <Fragment>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="mt-2 grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
                <FieldLabel required id="asset-type">
                  Bed
                </FieldLabel>
                <BedSelect
                  name="bed"
                  setSelected={(selected) => setBed(selected as BedModel)}
                  selected={bed}
                  errors={bedError}
                  multiple={false}
                  margin="dense"
                  location={asset?.location_object?.id}
                  facility={asset?.location_object?.facility?.id}
                />
              </div>
              <div>
                <FieldLabel required id="location">
                  Preset Name
                </FieldLabel>
                <TextInputField
                  name="name"
                  id="location"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  value={newPreset}
                  onChange={(e) => setNewPreset(e.target.value)}
                  errors={newPresetError}
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Submit label="Add Preset" />
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
    </Fragment>
  );
}
