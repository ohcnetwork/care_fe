import { useEffect, useState } from "react";
import { AssetData } from "../Assets/AssetTypes";
import { getCameraConfig, makeAccessKey } from "../../Utils/transformUtils";
import TextFormField from "../Form/FormFields/TextFormField";
import ButtonV2, {
  Cancel,
  Submit,
} from "@/components/Common/components/ButtonV2";
import useAuthUser from "@/common/hooks/useAuthUser";
import CareIcon from "../../CAREUI/icons/CareIcon";
import useOperateCamera from "./useOperateCamera";
import CameraFeed from "./CameraFeed";
import { useTranslation } from "react-i18next";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import { Error, Success } from "../../Utils/Notifications";
import { useQueryParams } from "raviger";
import useQuery from "../../Utils/request/useQuery";
import { classNames, compareBy } from "../../Utils/utils";
import RecordMeta from "../../CAREUI/display/RecordMeta";
import { CameraPreset, FeedRoutes, GetStatusResponse } from "./routes";
import DialogModal from "@/components/Common/Dialog";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { dropdownOptionClassNames } from "../Form/MultiSelectMenuV2";
import Loading from "@/components/Common/Loading";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import { FieldLabel } from "../Form/FormFields/FormField";
import { checkIfValidIP } from "@/common/validation";
import CheckBoxFormField from "../Form/FormFields/CheckBoxFormField";

interface Props {
  asset: AssetData;
  onUpdated: () => void;
}

type OnvifPreset = { name: string; value: number };

