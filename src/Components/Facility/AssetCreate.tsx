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
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { validateEmailAddress } from "../../Common/validation";
import {
  ActionTextInputField,
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
import TextInputFieldV2 from "../Common/components/TextInputFieldV2";
import SwitchV2 from "../Common/components/Switch";
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
  const [locations, setLocations] = useState<any>([]);
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

  const sectionId = (title: string) => title.toLowerCase().replace(" ", "-");
  const sectionTitle = (title: string) => {
    return (
      <div
        id={sectionId(title)}
        className="col-span-6 flex flex-row gap-6 items-center mb-6 -ml-2"
      >
        <label className="font-bold text-lg">{title}</label>
        <hr className="flex-1" />
      </div>
    );
  };

  const scrollTo = (id: string) =>
    document
      .querySelector(`#${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="pb-2 h-screen overflow-hidden">
      <PageTitle
        title={`${assetId ? "Update" : "Create"} Asset`}
        className="pl-6"
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          assets: { style: "text-gray-200 pointer-events-none" },
          [assetId || "????"]: { name },
        }}
      />
      <div className="mt-5 md:mt-8 flex h-full sticky top-0">
        <div className="hidden xl:flex flex-col bg-gray-200 rounded-r-lg pt-10 -ml-2 w-60">
          {[
            { title: "General Details", icon: "fa-solid fa-circle-info" },
            { title: "Warranty Details", icon: "fa-solid fa-barcode" },
            { title: "Service Details", icon: "fas fa-tools" },
          ].map((section) => {
            return (
              <button
                className="flex items-center justify-start gap-3 px-5 py-3 w-full font-medium hover:bg-white hover:tracking-wider transition-all duration-100 ease-in"
                onClick={() => scrollTo(sectionId(section.title))}
              >
                <i className={`${section.icon} text-sm`} />
                <span>{section.title}</span>
              </button>
            );
          })}
        </div>
        <div className="w-full h-full flex overflow-auto">
          <div className="w-full max-w-3xl 2xl:max-w-4xl mx-auto">
            <form
              onSubmit={handleSubmit}
              className="rounded sm:rounded-xl bg-white p-6 sm:p-12 transition-all mb-60"
            >
              <div className="grid grid-cols-1 gap-x-12 items-start">
                <div className="grid grid-cols-6 gap-x-6">
                  {/* General Details Section */}
                  {sectionTitle("General Details")}

                  {/* Asset Name */}
                  <div className="col-span-6">
                    <TextInputFieldV2
                      id="asset-name"
                      label="Asset Name"
                      value={name}
                      onValueChange={setName}
                      error={state.errors.name}
                      required
                    />
                  </div>

                  <div className="col-span-6 flex flex-col lg:flex-row gap-x-12 xl:gap-x-16 transition-all">
                    {/* Location */}
                    <div>
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

                    {/* Asset Type */}
                    <div>
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
                      className={
                        "mt-2 block w-full input" +
                        ((state.errors.description && " border-red-500") || "")
                      }
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
                      className={
                        "transition-all " +
                        (is_working === "true"
                          ? "opacity-0 my-0"
                          : "opacity-100 my-4")
                      }
                    />
                  </div>

                  {/* Working Status */}
                  <SwitchV2
                    className="col-span-6"
                    required
                    name="is_working"
                    label="Working Status"
                    options={["true", "false"]}
                    optionLabel={(option) => {
                      return (
                        {
                          true: "Working",
                          false: "Not Working",
                        }[option] || "undefined"
                      );
                    }}
                    optionClassName={(option) =>
                      option === "false" &&
                      "bg-error text-white border-error focus:ring-error"
                    }
                    value={is_working}
                    onChange={setIsWorking}
                    error={state.errors.is_working}
                  />

                  {/* Not Working Reason */}
                  <div
                    className={
                      "col-span-6" +
                      ((is_working !== "false" && " hidden") || "")
                    }
                  >
                    <label htmlFor="not_working_reason">
                      Why the asset is not working?
                    </label>
                    <textarea
                      id="not_working_reason"
                      className={
                        "mt-2 block w-full input" +
                        ((state.errors.not_working_reason &&
                          " border-red-500") ||
                          "")
                      }
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
                      className={
                        "transition-all " +
                        (is_working === "true"
                          ? "opacity-0 my-0"
                          : "opacity-100 mb-7")
                      }
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
                      onChange={(e) => setQrCodeId(e.target.value)}
                      actionIcon={<CropFreeIcon className="cursor-pointer" />}
                      action={() => setIsScannerActive(true)}
                      errors={state.errors.qr_code_id}
                    />
                    <ErrorHelperText error={state.errors.qr_id} />
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-x-6">
                  {sectionTitle("Warranty Details")}

                  {/* Manufacturer */}
                  <div className="col-span-6 sm:col-span-3">
                    <TextInputFieldV2
                      id="manufacturer"
                      label="Manufacturer"
                      value={manufacturer}
                      placeholder="Eg. XYZ"
                      onValueChange={setManufacturer}
                      error={state.errors.manufacturer}
                    />
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
                    <TextInputFieldV2
                      id="support-name"
                      label="Customer Support Name"
                      placeholder="Eg. ABC"
                      value={support_name}
                      onValueChange={setSupportName}
                      error={state.errors.support_name}
                    />
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
                    <TextInputFieldV2
                      id="support-email"
                      label="Customer Support Email"
                      placeholder="Eg. mail@example.com"
                      value={support_email}
                      onValueChange={setSupportEmail}
                      error={state.errors.support_email}
                    />
                  </div>

                  <div className="sm:col-span-3" />

                  {/* Vendor Name */}
                  <div className="col-span-6 sm:col-span-3">
                    <TextInputFieldV2
                      label="Vendor Name"
                      id="vendor-name"
                      placeholder="Eg. XYZ"
                      onValueChange={setVendorName}
                      error={state.errors.vendor_name}
                    />
                  </div>

                  {/* Serial Number */}
                  <div className="col-span-6 sm:col-span-3">
                    <TextInputFieldV2
                      label="Serial Number"
                      id="serial-number"
                      value={serial_number}
                      onValueChange={setSerialNumber}
                      error={state.errors.serial_number}
                    />
                  </div>

                  <div className="mt-6" />
                  {sectionTitle("Service Details")}

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
                      className={
                        "mt-2 block w-full input" +
                        ((state.errors.notes && " border-red-500") || "")
                      }
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

                <div className="mt-12 flex justify-end gap-x-4 gap-y-2 flex-wrap">
                  <button
                    className="primary-button"
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
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetCreate;
