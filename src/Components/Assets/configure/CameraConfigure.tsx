import * as Notification from "../../../Utils/Notifications.js";

import CareIcon, { IconName } from "../../../CAREUI/icons/CareIcon";
import { SyntheticEvent, useState } from "react";
import useOperateCamera, {
  PTZPayload,
} from "../../CameraFeed/useOperateCamera";

import { AssetData } from "../AssetTypes";
import { BedModel } from "../../Facility/models";
import { BedSelect } from "../../Common/BedSelect";
import ButtonV2 from "../../Common/components/ButtonV2";
import CameraFeed from "../../CameraFeed/CameraFeed";
import Card from "../../../CAREUI/display/Card";
import { FieldErrorText } from "../../Form/FormFields/FormField";
import { GetStatusResponse } from "../../CameraFeed/routes";
import TextFormField from "../../Form/FormFields/TextFormField";
import { classNames } from "../../../Utils/utils";
import request from "../../../Utils/request/request.js";
import routes from "../../../Redux/api";
import { useTranslation } from "react-i18next";

interface CameraConfigureProps {
  asset: AssetData;
}

type Preset = {
  name: string;
  position?: {
    x: number;
    y: number;
    z: number;
  };
  boundary?: {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
  };
};
type BoundaryKeys = keyof NonNullable<Preset["boundary"]>;
const boundaryIconMap: Record<BoundaryKeys, IconName> = {
  x0: "l-border-left",
  x1: "l-border-right",
  y0: "l-border-top",
  y1: "l-border-bottom",
};

