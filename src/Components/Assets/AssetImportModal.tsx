import { Modal } from "@material-ui/core";
import { ChangeEventHandler, useEffect, useState } from "react";
import useDragAndDrop from "../../Utils/useDragAndDrop";
import { sleep } from "../../Utils/utils";
import { FacilityModel } from "../Facility/models";
import { AssetData } from "./AssetTypes";
import * as Notification from "../../Utils/Notifications.js";
import ButtonV2 from "../Common/components/ButtonV2";
import { listFacilityAssetLocation } from "../../Redux/actions";
import { useDispatch } from "react-redux";
import { Link } from "raviger";
import SelectMenuV2 from "../Form/SelectMenuV2";

interface Props {
  open: boolean;
  onClose: (() => void) | undefined;
  facility: FacilityModel;
}

const AssetImportModal = ({ open, onClose, facility }: Props) => {
  const [isImporting, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>();
  const [preview, setPreview] = useState<AssetData[]>();
  const [location, setLocation] = useState("");
  const [locations, setLocations] = useState<any>([]);
  const dispatchAction: any = useDispatch();

  const closeModal = () => {
    setPreview(undefined);
    setSelectedFile(undefined);
    onClose && onClose();
  };

  useEffect(() => {
    dispatchAction(
      listFacilityAssetLocation({}, { facility_external_id: facility.id })
    ).then(({ data }: any) => {
      if (data.count > 0) {
        setLocations(data.results);
      }
    });
  }, []);

  useEffect(() => {
    const readFile = async () => {
      try {
        if (selectedFile) {
          const parsedData = JSON.parse(await selectedFile.text());
          setPreview(parsedData);
        }
      } catch (e) {
        setPreview(undefined);
        Notification.Error({
          msg: "Invalid JSON file",
        });
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
    let error = false;

    for (const asset of preview || []) {
      const asset_data = JSON.stringify({
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
        warranty_amc_end_of_validity: asset.warranty_amc_end_of_validity,
        last_serviced_on: asset.last_serviced_on,
        notes: asset.notes,
        cancelToken: { promise: {} },
      });

      const response = await fetch("/api/v1/asset/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("care_access_token"),
        },
        body: asset_data,
      });
      const data = await response.json();
      if (response.status !== 201) {
        Notification.Error({
          msg:
            "Error importing asset: " + asset.name + " " + JSON.stringify(data),
        });
        error = true;
      } else {
        if (preview) setPreview(preview.filter((a) => a.id !== asset.id));
      }
    }
    if (!error) {
      Notification.Success({ msg: "Assets imported successfully" });
      await sleep(1000);
      setIsUploading(false);
      closeModal();
      window.location.reload();
    } else Notification.Error({ msg: "Error importing some assets" });
  };

  const dragProps = useDragAndDrop();
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragProps.setDragOver(false);
    const dropedFile = e?.dataTransfer?.files[0];
    if (dropedFile.type.split("/")[1] !== "json")
      return dragProps.setFileDropError("Please drop a JSON file to upload!");
    setSelectedFile(dropedFile);
  };

  return (
    <Modal open={open} onClose={closeModal}>
      <div className="h-screen w-full absolute flex items-center justify-center bg-modal">
        <div className="m-4 bg-white rounded-xl w-11/12 max-w-3xl min-h-[24rem] max-h-screen overflow-auto flex flex-col shadow">
          <div className="px-6 py-6 flex flex-col bg-gray-300">
            <span className="text-xl font-medium">Import Assets</span>
            <span className="mt-1 text-gray-700">{facility.name}</span>
          </div>
          {locations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <h1 className="text-2xl font-medium text-gray-700 m-7">
                You need at least one location to import an assest.
              </h1>
              <Link href={`/facility/${facility.id}/location/add`}>
                <a className="bg-primary text-white px-4 py-2 rounded-md">
                  Add Asset Location
                </a>
              </Link>
            </div>
          ) : (
            <>
              {preview && preview?.length > 0 ? (
                <div className="flex flex-col rounded-lg items-center justify-center">
                  <h1 className="text-2xl font-medium text-gray-700 m-7">
                    {preview.length} assets will be imported
                  </h1>
                  <div className="w-1/2 p-4">
                    <label htmlFor="asset-location">
                      Select location for import *
                    </label>
                    <div className="mt-2">
                      <SelectMenuV2
                        required
                        options={[
                          {
                            title: "Select",
                            description: "Select the location",
                            value: "0",
                          },
                          ...locations.map((location: any) => ({
                            title: location.name,
                            description: location.facility.name,
                            value: location.id,
                          })),
                        ]}
                        optionLabel={(o) => o.title}
                        optionValue={(o) => o.value}
                        value={location}
                        onChange={(e) => setLocation(e)}
                      />
                    </div>
                  </div>
                  <div className="bg-white rounded overflow-y-scroll h-80 border border-gray-500 md:min-w-[500px]">
                    <div className="p-2 border-b flex">
                      <div className="p-2 mr-2 font-bold">#</div>
                      <div className="p-2 mr-2 md:w-1/2 font-bold">Name</div>
                      <div className="p-2 mr-2 md:w-1/2 font-bold">
                        Description
                      </div>
                    </div>
                    {preview.map((data: AssetData, index: number) => {
                      return (
                        <div key={index} className="p-2 border-b flex">
                          <div className="p-2 mr-2">{index + 1}</div>
                          <div className="p-2 mr-2 md:w-1/2">{data.name}</div>
                          <div className="p-2 mr-2 md:w-1/2">
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
                  className={`px-3 py-6 flex-1 flex flex-col m-8 rounded-lg items-center justify-center border-[3px] border-dashed ${
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
                    className={`w-12 h-12 ${
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
                      : "Drag & drop JSON file to upload"}
                  </p>
                  <p className="mt-4 text-gray-700 font-medium text-center">
                    Upload the JSON file exported from Care.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row p-4 gap-2">
                <div>
                  <label className="rounded-lg bg-white py-2 px-4 text-primary-500 font-medium border border-primary-500 hover:text-primary-400 hover:border-primary-400 text-sm flex gap-1 items-center justify-center cursor-pointer transition-all">
                    <i className="fas fa-cloud-upload-alt mr-2"></i>Upload a
                    file
                    <input
                      title="changeFile"
                      type="file"
                      accept="application/json"
                      className="hidden"
                      onChange={onSelectFile}
                      onClick={() => {
                        setPreview(undefined);
                      }}
                    />
                  </label>
                </div>
                <div className="sm:flex-1" />
                <ButtonV2
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeModal();
                    dragProps.setFileDropError("");
                  }}
                  disabled={isImporting}
                >
                  Cancel
                </ButtonV2>
                <ButtonV2 onClick={handleUpload} disabled={isImporting}>
                  {isImporting ? (
                    <i className="fa-solid fa-spinner animate-spin" />
                  ) : (
                    <i className="fa-solid fa-file-import" />
                  )}
                  <span>{isImporting ? "Importing..." : "Import"}</span>
                </ButtonV2>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AssetImportModal;
