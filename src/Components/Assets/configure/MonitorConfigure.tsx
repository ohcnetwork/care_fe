import React, { Dispatch, useEffect, useState } from "react";
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
import { Submit } from "../../Common/components/ButtonV2";
import { FieldLabel } from "../../Form/FormFields/FormField";
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
  const [bedError, setBedError] = useState("");
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

  const isFormValid = () => {
    console.log(bed);
    if (!bed || Object.keys(bed).length === 0) {
      setBedError("Please Select a Bed");
      return false;
    }
    setBedError("");
    return true;
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (isFormValid()) {
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
        }
      }}
    >
      <div className="flex flex-col">
        <div className="w-full">
          <FieldLabel required >
            Bed
          </FieldLabel>

          <BedSelect
            name="bed"
            setSelected={(selected) => setBed(selected as BedModel)}
            selected={bed}
            error={bedError}
            multiple={false}
            location={asset?.location_object?.id}
            facility={asset?.location_object?.facility?.id}
            className="w-full"
          />
        </div>
        <Submit className="shrink-0 w-full mt-6">
          <i className="fas fa-bed-pulse" />
          {updateLink ? "Update Bed" : "Save Bed"}
        </Submit>
      </div>
    </form>
  );
}
