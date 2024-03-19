import { useState, lazy } from "react";
import { sleep } from "../../Utils/utils";
import { FacilityModel } from "../Facility/models";
import { AssetData } from "./AssetTypes";
import * as Notification from "../../Utils/Notifications.js";
import { Cancel } from "../Common/components/ButtonV2";
import { Link } from "raviger";
import { LocalStorageKeys, AssetImportSchema } from "../../Common/constants";
import useConfig from "../../Common/hooks/useConfig";
import DialogModal from "../Common/Dialog";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
const ExcelFileDragAndDrop = lazy(
  () => import("../Common/ExcelFIleDragAndDrop")
);

interface Props {
  open: boolean;
  onClose: (() => void) | undefined;
  facility: FacilityModel;
  onUpdate?: (() => void) | undefined;
}

const AssetImportModal = ({ open, onClose, facility, onUpdate }: Props) => {
  const [isImporting, setIsImporting] = useState(false);
  const [location, setLocation] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [errors, setErrors] = useState<any>({
    location: "",
  });
  const { sample_format_asset_import } = useConfig();

  const closeModal = () => {
    onClose && onClose();
  };
  const { data, loading } = useQuery(routes.listFacilityAssetLocation, {
    pathParams: { facility_external_id: `${facility.id}` },
  });

  const locations = data?.results || [];

  const handleUpload = async (
    data: (AssetData & { notes?: string; last_serviced_on?: string })[]
  ) => {
    if (!data) {
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

    for (const asset of data || []) {
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
      }
    }
    if (!error) {
      Notification.Success({ msg: "Assets imported successfully" });
      await sleep(1000);
      setIsImporting(false);
      onUpdate?.();
      closeModal();
    } else {
      Notification.Error({ msg: "Error importing some assets" });
      await sleep(1000);
      setIsImporting(false);
    }
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
          {isValid && (
            <div className="mx-auto w-1/2">
              <label htmlFor="asset-location" className="flex gap-1">
                Select location for import{" "}
                <p className="font-semibold text-danger-500">*</p>
              </label>
              <div data-testid="select-import-location">
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
          )}
          <ExcelFileDragAndDrop
            onClose={closeModal}
            handleSubmit={handleUpload}
            loading={isImporting}
            schema={AssetImportSchema}
            sampleLink={sample_format_asset_import}
            setIsValid={setIsValid}
          />
        </>
      )}
    </DialogModal>
  );
};

export default AssetImportModal;
