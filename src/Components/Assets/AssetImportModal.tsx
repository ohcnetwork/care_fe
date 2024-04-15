import { ChangeEventHandler, useEffect, useState } from "react";
import useDragAndDrop from "../../Utils/useDragAndDrop";
import { sleep } from "../../Utils/utils";
import { FacilityModel } from "../Facility/models";
import { AssetData } from "./AssetTypes";
import * as Notification from "../../Utils/Notifications.js";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import { Link } from "raviger";
import readXlsxFile from "read-excel-file";
import {
  LocalStorageKeys,
  XLSXAssetImportSchema,
} from "../../Common/constants";
import { parseCsvFile } from "../../Utils/utils";
import useConfig from "../../Common/hooks/useConfig";
import DialogModal from "../Common/Dialog";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import CareIcon from "../../CAREUI/icons/CareIcon";

interface Props {
  open: boolean;
  onClose: (() => void) | undefined;
  facility: FacilityModel;
  onUpdate?: (() => void) | undefined;
}

const AssetImportModal = ({ open, onClose, facility, onUpdate }: Props) => {
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>();
  const [preview, setPreview] =
    useState<(AssetData & { notes?: string; last_serviced_on?: string })[]>();
  const [location, setLocation] = useState("");
  const [errors, setErrors] = useState<any>({
    location: "",
  });
  const { sample_format_asset_import } = useConfig();

  const closeModal = () => {
    setPreview(undefined);
    setSelectedFile(undefined);
    onClose && onClose();
  };
  const { data, loading } = useQuery(routes.listFacilityAssetLocation, {
    pathParams: { facility_external_id: `${facility.id}` },
  });

  const locations = data?.results || [];

  useEffect(() => {
    const readFile = async () => {
      try {
        if (selectedFile) {
          switch (selectedFile.name.split(".").pop()) {
            case "xlsx": {
              const parsedData = await readXlsxFile(selectedFile, {
                schema: XLSXAssetImportSchema,
              });
              if (parsedData.errors.length) {
                parsedData.errors.map((error) => {
                  Notification.Error({
                    msg: `Please check the row ${error.row} of column ${error.column}`,
                  });
                });
                setSelectedFile(undefined);
              } else {
                setPreview(parsedData.rows as AssetData[]);
              }
              break;
            }
            case "csv": {
              const parsedData = await parseCsvFile(
                selectedFile,
                XLSXAssetImportSchema,
              );
              setPreview(parsedData);
              break;
            }
            default: {
              const parsedData = JSON.parse(await selectedFile.text());
              setPreview(parsedData);
            }
          }
        }
      } catch (e: any) {
        setPreview(undefined);
        console.log(e);
        Notification.Error({
          msg: "Invalid file: " + e.message,
        });
        setSelectedFile(undefined);
      }
    };
    readFile();
  }, [selectedFile]);

  const onSelectFile: ChangeEventHandler<HTMLInputElement> = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(undefined);
      return;
    }
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      closeModal();
      return;
    }
    if (!location) {
      setErrors({
        ...errors,
        location: "Please select a location",
      });
      return;
    }
    setIsImporting(true);
    let error = false;
    Notification.Success({ msg: "Importing assets..." });

    for (const asset of preview || []) {
      const asset_data: any = {
        name: asset.name,
        asset_type: asset.asset_type,
        asset_class: asset.asset_class,
        description: asset.description,
        is_working: asset.is_working,
        not_working_reason: asset.not_working_reason,
        serial_number: asset.serial_number,
        location: location,
        vendor_name: asset.vendor_name,
        support_name: asset.support_name,
        support_email: asset.support_email,
        support_phone: asset.support_phone,
        qr_code_id: asset.qr_code_id,
        manufacturer: asset.manufacturer,
        meta: { ...asset.meta },
        note: asset.notes,
      };

      if (asset.last_serviced_on)
        asset_data["last_serviced_on"] = asset.last_serviced_on;

      if (asset.warranty_amc_end_of_validity)
        asset_data["warranty_amc_end_of_validity"] =
          asset.warranty_amc_end_of_validity;

      const response = await fetch("/api/v1/asset/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer " + localStorage.getItem(LocalStorageKeys.accessToken),
        },
        body: JSON.stringify(asset_data),
      });
      const data = await response.json();
      if (response.status !== 201) {
        Notification.Error({
          msg:
            "Error importing asset: " + asset.name + " " + JSON.stringify(data),
        });
        error = true;
      } else {
        setPreview((preview) => {
          return preview?.slice(1);
        });
      }
    }
    if (!error) {
      Notification.Success({ msg: "Assets imported successfully" });
      await sleep(1000);
      setIsImporting(false);
      onUpdate?.();
    } else {
      Notification.Error({ msg: "Error importing some assets" });
      await sleep(1000);
      setIsImporting(false);
      closeModal();
    }
  };

  const dragProps = useDragAndDrop();
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragProps.setDragOver(false);
    const dropedFile = e?.dataTransfer?.files[0];
    if (
      !["xlsx", "csv", "json"].includes(
        dropedFile?.name?.split(".")?.pop() || "",
      )
    )
      return dragProps.setFileDropError(
        "Please drop a JSON / Excel file to upload!",
      );
    setSelectedFile(dropedFile);
  };

  return (
    <DialogModal
      title="Import Assets"
      show={open}
      onClose={closeModal}
      className="w-[48rem]"
      fixedWidth={false}
    >
      <span className="mt-1 text-gray-700">{facility.name}</span>
      {!loading && locations.length === 0 ? (
        <>
          <div className="flex h-full flex-col items-center justify-center">
            <h1 className="m-7 text-2xl font-medium text-gray-700">
              You need at least one location to import an assest.
            </h1>
            <Link href={`/facility/${facility.id}/location/add`}>
              <a className="rounded-md bg-primary px-4 py-2 text-white">
                Add Asset Location
              </a>
            </Link>
          </div>
          <div className="mt-6 flex flex-col items-center justify-center">
            <Cancel
              onClick={closeModal}
              disabled={isImporting}
              className="w-1/4 px-4 py-2"
            />
          </div>
        </>
      ) : (
        <>
          {preview && preview?.length > 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg">
              <h1 className="m-7 text-2xl font-medium text-gray-700">
                {preview.length} assets {isImporting ? "are being" : "will be"}{" "}
                imported
              </h1>
              <div className="w-1/2 p-4">
                <label htmlFor="asset-location" className="flex gap-1">
                  Select location for import{" "}
                  <p className="font-semibold text-danger-500">*</p>
                </label>
                <div className="mt-2" data-testid="select-import-location">
                  <SelectFormField
                    name="asset-import-location"
                    options={locations.map((location: any) => ({
                      title: location.name,
                      description: location.facility.name,
                      value: location.id,
                    }))}
                    optionLabel={(o) => o.title}
                    optionValue={(o) => o.value}
                    placeholder="Select a location"
                    value={location}
                    onChange={({ value }) => setLocation(value)}
                    error={errors.location}
                  />
                </div>
              </div>
              <div className="my-4 h-80 overflow-y-scroll rounded border border-gray-500 bg-white md:min-w-[500px]">
                <div className="flex border-b p-2">
                  <div className="mr-2 p-2 font-bold">#</div>
                  <div className="mr-2 p-2 font-bold md:w-1/2">Name</div>
                  <div className="mr-2 p-2 font-bold md:w-1/2">Description</div>
                </div>
                {preview.map((data: AssetData, index: number) => {
                  return (
                    <div key={index} className="flex border-b p-2">
                      <div className="mr-2 p-2">{index + 1}</div>
                      <div className="mr-2 p-2 md:w-1/2">{data.name}</div>
                      <div className="mr-2 p-2 md:w-1/2">
                        {data.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div
              onDragOver={dragProps.onDragOver}
              onDragLeave={dragProps.onDragLeave}
              onDrop={onDrop}
              className={`mb-8 mt-5 flex flex-1 flex-col items-center justify-center rounded-lg border-[3px] border-dashed px-3 py-6 ${
                dragProps.dragOver && "border-primary-500"
              } ${
                dragProps.fileDropError !== ""
                  ? "border-red-500"
                  : "border-gray-500"
              }`}
            >
              <svg
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
                className={`h-12 w-12 ${
                  dragProps.dragOver && "text-primary-500"
                } ${
                  dragProps.fileDropError !== ""
                    ? "text-red-500"
                    : "text-gray-600"
                }`}
              >
                <path d="M12.71,11.29a1,1,0,0,0-.33-.21,1,1,0,0,0-.76,0,1,1,0,0,0-.33.21l-2,2a1,1,0,0,0,1.42,1.42l.29-.3V17a1,1,0,0,0,2,0V14.41l.29.3a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42ZM20,8.94a1.31,1.31,0,0,0-.06-.27l0-.09a1.07,1.07,0,0,0-.19-.28h0l-6-6h0a1.07,1.07,0,0,0-.28-.19l-.1,0A1.1,1.1,0,0,0,13.06,2H7A3,3,0,0,0,4,5V19a3,3,0,0,0,3,3H17a3,3,0,0,0,3-3V9S20,9,20,8.94ZM14,5.41,16.59,8H15a1,1,0,0,1-1-1ZM18,19a1,1,0,0,1-1,1H7a1,1,0,0,1-1-1V5A1,1,0,0,1,7,4h5V7a3,3,0,0,0,3,3h3Z" />
              </svg>
              <p
                className={`text-sm ${
                  dragProps.dragOver && "text-primary-500"
                } ${
                  dragProps.fileDropError !== ""
                    ? "text-red-500"
                    : "text-gray-700"
                } text-center`}
              >
                {dragProps.fileDropError !== ""
                  ? dragProps.fileDropError
                  : "Drag & drop JSON / Excel (xlsx, csv)  file to upload"}
              </p>
              <a
                className="focus:ring-blue mx-auto mt-4 max-w-xs items-center rounded-md border border-primary-500 bg-white px-3 py-2 text-sm font-medium leading-4 text-primary-700 transition duration-150 ease-in-out hover:text-primary-500 hover:shadow focus:border-primary-300 focus:outline-none active:bg-gray-50 active:text-primary-800"
                href={sample_format_asset_import}
              >
                <CareIcon
                  icon="l-download-alt"
                  className="mr-1 text-lg"
                  aria-hidden="true"
                />{" "}
                <span>Sample Format</span>
              </a>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <div>
              <label className="flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-primary-500 bg-white px-4 py-2 text-sm font-medium text-primary-500 transition-all hover:border-primary-400 hover:text-primary-400">
                <CareIcon icon="l-cloud-upload" className="mr-2 text-lg" />
                Upload a file
                <input
                  data-testid="import-asset-file"
                  title="changeFile"
                  type="file"
                  accept=".json, .xlsx, .csv"
                  className="hidden"
                  onChange={onSelectFile}
                  onClick={() => {
                    setPreview(undefined);
                  }}
                />
              </label>
            </div>
            <div className="sm:flex-1" />
            <Cancel
              onClick={() => {
                closeModal();
                dragProps.setFileDropError("");
              }}
              disabled={isImporting}
            />
            <Submit
              onClick={handleUpload}
              disabled={isImporting || !selectedFile}
              data-testid="asset-import-btn"
            >
              {isImporting ? (
                <CareIcon icon="l-spinner" className="animate-spin text-lg" />
              ) : (
                <CareIcon icon="l-file-import" className="text-lg" />
              )}
              <span>{isImporting ? "Importing..." : "Import"}</span>
            </Submit>
          </div>
        </>
      )}
    </DialogModal>
  );
};

export default AssetImportModal;