export default function CameraConfigure({ asset }: CameraConfigureProps) {
  const { t } = useTranslation();
  const [bed, setBed] = useState<BedModel>({});
  const [preset, setPreset] = useState<Preset>({
    name: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [enableBoundarySetting, setEnableBoundarySetting] = useState(false);

  const { operate, key } = useOperateCamera(asset.id);

  const setPresetPosition = async () => {
    const { data } = await operate({ type: "get_status" });

    const position = (data as GetStatusResponse)?.result?.position;

    if (!position) {
      return;
    }

    setPreset((preset) => ({
      ...preset,
      position: { x: position.x, y: position.y, z: position.zoom },
    }));
  };

  const addPreset = async () => {
    setIsLoading(true);

    // TODO: create asset bed linking
    const { res } = await request(routes.createAssetBed, {
      body: {
        meta: {
          bed_id: bed.id,
          preset_name: preset.name,
        },
        asset: asset.id,
        bed: bed?.id as string,
      },
    });

    // TODO: create preset

    setIsLoading(false);
  };

  console.log(preset);

  return (
    <div className="mb-5">
      <Card className="mt-4">
        <form>
          <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label id="asset-type">Bed</label>
              <BedSelect
                name="bed"
                className="overflow-y-scoll z-50 mt-2"
                setSelected={(selected) => setBed(selected as BedModel)}
                selected={bed}
                error=""
                multiple={false}
                location={asset?.location_object?.id}
                facility={asset?.location_object?.facility?.id}
              />
            </div>
            <div>
              <label id="location">Preset Name</label>
              <TextFormField
                name="name"
                id="location"
                type="text"
                value={preset.name}
                className="mt-1"
                onChange={(e) =>
                  setPreset((preset) => ({ ...preset, name: e.value }))
                }
                errorClassName="hidden"
                error={
                  preset.name.length > 12
                    ? "It is advisable to keep preset name below 12 characters"
                    : ""
                }
              />
            </div>
          </div>

          {enableBoundarySetting && (
            <div className="mt-6">
              <h5>Set Boundary</h5>
              <p className="text-sm text-secondary-600">
                We strongly recommend NOT to set boundary values manually. Use
                the navigations within camera feed to set the boundary values.
              </p>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                {(["x0", "x1", "y0", "y1"] as BoundaryKeys[]).map(
                  (boundary) => (
                    <>
                      <TextFormField
                        name={boundary}
                        id={boundary}
                        type="number"
                        min={
                          (
                            {
                              x1: preset.position?.x,
                              y1: preset.position?.y,
                            } as Record<BoundaryKeys, number>
                          )[boundary]
                        }
                        max={
                          (
                            {
                              x0: preset.position?.x,
                              y0: preset.position?.y,
                            } as Record<BoundaryKeys, number>
                          )[boundary]
                        }
                        label={
                          <label>
                            {t("camera_preset__boundary_" + boundary)}
                          </label>
                        }
                        value={preset.boundary?.[boundary]?.toString() ?? ""}
                        className="mt-1"
                        onChange={(e) =>
                          setPreset((preset) => ({
                            ...preset,
                            boundary: {
                              ...preset.boundary,
                              [boundary]: Number(e.value),
                            },
                          }))
                        }
                        errorClassName="hidden"
                      />
                    </>
                  ),
                )}
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-3">
            {!enableBoundarySetting ? (
              <ButtonV2
                type="button"
                disabled={isLoading}
                onClick={async () => {
                  await setPresetPosition();
                  setEnableBoundarySetting(true);
                }}
              >
                Set Boundary
              </ButtonV2>
            ) : (
              <ButtonV2
                type="button"
                variant="secondary"
                disabled={isLoading}
                onClick={() => {
                  setEnableBoundarySetting(false);
                }}
              >
                Cancel
              </ButtonV2>
            )}

            <ButtonV2
              type="button"
              disabled={isLoading}
              onClick={async () => {
                if (!enableBoundarySetting) {
                  await setPresetPosition();
                }
                await addPreset();
              }}
            >
              Add Preset
            </ButtonV2>
          </div>
        </form>
      </Card>
      <Card className="mt-4">
        <CameraFeed
          asset={asset}
          key={key}
          operate={operate}
          additionalControls={({ inlineView }) =>
            enableBoundarySetting && (
              <div
                className={classNames(
                  inlineView
                    ? "absolute top-6 right-0 transition-all delay-100 duration-200 ease-in-out group-hover:right-8 group-hover:delay-0"
                    : "mt-4 flex items-center relative",
                )}
              >
                <div
                  className={classNames(
                    "grid gap-2 items-center justify-center",
                    inlineView ? "grid-cols-2" : "grid-cols-1 w-full",
                  )}
                >
                  {(["x0", "x1", "y0", "y1"] as BoundaryKeys[]).map(
                    (boundary) => (
                      <ButtonV2
                        onClick={async () => {
                          const { data } = await operate({
                            type: "get_status",
                          });

                          const position = (data as GetStatusResponse).result
                            ?.position;

                          if (!position || !preset.position) {
                            return;
                          }

                          if (
                            boundary === "x0" &&
                            !preset.boundary?.[boundary] &&
                            position.x >= preset.position.x
                          ) {
                            Notification.Warn({
                              msg: "Left boundary value cannot be greater than preset position",
                            });
                            return;
                          }

                          if (
                            boundary === "x1" &&
                            !preset.boundary?.[boundary] &&
                            position.x <= preset.position.x
                          ) {
                            Notification.Warn({
                              msg: "Right boundary value cannot be lesser than preset position",
                            });
                            return;
                          }

                          if (
                            boundary === "y0" &&
                            !preset.boundary?.[boundary] &&
                            position.y <= preset.position.y
                          ) {
                            Notification.Warn({
                              msg: "Top boundary value cannot be lesser than preset position",
                            });
                            return;
                          }

                          if (
                            boundary === "y1" &&
                            !preset.boundary?.[boundary] &&
                            position.y >= preset.position.y
                          ) {
                            Notification.Warn({
                              msg: "Bottom boundary value cannot be greater than preset position",
                            });
                            return;
                          }

                          setPreset((preset) => ({
                            ...preset,
                            boundary: {
                              ...preset.boundary,
                              [boundary]: preset.boundary?.[boundary]
                                ? undefined
                                : ["x0", "x1"].includes(boundary)
                                  ? position.x
                                  : position.y,
                            },
                          }));
                        }}
                        variant={
                          preset.boundary?.[boundary] ? "danger" : "primary"
                        }
                        size="small"
                        type="button"
                      >
                        <div>
                          <CareIcon
                            icon={boundaryIconMap[boundary]}
                            className="w-5 h-5"
                          />
                        </div>
                        {preset.boundary?.[boundary]
                          ? t("remove")
                          : t("set_as")}{" "}
                        {t("camera_preset__boundary_" + boundary)}
                      </ButtonV2>
                    ),
                  )}
                  <ButtonV2
                    onClick={async () => {
                      await operate({
                        type: "absolute_move",
                        data: {
                          x: preset.position?.x ?? 0,
                          y: preset.position?.y ?? 0,
                          zoom: preset.position?.z ?? 0,
                        },
                      });
                    }}
                    className="col-span-full"
                    size="small"
                    type="button"
                  >
                    <div>
                      <CareIcon icon="l-border-inner" className="w-5 h-5" />
                    </div>
                    {t("reset_to_preset")}
                  </ButtonV2>
                </div>
              </div>
            )
          }
        />
      </Card>
    </div>
  );
}
