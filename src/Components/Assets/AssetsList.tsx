import moment from "moment";
import NavTabs from "../Common/NavTabs";
import { useDispatch } from "react-redux";
import PageTitle from "../Common/PageTitle";
import { listAssets } from "../../Redux/actions";
import { Badge } from "../Patient/ManagePatients";
import { AssetData, AssetsResponse } from "./AssetTypes";
import React, { useState, useEffect, MouseEvent } from "react";

const AssetsList = () => {
  const [assets, setAssets] = useState<AssetData[]>([{}] as AssetData[]);
  const [tab, setTab] = useState<number>(0);
  const [internalAssets, setInternalAssets] = useState<AssetData[]>([
    {},
  ] as AssetData[]);
  const [externalAssets, setExternalAssets] = useState<AssetData[]>([
    {},
  ] as AssetData[]);

  const dispatch: any = useDispatch();
  const assetsExist = assets.length > 0 && Object.keys(assets[0]).length > 0;

  useEffect(() => {
    tab === 0 ? setAssets(internalAssets) : setAssets(externalAssets);
  }, [tab]);

  useEffect(() => {
    const runner = async () => {
      const response = await dispatch(listAssets({}));
      const assets: AssetsResponse = response.data;

      const theInternalAssets = assets.results.filter(
        (result) => result.asset_type === "INTERNAL"
      );
      const theExternalAssets = assets.results.filter(
        (result) => result.asset_type === "EXTERNAL"
      );

      setInternalAssets(theInternalAssets);
      setExternalAssets(theExternalAssets);
    };

    runner().catch(console.error);
  }, []);

  const redirectToAsset = (asset: AssetData, e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    // TODO: Redirect to Asset page once it's done.
  };

  return (
    <div className="px-2 pb-2">
      <PageTitle title="Assets" hideBack={true} />
      <div className="flex-grow mt-10 bg-white">
        <NavTabs
          onChange={setTab}
          options={[
            { value: 0, label: "Internal" },
            { value: 1, label: "External" },
          ]}
          active={tab}
        />
        <div className="p-8">
          <div className="flex flex-wrap md:-mx-4">
            {assetsExist ? (
              assets.map((asset) => (
                <div
                  key={asset.id}
                  className="w-full pb-2 cursor-pointer border-b md:flex justify-between items-center mb-3"
                  onClick={(e) => redirectToAsset(asset, e)}
                >
                  <div className="px-4 md:w-1/2">
                    <div className="md:flex justify-between w-full">
                      <p className="text-xl font-normal capitalize">
                        {asset.name}
                      </p>
                    </div>
                    <p className="font-normal text-sm">
                      {asset?.location_object?.name}
                      <span className="text-xs ml-2">
                        Updated at: {moment(asset.modified_date).format("lll")}
                      </span>
                    </p>
                  </div>
                  <div className="md:flex">
                    <div className="md:flex flex-wrap justify-end">
                      {asset.is_working ? (
                        <Badge color="green" icon="cog" text="Working" />
                      ) : (
                        <Badge color="red" icon="cog" text="Not Working" />
                      )}
                      <Badge
                        color="blue"
                        icon="location-arrow"
                        text={asset.status}
                      />
                    </div>
                    <div className="px-2">
                      <div className="btn btn-default bg-white">Details</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full pb-2 cursor-pointer mb-3">
                <p className="text-xl font-bold capitalize text-center">
                  No Assets Found
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetsList;
