import { Fragment } from "react";
import React from "react";
import { AssetData } from "../AssetTypes";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import { Card, CardContent, InputLabel, Button } from "@material-ui/core";
import { TextInputField } from "../../Common/HelperInputFields";
import LiveFeed from "../../Facility/Consultations/LiveFeed";
import { BedSelect } from "../../Common/BedSelect";
import { BedModel } from "../../Facility/models";
import { getCameraConfig } from "../../../Utils/transformUtils";

interface CameraConfigureProps {
  asset: AssetData;
  addPreset(e: React.SyntheticEvent): void;
  setBed(bed: BedModel): void;
  bed: BedModel;
  newPreset: string;
  setNewPreset(preset: string): void;
  refreshPresetsHash: number;
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
  } = props;

  return (
    <Fragment>
      <Card>
        <form onSubmit={addPreset}>
          <CardContent>
            <div className="mt-2 grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
                <InputLabel id="asset-type">Bed</InputLabel>
                <BedSelect
                  name="bed"
                  setSelected={(selected) => setBed(selected as BedModel)}
                  selected={bed}
                  errors=""
                  multiple={false}
                  margin="dense"
                  location={asset?.location_object?.id}
                  facility={asset?.location_object?.facility?.id}
                />
              </div>
              <div>
                <InputLabel id="location">Preset Name</InputLabel>
                <TextInputField
                  name="name"
                  id="location"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  value={newPreset}
                  onChange={(e) => setNewPreset(e.target.value)}
                  errors=""
                />
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <Button
                color="primary"
                variant="contained"
                type="submit"
                style={{ marginLeft: "auto" }}
                startIcon={<CheckCircleOutlineIcon></CheckCircleOutlineIcon>}
              >
                Add Preset
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
      <Card>
        <CardContent>
          <LiveFeed
            middlewareHostname={asset?.meta?.middleware_hostname}
            asset={getCameraConfig(asset)}
            showRefreshButton={true}
            refreshPresetsHash={refreshPresetsHash}
          />
        </CardContent>
      </Card>
    </Fragment>
  );
}
