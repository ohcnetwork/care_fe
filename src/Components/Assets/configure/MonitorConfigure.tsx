import React, { Dispatch, useEffect } from "react";
import { Button, Card, CardContent, InputLabel } from "@material-ui/core";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import { BedSelect } from "../../Common/BedSelect";
import { BedModel } from "../../Facility/models";
import { AssetData } from "../AssetTypes";
import {
  createAssetBed,
  listAssetBeds,
  partialUpdateAssetBed,
} from "../../../Redux/actions";
import * as Notification from "../../../Utils/Notifications.js";
import { useDispatch } from "react-redux";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const saveLink = (assetId: string, bedId: string, dispatch: Dispatch<any>) => {
  dispatch(createAssetBed({}, assetId, bedId));
  Notification.Success({ msg: "AssetBed Link created successfully" });
};
const update_Link = (
  assetbedId: string,
  assetId: string,
  bed: BedModel,
  assetBed: any,
  dispatch: Dispatch<any>
) => {
  dispatch(
    partialUpdateAssetBed(
      {
        asset: assetId,
        bed: bed.id,
      },
      assetbedId
    )
  );
  Notification.Success({ msg: "AssetBed Link updated successfully" });
};

export default function MonitorConfigure({ asset }: { asset: AssetData }) {
  const [bed, setBed] = React.useState<BedModel>({});
  const [bedError, setBedError] = React.useState("");
  const [updateLink, setUpdateLink] = React.useState<boolean>(false);
  const [assetBed, setAssetBed] = React.useState<any>();
  const dispatch: any = useDispatch();

  const getAssetBeds = async (id: string) => {
    const assetBeds = await dispatch(listAssetBeds({ asset: id }));
    if (assetBeds.data?.results?.length > 0) {
      setUpdateLink(true);
      setAssetBed(assetBeds.data.results[0]);
      setBed(assetBeds.data.results[0].bed_object);
    } else {
      setUpdateLink(false);
    }
  };

  useEffect(() => {
    if (asset.id) {
      getAssetBeds(asset.id);
    }
  }, [asset]);

  return (
    <Card>
      {/* Heading for "Link Bed to Monitor" */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (bed) {
            setBedError("");
            if (updateLink) {
              update_Link(
                assetBed?.id as string,
                asset.id as string,
                bed as BedModel,
                assetBed,
                dispatch
              );
            } else {
              saveLink(asset.id as string, bed?.id as string, dispatch);
            }
          } else {
            setBedError("Please select a bed !");
          }
        }}
      >
        <CardContent>
          <div className="mt-2 ml-2 grid gap-4 grid-cols-1 md:grid-cols-2">
            <div>
              <InputLabel id="asset-type">Bed</InputLabel>
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
          </div>

          <div className="flex justify-between mt-4">
            <Button
              color="primary"
              variant="contained"
              type="submit"
              style={{ marginLeft: "auto" }}
              startIcon={<CheckCircleOutlineIcon></CheckCircleOutlineIcon>}
            >
              {updateLink ? "Update Link" : "Save Link"}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