export default function ConfigureCamera(props: Props) {
  const { t } = useTranslation();
  const authUser = useAuthUser();

  const presetNameSuggestions = [
    t("patient_face"),
    t("patient_body"),
    t("vitals_monitor"),
  ];

  const [query, setQuery] = useQueryParams<{ bed?: string }>();
  const [meta, setMeta] = useState(props.asset.meta);
  const [onvifPresets, setOnvifPresets] = useState<OnvifPreset[]>();
  const [currentOnvifPreset, setCurrentOnvifPreset] = useState<OnvifPreset>();
  const [createPreset, setCreatePreset] = useState<CameraPreset["position"]>();
  const [editPreset, setEditPreset] = useState<{
    preset: CameraPreset["id"];
    position?: CameraPreset["position"];
  }>();
  const [presetName, setPresetName] = useState("");
  const [showUnlinkConfirmation, setShowUnlinkConfirmation] = useState(false);

  const assetBedsQuery = useQuery(routes.listAssetBeds, {
    query: { asset: props.asset.id, limit: 50 },
  });

  const bedsQuery = useQuery(routes.listFacilityBeds, {
    query: { location: props.asset.location_object.id, limit: 50 },
  });

  const linkedAssetBeds = assetBedsQuery.data?.results.sort(
    compareBy("created_date"),
  );

  const linkedBedIDs = linkedAssetBeds?.map((a) => a.bed_object.id!);
  const unlinkedBeds =
    linkedBedIDs &&
    bedsQuery.data?.results
      .filter((bed) => !linkedBedIDs.includes(bed.id!))
      .sort(compareBy("created_date"));

  const firstBedId =
    linkedAssetBeds?.[0]?.bed_object.id ?? unlinkedBeds?.[0]?.id;
  useEffect(() => {
    if (!query.bed && firstBedId) {
      setQuery({ bed: firstBedId });
    }
  }, [query.bed, firstBedId]);

  const selectedAssetBed = linkedAssetBeds?.find(
    (a) => a.bed_object.id === query.bed,
  );
  const selectedUnlinkedBed = unlinkedBeds?.find((bed) => bed.id === query.bed);

  const cameraPresetsQuery = useQuery(FeedRoutes.listAssetBedPresets, {
    pathParams: { assetbed_id: selectedAssetBed?.id ?? "" },
    query: { position: true, limit: 50 },
    prefetch: !!selectedAssetBed?.id,
  });

  useEffect(() => setMeta(props.asset.meta), [props.asset]);

  const accessKeyAttributes = getCameraConfig(meta);

  const { operate, key } = useOperateCamera(props.asset.id);

  if (!["DistrictAdmin", "StateAdmin"].includes(authUser.user_type)) {
    return (
      <div className="w-full overflow-hidden rounded-lg bg-white shadow">
        <CameraFeed
          asset={props.asset}
          key={key}
          operate={operate}
          hideAssetInfo
        />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4 py-4">
      <div className="flex w-full flex-col gap-4 md:flex-row-reverse md:items-start">
        <form
          className="rounded-lg bg-white p-4 shadow md:w-full"
          onSubmit={async (e) => {
            e.preventDefault();
            const { res } = await request(routes.partialUpdateAsset, {
              pathParams: { external_id: props.asset.id },
              body: { meta },
            });

            if (res?.ok) {
              Success({ msg: "Asset Configured Successfully" });
              props.onUpdated();
            }
          }}
        >
          <h4 className="pb-3">{t("feed_configurations")}</h4>
          <div className="grid gap-x-3 lg:grid-cols-2">
            <TextFormField
              name="middleware_hostname"
              label={
                <div className="flex flex-row gap-1">
                  <p>{t("middleware_hostname")}</p>
                  {!!props.asset.resolved_middleware &&
                    props.asset.resolved_middleware.source != "asset" && (
                      <div className="tooltip">
                        <CareIcon
                          icon="l-info-circle"
                          className="tooltip text-indigo-500 hover:text-indigo-600"
                        />
                        <span className="tooltip-text w-56 whitespace-normal">
                          {t("middleware_hostname_sourced_from", {
                            source: props.asset.resolved_middleware?.source,
                          })}
                        </span>
                      </div>
                    )}
                </div>
              }
              placeholder={
                props.asset.resolved_middleware?.hostname ??
                t("middleware_hostname_example")
              }
              value={meta?.middleware_hostname}
              onChange={({ value }) =>
                setMeta({ ...meta, middleware_hostname: value })
              }
            />
            <TextFormField
              name="camera_address"
              label={t("local_ip_address")}
              placeholder={t("local_ip_address_example")}
              autoComplete="off"
              value={meta?.local_ip_address}
              onChange={({ value }) =>
                setMeta({ ...meta, local_ip_address: value })
              }
              error={
                meta?.local_ip_address && !checkIfValidIP(meta.local_ip_address)
                  ? t("invalid_ip_address")
                  : undefined
              }
            />
            <TextFormField
              name="username"
              label={t("username")}
              autoComplete="off"
              value={accessKeyAttributes.username}
              onChange={({ value }) =>
                setMeta({
                  ...meta,
                  camera_access_key: makeAccessKey({
                    ...accessKeyAttributes,
                    username: value,
                  }),
                })
              }
            />
            <TextFormField
              name="password"
              label={t("password")}
              autoComplete="off"
              type="password"
              value={accessKeyAttributes.password}
              onChange={({ value }) =>
                setMeta({
                  ...meta,
                  camera_access_key: makeAccessKey({
                    ...accessKeyAttributes,
                    password: value,
                  }),
                })
              }
            />
            <TextFormField
              name="stream_uuid"
              label={t("stream_uuid")}
              autoComplete="off"
              type="password"
              className="tracking-widest"
              labelClassName="tracking-normal"
              value={accessKeyAttributes.accessKey}
              onChange={({ value }) =>
                setMeta({
                  ...meta,
                  camera_access_key: makeAccessKey({
                    ...accessKeyAttributes,
                    accessKey: value,
                  }),
                })
              }
            />
          </div>
          <div className="flex justify-end">
            <Submit className="w-full md:w-auto" label={t("update")} />
          </div>
        </form>

        <div className="w-full overflow-hidden rounded-lg bg-white shadow-lg">
          <CameraFeed
            asset={props.asset}
            key={`${key}-${props.asset.modified_date}`}
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
            hideAssetInfo
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
                        ? t("no_presets")
                        : (currentOnvifPreset?.name ??
                          t("move_to_onvif_preset"))}
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
            </div>
          </CameraFeed>
        </div>
      </div>

      {!linkedAssetBeds?.length && !unlinkedBeds?.length ? (
        <div className="flex w-full items-center justify-center rounded-lg border-4 border-dashed border-secondary-500/50 py-24">
          <span className="text-center text-lg font-semibold text-secondary-500">
            <p>{t("location_beds_empty")}</p>
            <p>{t("add_beds_to_configure_presets")}</p>
          </span>
        </div>
      ) : (
        <div>
          <h4 className="p-2">{t("manage_bed_presets")}</h4>
          <div className="rounded-lg bg-secondary-100 pt-2 shadow">
            <nav className="flex overflow-x-auto bg-white">
              {linkedAssetBeds?.map((obj) => (
                <span
                  key={obj.id}
                  className={classNames(
                    "cursor-pointer whitespace-nowrap border-b-2 bg-secondary-100 px-4 capitalize transition-all duration-200 ease-in-out",
                    obj.id === selectedAssetBed?.id
                      ? "border-b-primary-500 font-bold text-primary-500"
                      : "font-medium text-secondary-700 hover:border-b-primary-300",
                  )}
                  onClick={() => setQuery({ bed: obj.bed_object.id })}
                >
                  {obj.bed_object.name}
                </span>
              ))}

              {unlinkedBeds?.map((obj) => (
                <span
                  key={obj.id}
                  className={classNames(
                    "cursor-pointer whitespace-nowrap border-b-2 bg-secondary-100 px-4 capitalize opacity-70 transition-all duration-200 ease-in-out",
                    obj.id === query.bed
                      ? "border-b-primary-300 font-bold text-primary-500"
                      : "font-medium text-secondary-700 hover:border-b-primary-300",
                  )}
                  onClick={() => setQuery({ bed: obj.id })}
                >
                  {obj.name}
                </span>
              ))}
              <div className="w-full bg-secondary-100" />
            </nav>
            {cameraPresetsQuery.loading && <Loading />}
            {selectedAssetBed && (
              <>
                <ConfirmDialog
                  show={showUnlinkConfirmation}
                  title={t("unlink_asset_bed_and_presets")}
                  description={t("unlink_asset_bed_caution")}
                  action="Confirm"
                  variant="danger"
                  onClose={() => setShowUnlinkConfirmation(false)}
                  onConfirm={async () => {
                    const { res } = await request(routes.deleteAssetBed, {
                      pathParams: { external_id: selectedAssetBed.id },
                    });

                    if (res?.ok) {
                      Success({
                        msg: `${selectedAssetBed.bed_object.name} was unlinked from ${selectedAssetBed.asset_object.name}.`,
                      });
                      setShowUnlinkConfirmation(false);
                      assetBedsQuery.refetch();
                    }
                  }}
                />
                <DialogModal
                  show={!!createPreset}
                  title={t("create_position_preset", { type: "position" })}
                  description={t("create_position_preset_description")}
                  onClose={() => {
                    setCreatePreset(undefined);
                    setPresetName("");
                  }}
                >
                  <TextFormField
                    name="preset-name"
                    className="w-full py-4"
                    value={presetName}
                    onChange={({ value }) => setPresetName(value)}
                    errorClassName="hidden"
                    placeholder={t("preset_name_placeholder")}
                    suggestions={presetNameSuggestions}
                    clearable={true}
                  />

                  <div className="cui-form-button-group">
                    <Cancel
                      onClick={() => {
                        setCreatePreset(undefined);
                        setPresetName("");
                      }}
                    />
                    <Submit
                      onClick={async () => {
                        const { res } = await request(FeedRoutes.createPreset, {
                          pathParams: { assetbed_id: selectedAssetBed.id },
                          body: {
                            name: presetName,
                            position: createPreset!,
                          },
                        });
                        if (!res?.ok) {
                          return;
                        }
                        setCreatePreset(undefined);
                        setPresetName("");
                        Success({ msg: "Preset created" });
                        cameraPresetsQuery.refetch();
                      }}
                      disabled={!presetName}
                    />
                  </div>
                </DialogModal>
                <div className="bg-white p-4">
                  <ul className="grid gap-4 py-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    <li
                      className="flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded border border-secondary-400 p-3 py-8 font-semibold text-secondary-700 transition-all duration-200 ease-in-out hover:bg-secondary-100"
                      onClick={async () => {
                        const { data } = await operate({ type: "get_status" });
                        if (!data) {
                          Error({ msg: t("unable_to_get_current_position") });
                          return;
                        }
                        setCreatePreset(
                          (data as GetStatusResponse).result.position,
                        );
                      }}
                    >
                      <CareIcon icon="l-plus-circle" className="text-lg" />
                      {t("add_preset")}
                    </li>
                    {cameraPresetsQuery.data?.results.map((preset) => (
                      <li
                        key={preset.id}
                        className="h-full w-full rounded border border-secondary-400 p-3 text-secondary-700 transition-all duration-200 ease-in-out"
                      >
                        <DialogModal
                          show={editPreset?.preset === preset.id}
                          title={t("manage_preset", { name: preset.name })}
                          onClose={() => {
                            setEditPreset(undefined);
                            setPresetName("");
                          }}
                        >
                          <div className="py-2" />
                          <TextFormField
                            name="name"
                            label={t("name")}
                            className="w-full"
                            value={presetName || preset.name}
                            onChange={({ value }) => setPresetName(value)}
                            placeholder={t("preset_name_placeholder")}
                            suggestions={presetNameSuggestions}
                          />
                          <FieldLabel>{t("position")}</FieldLabel>
                          <CheckBoxFormField
                            name="update-position-to-current"
                            label={t("update_preset_position_to_current")}
                            value={!!editPreset?.position}
                            labelClassName="text-sm"
                            onChange={async ({ value }) => {
                              if (!value) {
                                setEditPreset({
                                  ...editPreset!,
                                  position: undefined,
                                });
                                return;
                              }

                              const { data } = await operate({
                                type: "get_status",
                              });
                              if (!data) {
                                Error({
                                  msg: t("unable_to_get_current_position"),
                                });
                                return;
                              }
                              setEditPreset({
                                ...editPreset!,
                                position: (data as GetStatusResponse).result
                                  .position!,
                              });
                            }}
                          />
                          <div className="cui-form-button-group pt-6">
                            <Cancel
                              shadow={false}
                              onClick={() => {
                                setEditPreset(undefined);
                                setPresetName("");
                              }}
                            />
                            <ButtonV2
                              ghost
                              border
                              onClick={async () => {
                                const { res } = await request(
                                  FeedRoutes.deletePreset,
                                  {
                                    pathParams: {
                                      assetbed_id: selectedAssetBed.id,
                                      id: preset.id,
                                    },
                                  },
                                );
                                if (!res?.ok) {
                                  return;
                                }
                                Success({ msg: t("preset_deleted") });
                                cameraPresetsQuery.refetch();
                                setEditPreset(undefined);
                                setPresetName("");
                              }}
                              variant="danger"
                            >
                              <CareIcon
                                icon="l-trash-alt"
                                className="text-lg"
                              />
                              {t("delete")}
                            </ButtonV2>
                            <Submit
                              shadow={false}
                              border
                              label={t("save")}
                              onClick={async () => {
                                const { res } = await request(
                                  FeedRoutes.updatePreset,
                                  {
                                    pathParams: {
                                      assetbed_id: selectedAssetBed.id,
                                      id: preset.id,
                                    },
                                    body: {
                                      name: presetName || undefined,
                                      position: editPreset?.position,
                                    },
                                  },
                                );
                                if (!res?.ok) {
                                  return;
                                }
                                Success({ msg: t("preset_updated") });
                                setEditPreset(undefined);
                                setPresetName("");
                                cameraPresetsQuery.refetch();
                              }}
                            />
                          </div>
                        </DialogModal>
                        <div className="flex flex-col">
                          <span className="font-semibold">{preset.name}</span>
                          <span className="text-xs">
                            <RecordMeta
                              prefix="last updated"
                              time={preset.modified_date}
                              user={preset.updated_by || preset.created_by}
                              inlineUser
                            />
                          </span>
                          <div className="mt-3 flex justify-end gap-1">
                            <ButtonV2
                              size="small"
                              variant="secondary"
                              ghost
                              border
                              onClick={() =>
                                operate({
                                  type: "absolute_move",
                                  data: preset.position!,
                                })
                              }
                            >
                              <CareIcon icon="l-eye" />
                              {t("view")}
                            </ButtonV2>
                            <ButtonV2
                              size="small"
                              variant="secondary"
                              ghost
                              border
                              onClick={() => {
                                setEditPreset({ preset: preset.id });
                              }}
                            >
                              <CareIcon icon="l-edit-alt" />
                              {t("update")}
                            </ButtonV2>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col gap-2 pt-4 text-sm md:flex-row md:items-center md:gap-4">
                    <RecordMeta
                      time={selectedAssetBed.created_date}
                      prefix={t("camera_was_linked_to_bed")}
                    />
                    <ButtonV2
                      size="small"
                      variant="danger"
                      ghost
                      border
                      onClick={() => setShowUnlinkConfirmation(true)}
                    >
                      {t("unlink_camera_and_bed")}
                    </ButtonV2>
                  </div>
                </div>
              </>
            )}
            {selectedUnlinkedBed && (
              <div className="flex w-full items-center justify-center p-10 py-20 text-secondary-500">
                <span className="text-center font-semibold">
                  <p>{t("bed_not_linked_to_camera")}</p>
                  <p>{t("create_preset_prerequisite")}</p>
                  <ButtonV2
                    onClick={async () => {
                      const { res } = await request(routes.createAssetBed, {
                        body: {
                          asset: props.asset.id,
                          bed: selectedUnlinkedBed.id,
                        },
                      });
                      if (res?.ok) {
                        Success({ msg: t("camera_bed_link_success") });
                        assetBedsQuery.refetch();
                      }
                    }}
                    className="mt-6"
                  >
                    {t("link_camera_and_bed")}
                  </ButtonV2>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
