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
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  InputLabel,
  Radio,
  RadioGroup,
} from "@material-ui/core";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { validateEmailAddress } from "../../Common/validation";
import {
  ActionTextInputField,
  SelectField,
  TextInputField,
  MultilineInputField,
  PhoneNumberField,
  ErrorHelperText,
} from "../Common/HelperInputFields";
import { AssetClass, AssetData, AssetType } from "../Assets/AssetTypes";
import loadable from "@loadable/component";
import { LocationOnOutlined } from "@material-ui/icons";
import { navigate } from "raviger";
import QrReader from "react-qr-reader";
import { parseQueryParams } from "../../Utils/primitives";
import SelectMenu from "../Common/components/SelectMenu";
const Loading = loadable(() => import("../Common/Loading"));

const initError: any = {
  name: "",
  asset_type: "",
  asset_class: "",
  description: "",
  is_working: "",
  serial_number: "",
  warranty_details: "",
  location: "",
  vendor_name: "",
  support_name: "",
  support_phone: "",
  support_email: "",
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
  const [is_working, setIsWorking] = useState<string | undefined>("");
  const [serial_number, setSerialNumber] = useState("");
  const [warranty_details, setWarrantyDetails] = useState("");
  const [vendor_name, setVendorName] = useState("");
  const [support_name, setSupportName] = useState("");
  const [support_phone, setSupportPhone] = useState("");
  const [support_email, setSupportEmail] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const dispatchAction: any = useDispatch();
  const [locations, setLocations] = useState([]);
  const [asset, setAsset] = useState<AssetData>();
  const [facilityName, setFacilityName] = useState("");
  const [qrCodeId, setQrCodeId] = useState("");
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
      setWarrantyDetails(asset.warranty_details);
      setVendorName(asset.vendor_name);
      setSupportName(asset.support_name);
      setSupportEmail(asset.support_email);
      setSupportPhone(asset.support_phone);
      setQrCodeId(asset.qr_code_id);
    }
  }, [asset]);

  const validateForm = () => {
    const errors = { ...initError };
    let invalidForm = false;
    Object.keys(state.errors).forEach((field) => {
      switch (field) {
        case "name":
          if (!name) {
            errors[field] = "Field is required";
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
            errors[field] = "Field is required";
            invalidForm = true;
          }
          return;
        case "asset_type":
          if (!asset_type) {
            errors[field] = "Field is required";
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
        warranty_details: warranty_details,
        location: location,
        vendor_name: vendor_name,
        support_name: support_name,
        support_email: support_email,
        support_phone:
          parsePhoneNumberFromString(support_phone)?.format("E.164"),
        qr_code_id: qrCodeId !== "" ? qrCodeId : null,
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
      <Card className="mt-4 mx-auto">
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
                  placeholder=""
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
                <InputLabel htmlFor="warranty_details" id="name=label">
                  Warranty Details
                </InputLabel>
                <TextInputField
                  id="warranty_details"
                  fullWidth
                  name="warranty_details"
                  placeholder=""
                  variant="outlined"
                  margin="dense"
                  value={warranty_details}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setWarrantyDetails(e.target.value)
                  }
                  errors={state.errors.warranty_details}
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
                  label="Phone Number*"
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
      </Card>
    </div>
  );
};

export default AssetCreate;
