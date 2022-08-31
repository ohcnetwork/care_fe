import React, { useReducer, useState, useEffect } from "react";
import {
  createAsset,
  getAsset,
  listFacilityAssetLocation,
  updateAsset,
} from "../../Redux/actions";
import { useDispatch } from "react-redux";
import * as Notification from "../../Utils/Notifications.js";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import CancelOutlineIcon from "@material-ui/icons/CancelOutlined";
import CropFreeIcon from "@material-ui/icons/CropFree";
import PageTitle from "../Common/PageTitle";
import { Button, Card, CardContent, InputLabel } from "@material-ui/core";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { validateEmailAddress } from "../../Common/validation";
import {
  ActionTextInputField,
  SelectField,
  TextInputField,
  MultilineInputField,
  PhoneNumberField,
  ErrorHelperText,
  DateInputField,
} from "../Common/HelperInputFields";
import { AssetClass, AssetData, AssetType } from "../Assets/AssetTypes";
import loadable from "@loadable/component";
import { LocationOnOutlined } from "@material-ui/icons";
import { navigate } from "raviger";
import QrReader from "react-qr-reader";
import { parseQueryParams } from "../../Utils/primitives";
import SelectMenu from "../Common/components/SelectMenu";
import moment from "moment";
import clsx from "clsx";
import RadioInputs from "../Common/components/RadioGroup";
const Loading = loadable(() => import("../Common/Loading"));

const initError = {
  name: "",
  asset_type: "",
  asset_class: "",
  description: "",
  is_working: "",
  serial_number: "",
  location: "",
  vendor_name: "",
  support_name: "",
  support_phone: "",
  support_email: "",
  manufacturer: "",
  warranty_amc_end_of_validity: "",
  last_serviced_on: "",
  notes: "",
};

const initialState = {
  errors: { ...initError },
};

interface AssetProps {
  facilityId: string;
  assetId?: string;
}

const asset_create_reducer = (state = initialState, action: any) => {
  switch (action.type) {
    case "set_error": {
      return {
        ...state,
        errors: action.errors,
      };
    }
    default:
      return state;
  }
};

const goBack = () => {
  window.history.go(-1);
};

