import { useState } from "react";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import { AssetBedModel } from "../Assets/AssetTypes";
import Page from "../Common/components/Page";
import Loading from "../Common/Loading";
import CameraFeed from "./CameraFeed";
import useOperateCamera from "./useOperateCamera";
import ButtonV2, { Submit } from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import request from "../../Utils/request/request";
import { CameraPreset, FeedRoutes, GetStatusResponse } from "./routes";
import { classNames } from "../../Utils/utils";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { dropdownOptionClassNames } from "../Form/MultiSelectMenuV2";
import DialogModal from "../Common/Dialog";
import TextFormField from "../Form/FormFields/TextFormField";
import { Success } from "../../Utils/Notifications";

type Props = {
  locationId: string;
  bedId: string;
};

type OnvifPreset = { name: string; value: number };

export default function CameraPresetsConfigure(props: Props) {
  const [current, setCurrent] = useState<AssetBedModel>();

  const camerasQuery = useQuery(routes.listAssets, {
    query: {
      location: props.locationId,
      asset_class: "ONVIF",
    },
  });

  const assetBedsQuery = useQuery(routes.listAssetBeds, {
    query: {
      bed: props.bedId,
    },
    onResponse: ({ data }) => setCurrent(data?.results[0]),
  });

  const cameraPresetsQuery = useQuery(FeedRoutes.listAssetBedPresets, {
    pathParams: { assetbed_id: current?.id ?? "" },
    query: { position: true },
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
        <div className="min-w-72 rounded-lg bg-white p-4 shadow">
          <div>
            <h5 className="pt-2">Cameras</h5>
            <ul className="space-y-2 py-4">
              {assetBeds.map((assetBed) => {
                const isSelected = current?.id === assetBed.id;
                return (
                  <li
                    key={`assetbed-${assetBed.id}`}
                    className={classNames(
                      "flex items-center justify-between gap-12 rounded border p-2 transition-all duration-200 ease-in-out",
                      isSelected
                        ? "border-primary-500 bg-primary-100/50"
                        : "border-secondary-300",
                    )}
                  >
                    <span className="whitespace-nowrap text-sm font-semibold capitalize text-secondary-800">
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
                        variant="secondary"
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
                        <CareIcon icon="l-minus" className="text-sm" />
                      </ButtonV2>
                    </div>
                  </li>
                );
              })}
              {camerasNotLinked.map((camera) => (
                <li
                  key={`camera-${camera.id}`}
                  className="flex items-center justify-between rounded border-2 border-secondary-300 p-2 transition-all duration-200 ease-in-out"
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
                    <CareIcon icon="l-plus" className="text-sm" />
                  </ButtonV2>
                </li>
              ))}
            </ul>
            {camerasNotLinked.length === 0 && assetBeds.length === 0 && (
              <span className="text-sm font-medium text-secondary-700">
                No cameras available in this location
              </span>
            )}
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
                          onClick={async () => {
                            const { res } = await request(
                              FeedRoutes.deletePreset,
                              {
                                pathParams: {
                                  assetbed_id: current.id,
                                  id: preset.id,
                                },
                              },
                            );
                            if (res?.ok) {
                              Success({ msg: "Preset deleted" });
                              cameraPresetsQuery.refetch();
                            }
                          }}
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
              key={current.id}
              assetBed={current}
              onPresetCreated={() => cameraPresetsQuery.refetch()}
            />
          )}
        </div>
      </div>
    </Page>
  );
}

