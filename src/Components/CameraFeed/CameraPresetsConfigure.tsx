import { useState } from "react";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import { AssetBedModel, AssetData } from "../Assets/AssetTypes";
import Page from "../Common/components/Page";
import Loading from "../Common/Loading";
import CameraFeed from "./CameraFeed";
import useOperateCamera from "./useOperateCamera";
import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import request from "../../Utils/request/request";
import { FeedRoutes } from "./routes";
import { classNames } from "../../Utils/utils";

type Props = {
  locationId: string;
} & (
  | { assetId: string; bedId?: undefined }
  | { assetId?: undefined; bedId?: string }
  | { assetId: string; bedId: string }
);

export default function CameraPresetsConfigure(props: Props) {
  const [current, setCurrent] = useState<AssetBedModel>();

  const camerasQuery = useQuery(routes.listAssets, {
    query: { location: props.locationId, asset_class: "ONVIF" },
    prefetch: !props.assetId,
  });

  // const bedsQuery = useQuery(routes.listFacilityBeds, {
  //   query: { location: props.locationId },
  //   prefetch: !props.bedId,
  // });

  const assetBedsQuery = useQuery(routes.listAssetBeds, {
    query: {
      asset: props.assetId,
      bed: props.bedId,
    },
    onResponse: ({ data }) => setCurrent(data?.results[0]),
  });

  const cameraPresetsQuery = useQuery(FeedRoutes.listPresets, {
    pathParams: { assetbed_id: current?.id ?? "" },
    prefetch: !!current?.id,
  });

  if (!assetBedsQuery.data || !camerasQuery.data) {
    return <Loading />;
  }

  const assetBeds = assetBedsQuery.data.results;

  const linkedCameraIds = assetBeds.map((obj) => obj.asset_object.id);

  // TODO: filter using Backend
  const camerasNotLinked = camerasQuery.data.results.filter(
    ({ id }) => !linkedCameraIds.includes(id),
  );

  return (
    <Page title="Configure Cameras linked to Bed">
      <div className="flex flex-col gap-8 p-4 md:flex-row">
        <div className="min-w-72 whitespace-nowrap rounded-lg bg-white p-4 shadow">
          <div>
            <h5 className="pt-2">Cameras</h5>
            <ul className="space-y-2 py-4">
              {assetBeds.map((assetBed) => {
                const isSelected = current?.id === assetBed.id;
                return (
                  <li
                    key={`assetbed-${assetBed.id}`}
                    className={classNames(
                      "flex items-center justify-between gap-12 rounded border-2 p-2 transition-all duration-200 ease-in-out",
                      isSelected
                        ? "border-primary-500"
                        : "border-secondary-300",
                    )}
                  >
                    <span className="text-sm font-semibold capitalize text-secondary-800">
                      {assetBed.asset_object.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <ButtonV2
                        size="small"
                        variant="secondary"
                        className="!gap-0.5"
                        shadow={false}
                        border
                        tooltip="Configure"
                        tooltipClassName="tooltip-bottom translate-y-2 -translate-x-1/2 text-xs"
                        onClick={() => setCurrent(assetBed)}
                      >
                        <CareIcon icon="l-cog" className="text-base" />
                      </ButtonV2>
                      <ButtonV2
                        size="small"
                        variant="danger"
                        ghost
                        className="!gap-0.5"
                        shadow={false}
                        border
                        tooltip="Unlink"
                        tooltipClassName="tooltip-bottom translate-y-2 -translate-x-1/2 text-xs"
                        onClick={async () => {
                          const { res } = await request(routes.deleteAssetBed, {
                            pathParams: { external_id: assetBed.id },
                          });

                          if (res?.ok) {
                            camerasQuery.refetch();
                            assetBedsQuery.refetch();
                          }
                        }}
                      >
                        <CareIcon icon="l-ban" className="text-sm" />
                      </ButtonV2>
                    </div>
                  </li>
                );
              })}
              {camerasNotLinked.map((camera) => (
                <li
                  key={`camera-${camera.id}`}
                  className="flex items-center justify-between gap-12 rounded border-2 border-secondary-300 p-2 transition-all duration-200 ease-in-out"
                >
                  <span className="text-sm font-semibold capitalize text-secondary-600">
                    {camera.name}
                  </span>
                  <ButtonV2
                    size="small"
                    variant="secondary"
                    className="!gap-0.5"
                    shadow={false}
                    border
                    tooltip="Link"
                    tooltipClassName="tooltip-bottom translate-y-2 -translate-x-1/2 text-xs"
                    onClick={async () => {
                      const { res } = await request(routes.createAssetBed, {
                        body: { asset: camera.id, bed: props.bedId },
                      });

                      if (res?.ok) {
                        camerasQuery.refetch();
                        assetBedsQuery.refetch();
                      }
                    }}
                  >
                    <CareIcon icon="l-link-alt" className="text-sm" />
                  </ButtonV2>
                </li>
              ))}
            </ul>
          </div>

          {/* Camera Presets */}
          <div>
            {!!current && (
              <>
                <h5 className="pt-2">Position Presets</h5>
                <ul className="space-y-2.5 py-4">
                  {cameraPresetsQuery.data?.results.map((preset) => (
                    <li
                      key={`preset-${preset.id}`}
                      className="flex items-center justify-between gap-12"
                    >
                      <span className="text-sm font-semibold text-secondary-800">
                        {preset.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <ButtonV2
                          size="small"
                          variant="secondary"
                          className="!gap-0.5"
                          shadow={false}
                          border
                          tooltip="Use current position as preset"
                          tooltipClassName="tooltip-bottom translate-y-2 -translate-x-1/2 text-xs"
                          // onClick={() => setCurrent(assetBed)}
                        >
                          <CareIcon icon="l-cog" className="text-base" />
                        </ButtonV2>
                        <ButtonV2
                          size="small"
                          variant="danger"
                          ghost
                          className="!gap-0.5"
                          shadow={false}
                          border
                          tooltip="Delete preset"
                          tooltipClassName="tooltip-bottom translate-y-2 -translate-x-1/2 text-xs"
                          // onClick={async () => {
                          //   const { res } = await request(routes.deleteAssetBed, {
                          //     pathParams: { external_id: assetBed.id },
                          //   });

                          //   if (res?.ok) {
                          //     camerasQuery.refetch();
                          //     assetBedsQuery.refetch();
                          //   }
                          // }}
                        >
                          <CareIcon icon="l-trash-alt" className="text-sm" />
                        </ButtonV2>
                      </div>
                    </li>
                  ))}

                  {!cameraPresetsQuery.data?.results.length && (
                    <span>No position presets</span>
                  )}
                </ul>
              </>
            )}
          </div>
        </div>
        <div className="w-full">
          {!current ? (
            <div className="mx-4 flex aspect-video items-center justify-center rounded-lg border-4 border-dashed border-secondary-400 p-10 shadow">
              <span className="text-center text-lg font-semibold text-secondary-500">
                <p>No camera selected</p>
                <p>Select a linked camera to preview its feed here</p>
              </span>
            </div>
          ) : (
            <LinkedCameraFeed
              key={current.asset_object.id}
              asset={current.asset_object}
            />
          )}
        </div>
      </div>
    </Page>
  );
}

const LinkedCameraFeed = (props: { asset: AssetData }) => {
  const { operate, key } = useOperateCamera(props.asset.id, true);
  const [cameraPresets, setCameraPresets] = useState<Record<string, number>>();
  // const [search, setSearch] = useState("");

  return (
    <div className="flex overflow-hidden rounded-lg shadow">
      <div className="w-full">
        <CameraFeed
          asset={props.asset}
          key={key}
          // preset={preset?.meta.position}
          shortcutsDisabled
          operate={operate}
          onCameraPresetsObtained={(presets) => {
            if (!cameraPresets) {
              setCameraPresets(presets);
            }
          }}
        />
      </div>
      {/* <div className="whitespace-nowrap rounded-r-lg bg-white p-4">
        <h5 className="py-2">ONVIF Presets</h5>
        <TextFormField
          name="onvif-presets-search"
          value={search}
          placeholder="Search"
          onChange={(e) => setSearch(e.value)}
          errorClassName="hidden"
        />
        <ul className="space-y-2.5 py-4 overflow-y-auto h-min">
          {!!cameraPresets &&
            Object.keys(cameraPresets).map((key) => (
              <li
                key={key}
                className="flex items-center justify-between gap-12"
              >
                <span className="text-sm font-semibold text-secondary-800">
                  {key}
                </span>
                <div className="flex items-center gap-1">
                  <ButtonV2
                    size="small"
                    variant="secondary"
                    className="!gap-0.5"
                    shadow={false}
                    border
                    tooltip="Configure"
                    tooltipClassName="tooltip-bottom translate-y-2 -translate-x-1/2 text-xs"
                    // onClick={() => setCurrent(assetBed)}
                  >
                    <CareIcon icon="l-cog" className="text-base" />
                  </ButtonV2>
                </div>
              </li>
            ))}
        </ul>
      </div> */}
    </div>
  );
};
