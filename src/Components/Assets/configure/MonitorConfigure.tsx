import React, { Dispatch, useEffect } from "react";
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
    <form
      onSubmit={(e) => {
        e.preventDefault();
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
      }}
    >
      <div className="w-full">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold">Bed</h2>
          <Submit ghost border size="small">
            <i className="fas fa-bed-pulse" />
            {updateLink ? "Update" : "Save"}
          </Submit>
        </div>
        <div className="flex items-center gap-2">
          <BedSelect
            name="bed"
            setSelected={(selected) => setBed(selected as BedModel)}
            selected={bed}
            error=""
            multiple={false}
            location={asset?.location_object?.id}
            facility={asset?.location_object?.facility?.id}
            className="w-full"
          />
        </div>
      </div>
    </form>
  );
}
