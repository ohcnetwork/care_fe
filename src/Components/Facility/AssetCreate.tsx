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
import PageTitle from "../Common/PageTitle";
import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  InputLabel,
} from "@material-ui/core";
import {
  SelectField,
  TextInputField,
  MultilineInputField,
} from "../Common/HelperInputFields";
import { AssetData } from "../Assets/AssetTypes";
import loadable from "@loadable/component";
const Loading = loadable(() => import("../Common/Loading"));

const initError: any = {
  name: "",
  asset_type: "",
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
  const [state, dispatch] = useReducer(asset_create_reducer, initialState);
  const [name, setName] = useState<string>("");
  const [asset_type, setAssetType] = useState<string>("");
  const [not_working_reason, setNotWorkingReason] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [is_working, setIsWorking] = useState<string>();
  const [serial_number, setSerialNumber] = useState<string>("");
  const [warranty_details, setWarrantyDetails] = useState<string>("");
  const [vendor_name, setVendorName] = useState<string>("");
  const [support_name, setSupportName] = useState<string>("");
  const [support_phone, setSupportPhone] = useState<string>("");
  const [support_email, setSupportEmail] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const dispatchAction: any = useDispatch();
  const [locations, setLocations] = useState([{ id: "0", name: "Select" }]);
  const [asset, setAsset] = useState<AssetData>();

  const { facilityId, assetId } = props;
  useEffect(() => {
    setIsLoading(true);
    dispatchAction(
      listFacilityAssetLocation({}, { facility_external_id: facilityId })
    ).then(({ data }: any) => {
      setLocations([...locations, ...data.results]);
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
      setIsWorking(String(asset.is_working));
      setNotWorkingReason(asset.not_working_reason);
      setSerialNumber(asset.serial_number);
      setWarrantyDetails(asset.warranty_details);
      setVendorName(asset.vendor_name);
      setSupportName(asset.support_name);
      setSupportEmail(asset.support_email);
      setSupportPhone(asset.support_phone);
    }
  }, [asset]);

  const validateForm = () => {
    let errors = { ...initError };
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
          if (is_working === "0") {
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
          if (asset_type !== "INTERNAL" && asset_type !== "EXTERNAL") {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          return;
        case "support_phone":
          if (!support_phone) {
            errors[field] = "Field is required";
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
        description: description,
        is_working: is_working,
        not_working_reason: is_working === "true" ? "" : not_working_reason,
        serial_number: serial_number,
        warranty_details: warranty_details,
        location: location,
        vendor_name: vendor_name,
        support_name: support_name,
        support_email: support_email,
        support_phone: support_phone,
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

  if (isLoading) return <Loading />;

  return (
    <div className="px-6 pb-2">
      <PageTitle title={assetId ? "Update Asset" : "Create New Asset"} />
      <Card className="mt-4 max-w-lg m-auto">
        <CardContent>
          <form
            onSubmit={(e) => handleSubmit(e)}
            className="flex flex-col gap-3"
          >
            <div>
              <InputLabel htmlFor="asset-name" id="name=label">
                Asset Name*
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
            <div>
              <InputLabel htmlFor="asset-type" id="name=label">
                Asset Type*
              </InputLabel>
              <SelectField
                id="asset-type"
                fullWidth
                name="asset_type"
                placeholder=""
                variant="outlined"
                margin="dense"
                options={[
                  {
                    id: "",
                    name: "Select",
                  },
                  {
                    id: "EXTERNAL",
                    name: "EXTERNAL",
                  },
                  {
                    id: "INTERNAL",
                    name: "INTERNAL",
                  },
                ]}
                optionValue="name"
                value={asset_type}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setAssetType(e.target.value)
                }
                errors={state.errors.asset_type}
              />
            </div>
            <div>
              <InputLabel htmlFor="location" id="name=label">
                Location*
              </InputLabel>

              <SelectField
                id="location"
                fullWidth
                name="location"
                placeholder=""
                variant="outlined"
                margin="dense"
                options={locations}
                optionValue="name"
                value={location}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setLocation(e.target.value)
                }
                errors={state.errors.location}
              />
            </div>
            <div>
              <InputLabel htmlFor="is_working" id="name=label">
                Is Working*
              </InputLabel>
              <SelectField
                id="is_working"
                fullWidth
                name="is_working"
                placeholder=""
                variant="outlined"
                margin="dense"
                options={[
                  {
                    id: "0",
                    name: "Select",
                  },
                  {
                    id: "true",
                    name: "Yes",
                  },
                  {
                    id: "false",
                    name: "No",
                  },
                ]}
                optionValue="name"
                value={is_working}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setIsWorking(e.target.value)
                }
                errors={state.errors.is_working}
              />
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
              <InputLabel htmlFor="support_phone" id="name=label">
                Contact Phone Number*
              </InputLabel>
              <TextInputField
                id="support_phone"
                fullWidth
                name="support_phone"
                placeholder=""
                variant="outlined"
                margin="dense"
                value={support_phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSupportPhone(e.target.value)
                }
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
            <Button
              id="asset-create"
              color="primary"
              variant="contained"
              type="submit"
              style={{ marginLeft: "auto" }}
              onClick={(e) => handleSubmit(e)}
              startIcon={<CheckCircleOutlineIcon>save</CheckCircleOutlineIcon>}
            >
              {assetId ? "Update" : "Create"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssetCreate;