const AssetCreate = (props: AssetProps) => {
  const { facilityId, assetId } = props;

  const [state, dispatch] = useReducer(asset_create_reducer, initialState);
  const [name, setName] = useState("");
  const [asset_type, setAssetType] = useState<AssetType>();
  const [asset_class, setAssetClass] = useState<AssetClass>();
  const [not_working_reason, setNotWorkingReason] = useState("");
  const [description, setDescription] = useState("");
  const [is_working, setIsWorking] = useState<string | undefined>(undefined);
  const [serial_number, setSerialNumber] = useState("");
  const [vendor_name, setVendorName] = useState("");
  const [support_name, setSupportName] = useState("");
  const [support_phone, setSupportPhone] = useState("");
  const [support_email, setSupportEmail] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [asset, setAsset] = useState<AssetData>();
  const [facilityName, setFacilityName] = useState("");
  const [qrCodeId, setQrCodeId] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [warranty_amc_end_of_validity, setWarrantyAmcEndOfValidity] =
    useState<any>(null);
  const [last_serviced_on, setLastServicedOn] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const dispatchAction: any = useDispatch();
  const [isScannerActive, setIsScannerActive] = useState<boolean>(false);

  useEffect(() => {
    setIsLoading(true);
    dispatchAction(
      listFacilityAssetLocation({}, { facility_external_id: facilityId })
    ).then(({ data }: any) => {
      if (data.count > 0) {
        setFacilityName(data.results[0].facility?.name);
        setLocations(data.results);
      }
      setIsLoading(false);
    });

    if (assetId) {
      setIsLoading(true);
      dispatchAction(getAsset(assetId)).then(({ data }: any) => {
        setAsset(data);
        setIsLoading(false);
      });
    }
  }, [assetId]);

  useEffect(() => {
    if (asset) {
      setName(asset.name);
      setDescription(asset.description);
      setLocation(asset.location_object.id);
      setAssetType(asset.asset_type);
      setAssetClass(asset.asset_class);
      setIsWorking(String(asset.is_working));
      setNotWorkingReason(asset.not_working_reason);
      setSerialNumber(asset.serial_number);
      setVendorName(asset.vendor_name);
      setSupportName(asset.support_name);
      setSupportEmail(asset.support_email);
      setSupportPhone(asset.support_phone);
      setQrCodeId(asset.qr_code_id);
      setManufacturer(asset.manufacturer);
      asset.warranty_amc_end_of_validity &&
        setWarrantyAmcEndOfValidity(
          moment(asset.warranty_amc_end_of_validity).format("YYYY-MM-DD")
        );
      asset.last_serviced_on &&
        setLastServicedOn(moment(asset.last_serviced_on).format("YYYY-MM-DD"));
      setNotes(asset.notes);
    }
  }, [asset]);

  const validateForm = () => {
    const errors = { ...initError };
    let invalidForm = false;
    Object.keys(state.errors).forEach((field) => {
      switch (field) {
        case "name":
          if (!name) {
            errors[field] = "Asset name can't be empty";
            invalidForm = true;
          }
          return;
        case "is_working":
          if (is_working === undefined) {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          return;
        case "location":
          if (!location || location === "0" || location === "") {
            errors[field] = "Select a location";
            invalidForm = true;
          }
          return;
        case "asset_type":
          if (!asset_type) {
            errors[field] = "Select an asset type";
            invalidForm = true;
          }
          return;
        case "support_phone":
          if (!support_phone) {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          // eslint-disable-next-line no-case-declarations
          const phoneNumber = parsePhoneNumberFromString(support_phone);
          if (!phoneNumber?.isPossible()) {
            errors[field] = "Please enter valid phone number";
            invalidForm = true;
          }
          return;
        case "support_email":
          if (support_email && !validateEmailAddress(support_email)) {
            errors[field] = "Please enter valid email id";
            invalidForm = true;
          }
          return;
        default:
          return;
      }
    });
    if (invalidForm) {
      dispatch({ type: "set_error", errors });
      return false;
    }
    dispatch({ type: "set_error", errors });
    return true;
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const validated = validateForm();
    if (validated) {
      setIsLoading(true);
      const data = {
        name: name,
        asset_type: asset_type,
        asset_class: asset_class || "",
        description: description,
        is_working: is_working,
        not_working_reason: is_working === "true" ? "" : not_working_reason,
        serial_number: serial_number,
        location: location,
        vendor_name: vendor_name,
        support_name: support_name,
        support_email: support_email,
        support_phone:
          parsePhoneNumberFromString(support_phone)?.format("E.164"),
        qr_code_id: qrCodeId !== "" ? qrCodeId : null,
        manufacturer: manufacturer,
        warranty_amc_end_of_validity: warranty_amc_end_of_validity,
        last_serviced_on: last_serviced_on,
        notes: notes,
      };
      if (!assetId) {
        const res = await dispatchAction(createAsset(data));
        if (res && res.data && res.status === 201) {
          Notification.Success({
            msg: "Asset created successfully",
          });
          goBack();
        }
        setIsLoading(false);
      } else {
        const res = await dispatchAction(updateAsset(assetId, data));
        if (res && res.data && res.status === 200) {
          Notification.Success({
            msg: "Asset updated successfully",
          });
          goBack();
        }
        setIsLoading(false);
      }
    }
  };

  const parseAssetId = (assetUrl: string) => {
    try {
      const params = parseQueryParams(assetUrl);
      // QR Maybe searchParams "asset" or "assetQR"
      const assetId = params.asset || params.assetQR;
      if (assetId) {
        setQrCodeId(assetId);
        setIsScannerActive(false);
        return;
      }
    } catch (err) {
      console.log(err);
      Notification.Error({ msg: err });
    }
    Notification.Error({ msg: "Invalid Asset Id" });
    setIsScannerActive(false);
  };

  if (isLoading) return <Loading />;

  if (locations.length === 0) {
    return (
      <div className="px-6 pb-2">
        <PageTitle
          title={assetId ? "Update Asset" : "Create New Asset"}
          crumbsReplacements={{
            [facilityId]: { name: facilityName },
            assets: { style: "text-gray-200 pointer-events-none" },
            [assetId || "????"]: { name },
          }}
        />
        <section className="text-center">
          <h1 className="text-6xl flex items-center flex-col py-10">
            <div className="p-5 rounded-full flex items-center justify-center bg-gray-200 w-40 h-40">
              <LocationOnOutlined fontSize="inherit" color="primary" />
            </div>
          </h1>
          <p className="text-gray-600">
            You need at least a location to create an assest.
          </p>
          <button
            className="btn-primary btn mt-5"
            onClick={() => navigate(`/facility/${facilityId}/location/add`)}
          >
            <i className="fas fa-plus text-white mr-2"></i>
            Add Location
          </button>
        </section>
      </div>
    );
  }

  if (isScannerActive)
    return (
      <div className="md:w-1/2 w-full my-2 mx-auto flex flex-col justify-start items-end">
        <button
          onClick={() => setIsScannerActive(false)}
          className="btn btn-default mb-2"
        >
          <i className="fas fa-times mr-2"></i> Close Scanner
        </button>
        <QrReader
          delay={300}
          onScan={(assetId: any) => (assetId ? parseAssetId(assetId) : null)}
          onError={(e: any) =>
            Notification.Error({
              msg: e.message,
            })
          }
          style={{ width: "100%" }}
        />
        <h2 className="text-center text-lg self-center">Scan Asset QR!</h2>
      </div>
    );

  return (
    <div className="px-6 pb-2">
      <PageTitle
        title={assetId ? "Update Asset" : "Create New Asset"}
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          assets: { style: "text-gray-200 pointer-events-none" },
          [assetId || "????"]: { name },
        }}
      />
      <div className="mt-5 md:mt-8 max-w-4xl 2xl:max-w-max mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="shadow overflow-hidden sm:rounded-md">
            <div className="px-5 sm:px-6 bg-white">
              <div className="grid grid-cols-1 2xl:grid-cols-2 gap-x-12 items-start">
                <div className="grid grid-cols-6 gap-x-6">
                  {/* Asset Details Section */}
                  <div className="col-span-6 flex flex-row gap-6 items-center my-6 -ml-2">
                    <label>Asset Details</label>
                    <hr className="flex-1" />
                  </div>

                  {/* Asset Name */}
                  <div className="col-span-6 sm:col-span-4">
                    <label htmlFor="asset-name">Asset Name * </label>
                    <input
                      id="asset-name"
                      className={clsx(
                        "mt-2 block w-full input",
                        state.errors.name && "border-red-500"
                      )}
                      type="text"
                      name="asset-name"
                      autoComplete="asset-name"
                      value={name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setName(e.target.value)
                      }
                    />
                    <ErrorHelperText error={state.errors.name} />
                  </div>

                  {/* Asset Type */}
                  <div className="col-span-6 sm:col-span-2">
                    <label htmlFor="asset-type">Asset Type * </label>
                    <div className="mt-2">
                      <SelectMenu
                        options={[
                          {
                            title: "Select",
                            description:
                              "Select an Asset Type from the following",
                            value: undefined,
                          },
                          {
                            title: "Internal",
                            description:
                              "Asset is inside the facility premises.",
                            value: "INTERNAL",
                          },
                          {
                            title: "External",
                            description:
                              "Asset is outside the facility premises.",
                            value: "EXTERNAL",
                          },
                        ]}
                        selected={asset_type}
                        onSelect={setAssetType}
                      />
                    </div>
                    <ErrorHelperText error={state.errors.asset_type} />
                  </div>

                  <div className="col-span-6 flex flex-col sm:flex-row gap-x-6">
                    {/* Location */}
                    <div className="">
                      <label htmlFor="asset-location">Location * </label>
                      <div className="mt-2">
                        <SelectMenu
                          options={[
                            {
                              title: "Select",
                              description:
                                "Select an Asset Location from the following",
                              value: "",
                            },
                            ...locations.map((location: any) => ({
                              title: location.name,
                              description: location.facility.name,
                              value: location.id,
                            })),
                          ]}
                          selected={location}
                          onSelect={setLocation}
                        />
                      </div>
                      <ErrorHelperText error={state.errors.location} />
                    </div>

                    {/* Asset Class */}
                    <div>
                      <label htmlFor="asset-class">Asset Class</label>
                      <div className="mt-2">
                        <SelectMenu
                          options={[
                            { title: "Not Applicable", value: undefined },
                            { title: "ONVIF Camera", value: "ONVIF" },
                            {
                              title: "HL7 Vitals Monitor",
                              value: "HL7MONITOR",
                            },
                          ]}
                          selected={asset_class}
                          onSelect={setAssetClass}
                        />
                      </div>
                      <ErrorHelperText error={state.errors.asset_class} />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="col-span-6">
                    <label htmlFor="asset-description">
                      Describe the asset
                    </label>
                    <textarea
                      id="asset-description"
                      className={clsx(
                        "mt-2 block w-full input",
                        state.errors.description && "border-red-500"
                      )}
                      name="asset-description"
                      placeholder="Eg. Details about the equipment"
                      value={description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setDescription(e.target.value)
                      }
                    />
                    <ErrorHelperText error={state.errors.description} />
                  </div>

                  {/* Divider */}
                  <div className="col-span-6">
                    <hr
                      className={clsx(
                        "transition-all",
                        (is_working === "true" && "opacity-0 my-0") ||
                          "opacity-100 my-4"
                      )}
                    />
                  </div>

                  {/* Working Status */}
                  <RadioInputs
                    className="col-span-6"
                    required
                    label="Working Status"
                    name="is_working"
                    options={[
                      { label: "Working", value: "true" },
                      { label: "Not Working", value: "false" },
                    ]}
                    selected={is_working}
                    onSelect={setIsWorking}
                    error={state.errors.is_working}
                  />

                  {/* Not Working Reason */}
                  <div
                    className={clsx(
                      "col-span-6",
                      is_working !== "false" && "hidden"
                    )}
                  >
                    <label htmlFor="not_working_reason">
                      Why the asset is not working?
                    </label>
                    <textarea
                      id="not_working_reason"
                      className={clsx(
                        "mt-2 block w-full input",
                        state.errors.not_working_reason && "border-red-500"
                      )}
                      name="not_working_reason"
                      placeholder="Describe why the asset is not working"
                      value={not_working_reason}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setNotWorkingReason(e.target.value)
                      }
                    />
                    <ErrorHelperText error={state.errors.not_working_reason} />
                  </div>

                  {/* Divider */}
                  <div className="col-span-6">
                    <hr
                      className={clsx(
                        "transition-all",
                        (is_working === "true" && "opacity-0 my-0") ||
                          "opacity-100 mb-7"
                      )}
                    />
                  </div>

                  {/* Asset QR ID */}
                  <div className="col-span-6">
                    <label htmlFor="asset-qr-id">Asset QR ID</label>
                    <ActionTextInputField
                      id="qr_code_id"
                      fullWidth
                      name="qr_code_id"
                      placeholder=""
                      variant="outlined"
                      margin="dense"
                      value={qrCodeId}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setQrCodeId(e.target.value)
                      }
                      actionIcon={<CropFreeIcon className="cursor-pointer" />}
                      action={() => setIsScannerActive(true)}
                      errors={state.errors.qr_code_id}
                    />
                    <ErrorHelperText error={state.errors.qr_id} />
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-x-6">
                  {/* Warranty Details Section */}
                  <div className="col-span-6 flex flex-row gap-6 items-center my-6 -ml-2">
                    <label>Warranty Details</label>
                    <hr className="flex-1" />
                  </div>

                  {/* Manufacturer */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="manufacturer">Manufacturer</label>
                    <input
                      id="manufacturer"
                      className={clsx(
                        "mt-2 block w-full input",
                        state.errors.manufacturer && "border-red-500"
                      )}
                      type="text"
                      name="manufacturer"
                      placeholder="Eg. XYZ"
                      value={manufacturer}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setManufacturer(e.target.value)
                      }
                    />
                    <ErrorHelperText error={state.errors.manufacturer} />
                  </div>

                  {/* Warranty / AMC Expiry */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="warranty-expiry">
                      Warranty / AMC Expiry
                    </label>
                    <DateInputField
                      className="w-56"
                      value={warranty_amc_end_of_validity}
                      onChange={(date) =>
                        setWarrantyAmcEndOfValidity(
                          moment(date).format("YYYY-MM-DD")
                        )
                      }
                      errors={state.errors.warranty_amc_end_of_validity}
                      InputLabelProps={{ shrink: true }}
                    />
                    <ErrorHelperText
                      error={state.errors.warranty_amc_end_of_validity}
                    />
                  </div>

                  {/* Customer Support Name */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="support-name">Customer Support Name</label>
                    <input
                      id="support-name"
                      className={clsx(
                        "mt-2 block w-full input",
                        state.errors.customer_support_name && "border-red-500"
                      )}
                      type="text"
                      name="support-name"
                      placeholder="Eg. ABC"
                      value={support_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSupportName(e.target.value)
                      }
                    />
                    <ErrorHelperText error={state.errors.support_name} />
                  </div>

                  {/* Customer Support Number */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="support-name">
                      Customer Support Number *{" "}
                    </label>
                    <PhoneNumberField
                      value={support_phone}
                      onChange={setSupportPhone}
                      errors={state.errors.support_phone}
                    />
                  </div>

                  {/* Customer Support Email */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="support-email">
                      Customer Support Email
                    </label>
                    <input
                      id="support-email"
                      className={clsx(
                        "mt-2 block w-full input",
                        state.errors.support_email && "border-red-500"
                      )}
                      type="text"
                      name="support-email"
                      placeholder="Eg. mail@example.xyz"
                      value={support_email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSupportEmail(e.target.value)
                      }
                    />
                    <ErrorHelperText error={state.errors.support_email} />
                  </div>

                  <div className="sm:col-span-3" />

                  {/* Vendor Name */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="vendor-name">Vendor Name</label>
                    <input
                      id="vendor-name"
                      className={clsx(
                        "mt-2 block w-full input",
                        state.errors.vendor_name && "border-red-500"
                      )}
                      type="text"
                      name="vendor-name"
                      placeholder="Eg. XYZ"
                      value={vendor_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setVendorName(e.target.value)
                      }
                    />
                    <ErrorHelperText error={state.errors.vendor_name} />
                  </div>

                  {/* Serial Number */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="serial-number">Serial Number</label>
                    <input
                      id="serial-number"
                      className={clsx(
                        "mt-2 block w-full input",
                        state.errors.serial_number && "border-red-500"
                      )}
                      type="text"
                      name="serial-number"
                      placeholder="Eg. 123456789"
                      value={serial_number}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSerialNumber(e.target.value)
                      }
                    />
                    <ErrorHelperText error={state.errors.serial_number} />
                  </div>

                  {/* Service Details Section */}
                  <div className="col-span-6 flex flex-row gap-6 items-center my-6 -ml-2">
                    <label>Service Details</label>
                    <hr className="flex-1" />
                  </div>

                  {/* Last serviced on */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="last-serviced-on">Last Serviced On</label>
                    <DateInputField
                      className="w-56"
                      value={last_serviced_on}
                      onChange={(date) =>
                        setLastServicedOn(moment(date).format("YYYY-MM-DD"))
                      }
                      disableFuture={true}
                      errors={state.errors.last_serviced_on}
                      InputLabelProps={{ shrink: true }}
                    />
                    <ErrorHelperText error={state.errors.last_serviced_on} />
                  </div>

                  {/* Notes */}
                  <div className="col-span-6 mt-6">
                    <label htmlFor="notes">Notes</label>
                    <textarea
                      id="notes"
                      className={clsx(
                        "mt-2 block w-full input",
                        state.errors.notes && "border-red-500"
                      )}
                      name="notes"
                      placeholder="Eg. Details on functionality, service, etc."
                      value={notes}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setNotes(e.target.value)
                      }
                    />
                    <ErrorHelperText error={state.errors.notes} />
                  </div>
                </div>

                <div />

                <div className="flex justify-end gap-x-4 gap-y-2 flex-wrap mb-8">
                  <button
                    className="btn-primary"
                    id="asset-create"
                    type="submit"
                    onClick={handleSubmit}
                  >
                    <div className="flex items-center justify-start gap-2">
                      <CheckCircleOutlineIcon className="text-base">
                        save
                      </CheckCircleOutlineIcon>
                      {assetId ? "Update" : "Create"}
                    </div>
                  </button>
                  <button
                    id="asset-cancel"
                    className="secondary-button"
                    onClick={() =>
                      navigate(
                        assetId
                          ? `/assets/${assetId}`
                          : `/facility/${facilityId}`
                      )
                    }
                  >
                    <div className="flex items-center justify-start gap-2">
                      <CancelOutlineIcon className="text-base">
                        cancel
                      </CancelOutlineIcon>
                      Cancel
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
      {/* <Card className="mt-4 mx-auto">
        <CardContent>
          <form onSubmit={(e) => handleSubmit(e)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <InputLabel htmlFor="asset-name" id="name=label" required>
                  Asset Name
                </InputLabel>
                <TextInputField
                  id="asset-name"
                  fullWidth
                  name="name"
                  placeholder=""
                  variant="outlined"
                  margin="dense"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setName(e.target.value)
                  }
                  errors={state.errors.name}
                />
              </div>
              <div className="flex flex-wrap justify-between">
                <div>
                  <InputLabel htmlFor="asset-type" id="name=label" required>
                    Asset Type
                  </InputLabel>
                  <div className="my-2">
                    <SelectMenu
                      options={[
                        {
                          title: "Select",
                          description:
                            "Select an Asset Type from the following",
                          value: undefined,
                        },
                        {
                          title: "Internal",
                          description: "Asset is inside the facility premises.",
                          value: "INTERNAL",
                        },
                        {
                          title: "External",
                          description:
                            "Asset is outside the facility premises.",
                          value: "EXTERNAL",
                        },
                      ]}
                      selected={asset_type}
                      onSelect={setAssetType}
                    />
                  </div>
                  <ErrorHelperText error={state.errors.asset_type} />
                </div>
                <div>
                  <InputLabel htmlFor="asset-class" id="name=label">
                    Asset Class
                  </InputLabel>
                  <div className="my-2">
                    <SelectMenu
                      options={[
                        { title: "Select", value: undefined },
                        { title: "ONVIF Camera", value: "ONVIF" },
                        { title: "HL7 Vitals Monitor", value: "HL7MONITOR" },
                      ]}
                      selected={asset_class}
                      onSelect={setAssetClass}
                    />
                  </div>
                </div>
                <div>
                  <InputLabel htmlFor="is_working" id="name=label" required>
                    Working Status
                  </InputLabel>
                  <div className="my-2">
                    <SelectMenu
                      options={[
                        { title: "Select", value: undefined },
                        { title: "Working", value: "true" },
                        { title: "Not Working", value: "false" },
                      ]}
                      selected={is_working}
                      onSelect={setIsWorking}
                      position="right"
                    />
                  </div>
                  <ErrorHelperText error={state.errors.is_working} />
                </div>
              </div>
              {is_working === "false" && (
                <div>
                  <InputLabel htmlFor="description" id="name=label">
                    Reason
                  </InputLabel>
                  <MultilineInputField
                    id="not_working_reason"
                    rows={3}
                    fullWidth
                    name="description"
                    placeholder=""
                    variant="outlined"
                    margin="dense"
                    value={not_working_reason}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNotWorkingReason(e.target.value)
                    }
                    errors={state.errors.not_working_reason}
                  />
                </div>
              )}
              <div>
                <InputLabel htmlFor="description" id="name=label">
                  Description
                </InputLabel>
                <MultilineInputField
                  id="description"
                  rows={3}
                  fullWidth
                  name="description"
                  placeholder="Eg. Details about the equipment"
                  variant="outlined"
                  margin="dense"
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDescription(e.target.value)
                  }
                  errors={state.errors.description}
                />
              </div>
              <div>
                <InputLabel htmlFor="serial_number" id="name=label">
                  Serial Number
                </InputLabel>
                <TextInputField
                  id="serial_number"
                  fullWidth
                  name="serial_number"
                  placeholder=""
                  variant="outlined"
                  margin="dense"
                  value={serial_number}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSerialNumber(e.target.value)
                  }
                  errors={state.errors.serial_number}
                />
              </div>
              <div>
                <InputLabel htmlFor="vendor_name" id="name=label">
                  Vendor Name
                </InputLabel>
                <TextInputField
                  id="vendor_name"
                  fullWidth
                  name="vendor_name"
                  placeholder=""
                  variant="outlined"
                  margin="dense"
                  value={vendor_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setVendorName(e.target.value)
                  }
                  errors={state.errors.vendor_name}
                />
              </div>
              <div>
                <InputLabel htmlFor="support_name" id="name=label">
                  Customer Support Name
                </InputLabel>
                <TextInputField
                  id="support_name"
                  fullWidth
                  name="support_name"
                  placeholder=""
                  variant="outlined"
                  margin="dense"
                  value={support_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSupportName(e.target.value)
                  }
                  errors={state.errors.support_name}
                />
              </div>
              <div>
                <PhoneNumberField
                  label="Customer Support No.*"
                  value={support_phone}
                  onChange={(value: any) => setSupportPhone(value)}
                  errors={state.errors.support_phone}
                />
              </div>
              <div>
                <InputLabel htmlFor="support_email" id="name=label">
                  Contact Email
                </InputLabel>
                <TextInputField
                  id="support_email"
                  fullWidth
                  name="support_email"
                  placeholder=""
                  variant="outlined"
                  margin="dense"
                  value={support_email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSupportEmail(e.target.value)
                  }
                  errors={state.errors.support_email}
                />
              </div>
              <div>
                <InputLabel htmlFor="location" id="name=label" required>
                  Location
                </InputLabel>

                <SelectField
                  id="location"
                  fullWidth
                  name="location"
                  placeholder=""
                  variant="outlined"
                  margin="dense"
                  options={[{ id: "0", name: "Select" }, ...locations]}
                  optionValue="name"
                  value={location}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLocation(e.target.value)
                  }
                  errors={state.errors.location}
                />
              </div>
              <div>
                <InputLabel htmlFor="qr_code_id" id="name=label">
                  Asset QR Code ID
                </InputLabel>
                <ActionTextInputField
                  id="qr_code_id"
                  fullWidth
                  name="qr_code_id"
                  placeholder=""
                  variant="outlined"
                  margin="dense"
                  value={qrCodeId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setQrCodeId(e.target.value)
                  }
                  actionIcon={<CropFreeIcon className="cursor-pointer" />}
                  action={() => setIsScannerActive(true)}
                  errors={state.errors.qr_code_id}
                />
              </div>
              <div>
                <InputLabel htmlFor="manufacturer" id="name=label">
                  Manufacturer
                </InputLabel>
                <TextInputField
                  id="manufacturer"
                  fullWidth
                  name="manufacturer"
                  placeholder=""
                  variant="outlined"
                  margin="dense"
                  value={manufacturer}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setManufacturer(e.target.value)
                  }
                  errors={state.errors.manufacturer}
                />
              </div>
              <div>
                <InputLabel>{"Warranty / AMC Details"}</InputLabel>
                <div className="flex flex-wrap gap-2 lg:gap-4 transition-all ease-linear">
                  <DateInputField
                    className="w-36"
                    label="Expiry"
                    value={warranty_amc_end_of_validity}
                    onChange={(date) =>
                      setWarrantyAmcEndOfValidity(
                        moment(date).format("YYYY-MM-DD")
                      )
                    }
                    disablePast={true}
                    errors={state.errors.warranty_amc_end_of_validity}
                    InputLabelProps={{ shrink: true }}
                  />
                  <DateInputField
                    className="w-36"
                    label="Last serviced on"
                    value={last_serviced_on}
                    onChange={(date) =>
                      setLastServicedOn(moment(date).format("YYYY-MM-DD"))
                    }
                    disableFuture={true}
                    errors={state.errors.last_serviced_on}
                    InputLabelProps={{ shrink: true }}
                  />
                </div>
              </div>
              <div>
                <InputLabel htmlFor="notes" id="name=label">
                  Notes
                </InputLabel>
                <MultilineInputField
                  id="notes"
                  rows={3}
                  fullWidth
                  name="notes"
                  placeholder="Eg. Details on functionality, service, etc."
                  variant="outlined"
                  margin="dense"
                  value={notes}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNotes(e.target.value)
                  }
                  errors={state.errors.notes}
                />
              </div>
            </div>
            <div className="flex justify-center sm:justify-start gap-x-4 gap-y-2 flex-wrap">
              <Button
                id="asset-create"
                color="primary"
                variant="contained"
                type="submit"
                onClick={(e) => handleSubmit(e)}
                startIcon={
                  <CheckCircleOutlineIcon>save</CheckCircleOutlineIcon>
                }
                className="w-full sm:w-auto"
              >
                {assetId ? "Update" : "Create"}
              </Button>
              <Button
                id="asset-cancel"
                color="primary"
                variant="outlined"
                type="button"
                onClick={() =>
                  navigate(
                    assetId ? `/assets/${assetId}` : `/facility/${facilityId}`
                  )
                }
                startIcon={<CancelOutlineIcon>cancel</CancelOutlineIcon>}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card> */}
    </div>
  );
};

export default AssetCreate;
