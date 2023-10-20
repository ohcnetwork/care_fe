import { useState } from "react";
import { BedSelect } from "../../Common/BedSelect";
import { BedModel } from "../../Facility/models";
import { AssetData } from "../AssetTypes";
import * as Notification from "../../../Utils/Notifications.js";
import { Submit } from "../../Common/components/ButtonV2";
import { FieldLabel } from "../../Form/FormFields/FormField";
import request from "../../../Utils/request/request";
import routes from "../../../Redux/api";
import useQuery from "../../../Utils/request/useQuery";

const saveLink = async (assetId: string, bedId: string) => {
  await request(routes.createAssetBed, {
    body: {
      asset: assetId,
      bed: bedId,
    },
  });
  Notification.Success({ msg: "AssetBed Link created successfully" });
};
const update_Link = async (
  assetbedId: string,
  assetId: string,
  bed: BedModel
) => {
  await request(routes.partialUpdateAssetBed, {
    pathParams: { external_id: assetbedId },
    body: {
      asset: assetId,
      bed: bed.id ?? "",
    },
  });
  Notification.Success({ msg: "AssetBed Link updated successfully" });
};

export default function MonitorConfigure({ asset }: { asset: AssetData }) {
  const [bed, setBed] = useState<BedModel>({});
  const [updateLink, setUpdateLink] = useState<boolean>(false);
  const { data: assetBed } = useQuery(routes.listAssetBeds, {
    query: { asset: asset.id },
    onResponse: ({ res, data }) => {
      if (res?.status === 200 && data && data.results.length > 0) {
        setBed(data.results[0].bed_object);
        setUpdateLink(true);
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (updateLink) {
          update_Link(
            assetBed?.results[0].id as string,
            asset.id as string,
            bed as BedModel
          );
        } else {
          saveLink(asset.id as string, bed?.id as string);
        }
      }}
    >
      <div className="flex flex-col">
        <div className="w-full">
          <FieldLabel className="">Bed</FieldLabel>
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
        <Submit className="mt-6 w-full shrink-0">
          <i className="fas fa-bed-pulse" />
          {updateLink ? "Update Bed" : "Save Bed"}
        </Submit>
      </div>
    </form>
  );
}
