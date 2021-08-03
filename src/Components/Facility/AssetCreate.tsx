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
  const [description, setDescription] = useState<string>("");
  const [is_working, setIsWorking] = useState<string>();
  const [serial_number, setSerialNumber] = useState<string>("");
  const [warranty_details, setWarrantyDetails] = useState<string>("");
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
      setSerialNumber(asset.serial_number);
      setWarrantyDetails(asset.warranty_details);
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
        serial_number: serial_number,
        warranty_details: warranty_details,
        location: location,
        vendor_name: "XYZ",
        customer_support: "ABC",
        contact: "000",
        email: "abc@xyz.com",
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
