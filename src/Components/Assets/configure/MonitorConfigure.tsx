import React, { Dispatch, useEffect } from "react";
import { Button, Card, CardContent, InputLabel } from "@material-ui/core";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import { BedSelect } from "../../Common/BedSelect";
import { BedModel } from "../../Facility/models";
import { AssetData } from "../AssetTypes";
import { createAssetBed, listAssetBeds } from "../../../Redux/actions";
import { useDispatch } from "react-redux";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const saveLink = (assetId: string, bedId: string, dispatch: Dispatch<any>) => {
  console.log("Saving Link");
  dispatch(createAssetBed({}, assetId, bedId));
  //   { meta: { ...data, ...presetData.data } },
  //   assetId,
  //   bed?.id as string
};

export default function MonitorConfigure({ asset }: { asset: AssetData }) {
  const [bed, setBed] = React.useState<BedModel>({});
  const dispatch: any = useDispatch();

  const getAssetBeds = async (id: string) => {
    const assetBeds = await dispatch(listAssetBeds({ asset: id }));
    if (assetBeds.data?.results?.length > 0) {
      setBed(assetBeds.data.results[0].bed_object);
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
          saveLink(asset.id as string, bed?.id as string, dispatch);
        }}
      >
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
          </div>

          <div className="flex justify-between mt-4">
            <Button
              color="primary"
              variant="contained"
              type="submit"
              style={{ marginLeft: "auto" }}
              startIcon={<CheckCircleOutlineIcon></CheckCircleOutlineIcon>}
            >
              Save Link
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