const LinkedCameraFeed = (props: {
  assetBed: AssetBedModel;
  onPresetCreated: () => void;
}) => {
  const { operate, key } = useOperateCamera(props.assetBed.asset_object.id);
  const [onvifPresets, setOnvifPresets] = useState<OnvifPreset[]>();
  const [currentOnvifPreset, setCurrentOnvifPreset] = useState<OnvifPreset>();
  const [createPresetPosition, setCreatePresetPosition] =
    useState<CameraPreset["position"]>();
  const [presetName, setPresetName] = useState("");

  return (
    <div className="flex overflow-hidden rounded-lg shadow">
      <DialogModal
        show={!!createPresetPosition}
        title="Create new position preset"
        description="Creates a new position preset from the current position for the given name"
        onClose={() => {
          setCreatePresetPosition(undefined);
          setPresetName("");
        }}
      >
        <TextFormField
          name="preset-name"
          className="py-4"
          onChange={({ value }) => setPresetName(value)}
          errorClassName="hidden"
          placeholder="Specify an identifiable name for the new preset"
        />
        {/* <div className="font-mono px-1 py-2 text-xs text-secondary-700">
          {JSON.stringify(createPresetPosition, undefined, "  ")}
        </div> */}
        <div className="cui-form-button-group">
          <Submit
            onClick={async () => {
              const { res } = await request(FeedRoutes.createPreset, {
                pathParams: { assetbed_id: props.assetBed.id },
                body: {
                  name: presetName,
                  position: createPresetPosition,
                },
              });
              if (!res?.ok) {
                return;
              }
              setCreatePresetPosition(undefined);
              setPresetName("");
              Success({ msg: "Preset created" });
              props.onPresetCreated();
            }}
            disabled={!presetName}
          />
        </div>
      </DialogModal>
      <div className="w-full">
        <CameraFeed
          asset={props.assetBed.asset_object}
          key={key}
          // preset={preset?.meta.position}
          shortcutsDisabled
          operate={operate}
          onCameraPresetsObtained={(presets) => {
            if (!onvifPresets) {
              setOnvifPresets(
                Object.entries(presets).map(([name, value]) => ({
                  name,
                  value,
                })),
              );
            }
          }}
        >
          <div className="flex items-center gap-2">
            <Listbox
              value={currentOnvifPreset}
              onChange={(preset) => {
                setCurrentOnvifPreset(preset);
                operate({
                  type: "goto_preset",
                  data: {
                    preset: preset.value,
                  },
                });
              }}
              disabled={!onvifPresets?.length}
            >
              <div className="relative flex-1">
                <ListboxButton className="button-size-small button-shape-square button-secondary-default button-secondary-border relative inline-flex h-min min-w-32 cursor-pointer items-center gap-2 whitespace-pre pr-12 text-left text-sm font-medium outline-offset-1 transition-all duration-200 ease-in-out enabled:hover:shadow-md disabled:cursor-not-allowed disabled:bg-secondary-200 disabled:text-secondary-500 md:min-w-40">
                  <span className="block truncate">
                    {!onvifPresets?.length
                      ? "No presets"
                      : (currentOnvifPreset?.name ??
                        "Select to move to an ONVIF Preset")}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 mr-1 mt-1 flex items-center">
                    <CareIcon
                      icon="l-angle-down"
                      className="text-xl text-zinc-400"
                    />
                  </span>
                </ListboxButton>
                <ListboxOptions
                  modal={false}
                  as="ul"
                  className="absolute z-20 max-h-48 w-full overflow-auto rounded-b-lg bg-white py-1 text-base shadow-lg ring-1 ring-secondary-500 focus:outline-none md:max-h-60"
                >
                  {onvifPresets?.map((obj) => (
                    <ListboxOption
                      as="li"
                      key={obj.value}
                      className={(args) =>
                        classNames(
                          dropdownOptionClassNames(args),
                          "px-2 py-1.5",
                        )
                      }
                      value={obj}
                    >
                      <span>{obj.name}</span>
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </div>
            </Listbox>
            <ButtonV2
              size="small"
              className="py-1.5"
              tooltip="Create a new position preset in Care from the current position of the camera in view"
              tooltipClassName="text-xs whitespace-normal tooltip-bottom -translate-x-1/2 w-full translate-y-1"
              onClick={async () => {
                const { data } = await operate({ type: "get_status" });
                if (data) {
                  setCreatePresetPosition(
                    (data as GetStatusResponse).result.position,
                  );
                }
              }}
            >
              <CareIcon icon="l-plus" className="text-sm" />
              Create new preset
            </ButtonV2>
          </div>
        </CameraFeed>
      </div>
    </div>
  );
};
