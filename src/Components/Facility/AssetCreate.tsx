import React, {
  useReducer,
  useState,
  useEffect,
  ReactEventHandler,
} from "react";
import {
  createAsset,
  getAsset,
  listFacilityAssetLocation,
  updateAsset,
} from "../../Redux/actions";
import { useDispatch } from "react-redux";
import * as Notification from "../../Utils/Notifications.js";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
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
  DateInputField,
} from "../Common/HelperInputFields";
import { AssetData } from "../Assets/AssetTypes";
import loadable from "@loadable/component";
import { LocationOnOutlined } from "@material-ui/icons";
import { navigate } from "raviger";
import QrReader from "react-qr-reader";
import { parseQueryParams } from "../../Utils/primitives";
import moment from "moment";
const Loading = loadable(() => import("../Common/Loading"));

interface CreateAssetForm {
  asset_type: "INTERNAL" | "EXTERNAL";
  asset_category: "5-Para-Monitor" | "Ventilator" | "PTZ Camera" | string;
  name: string;
  description: string;
  location: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  warranty_amc_applicable_till: string | null;
  is_working: boolean;
  support_name: string;
  support_phone: string;
  support_email: string;
  note: string;
  last_service_on: string | null;
  not_working_reason: string;
  qr_code_id: string;
}

const form: CreateAssetForm = {
  asset_type: "INTERNAL",
  asset_category: "",
  name: "",
  description: "",
  location: "",
  manufacturer: "",
  model: "",
  serial_number: "",
  warranty_amc_applicable_till: null,
  is_working: false,
  support_name: "",
  support_phone: "",
  support_email: "",
  note: "",
  last_service_on: null,
  not_working_reason: "",
  qr_code_id: "",
};

type FieldError = Record<keyof CreateAssetForm, string>;

const initError: FieldError = Object.keys(form).reduce(
  (a, c) => ({ ...a, [c]: "" }),
  {} as any
);

const initialState = {
  form: { ...form },
  errors: { ...initError },
};

interface AssetProps {
  facilityId: string;
  assetId?: string;
}

type Action =
  | { type: "set_error"; errors: FieldError }
  | { type: "set_form"; payload: CreateAssetForm };

const asset_create_reducer = (state = initialState, action: Action) => {
  switch (action.type) {
    case "set_error": {
      return {
        ...state,
        errors: action.errors,
      };
    }
    case "set_form": {
      return {
        ...state,
        form: action.payload,
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
  const {
    asset_category,
    asset_type,
    description,
    is_working,
    last_service_on,
    location,
    manufacturer,
    model,
    name,
    not_working_reason,
    note,
    qr_code_id,
    serial_number,
    support_email,
    support_name,
    support_phone,
    warranty_amc_applicable_till,
  } = state.form;
  const [warranty_details, setWarrantyDetails] = useState<string>("");
  const [vendor_name, setVendorName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const dispatchAction: any = useDispatch();
  const [locations, setLocations] = useState([]);
  const [asset, setAsset] = useState<AssetData>();
  const [facilityName, setFacilityName] = useState("");
  const [qrCodeId, setQrCodeId] = useState(qr_code_id);
  const [isScannerActive, setIsScannerActive] = useState<boolean>(false);

  const handleChange = (e: any) => {
    const newForm = { ...state.form };
    // @ts-ignore
    newForm[e.target.name] = e.target.value;
    dispatch({ type: "set_form", payload: newForm });
  };

  const handleValueChange = (name: keyof CreateAssetForm, value: any) => {
    const newForm = { ...state.form };
    // @ts-ignore
    newForm[name] = value;
    dispatch({ type: "set_form", payload: newForm });
  };

  const handleDateChange = (date: string | null, field: string) => {
    if (moment(date).isValid()) {
      const form = { ...state.form };
      // @ts-ignore
      form[field] = date;
      dispatch({ type: "set_form", payload: form });
    }
  };

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
      dispatchAction(getAsset(assetId)).then(
        ({ data }: { data: AssetData }) => {
          dispatch({
            type: "set_form",
            payload: {
              ...data,
              ...data.meta,
              location: data.location_object.id,
            } as unknown as CreateAssetForm,
          });
          setIsLoading(false);
        }
      );
    }
  }, [assetId]);

  const validateForm = () => {
    const errors = { ...initError };
    let invalidForm = false;
    Object.keys(state.errors).forEach((field) => {
      switch (field) {
        case "asset_type":
          if (asset_type !== "INTERNAL" && asset_type !== "EXTERNAL") {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          return;

        case "asset_category":
          if (!asset_category) {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          return;
        case "name":
          if (!name) {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          return;
        case "is_working":
          if (is_working === undefined || is_working === null) {
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
        description: description,
        is_working: is_working,
        not_working_reason: is_working ? "" : not_working_reason,
        serial_number: serial_number,
        location: location,
        vendor_name: vendor_name,
        support_name: support_name,
        support_email: support_email,
        support_phone:
          parsePhoneNumberFromString(support_phone)?.format("E.164"),
        qr_code_id: qrCodeId !== "" ? qrCodeId : null,
        meta: {
          asset_category,
          manufacturer,
          model,
          warranty_amc_applicable_till,
          note,
          last_service_on,
        },
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
  console.log(state);
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
                <InputLabel htmlFor="asset_type" id="asset_type" required>
                  Asset Type
                </InputLabel>
                <SelectField
                  id="asset_type"
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
                  onChange={handleChange}
                  errors={state.errors.asset_type}
                />
              </div>
              <div>
                <InputLabel
                  htmlFor="asset_category"
                  id="asset_category"
                  required
                >
                  Asset Category
                </InputLabel>
                <SelectField
                  id="asset_category"
                  fullWidth
                  name="asset_category"
                  placeholder=""
                  variant="outlined"
                  margin="dense"
                  options={[
                    {
                      id: "",
                      name: "Select",
                    },
                    {
                      id: "Ventilator",
                      name: "Ventilator",
                    },
                    {
                      id: "5-Para-Monitor",
                      name: "5-Para-Monitor",
                    },
                    {
                      id: "PTZ Camera",
                      name: "PTZ Camera",
                    },
                    {
                      id: "Others",
                      name: "Others",
                    },
                  ]}
                  optionValue="name"
                  value={asset_category}
                  onChange={handleChange}
                  errors={state.errors.asset_category}
                />
              </div>
              <div>
                <InputLabel htmlFor="name" id="name" required>
                  Asset Name
                </InputLabel>
                <TextInputField
                  id="name"
                  fullWidth
                  name="name"
                  placeholder=""
                  variant="outlined"
                  margin="dense"
                  value={name}
                  onChange={handleChange}
                  errors={state.errors.name}
                />
              </div>

              <div>
                <InputLabel htmlFor="model" id="label">
                  Model
                </InputLabel>
                <TextInputField
                  id="model"
                  fullWidth
                  name="model"
                  placeholder=""
                  variant="outlined"
                  margin="dense"
                  value={model}
                  onChange={handleChange}
                  errors={state.errors.model}
                />
              </div>

              <div>
                <InputLabel htmlFor="location" id="location" required>
                  Location
                </InputLabel>

                <SelectField
                  id="location"
                  fullWidth
                  name="location"
                  variant="outlined"
                  margin="dense"
                  options={[{ id: "0", name: "Select" }, ...locations]}
                  optionValue="name"
                  value={location}
                  onChange={handleChange}
                  errors={state.errors.location}
                />
              </div>
              <div>
                <InputLabel htmlFor="description" id="description">
                  Description
                </InputLabel>
                <MultilineInputField
                  id="description"
                  rows={3}
                  fullWidth
                  name="description"
                  placeholder="Type description here"
                  variant="outlined"
                  margin="dense"
                  value={description}
                  onChange={handleChange}
                  errors={state.errors.description}
                />
              </div>
              <div>
                <InputLabel htmlFor="manufacturer" id="manufacturer">
                  Manufacturer
                </InputLabel>
                <TextInputField
                  id="manufacturer"
                  name="manufacturer"
                  fullWidth
                  placeholder="manufacturer"
                  variant="outlined"
                  margin="dense"
                  value={manufacturer}
                  onChange={handleChange}
                  errors={state.errors.manufacturer}
                />
              </div>
              <div>
                <InputLabel htmlFor="serial_number" id="serial_number">
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
                  onChange={handleChange}
                  errors={state.errors.serial_number}
                />
              </div>
              <div>
                <InputLabel
                  htmlFor="warranty_amc_applicable_till"
                  id="warranty_amc_applicable_till"
                >
                  Warranty/AMC Applicable till
                </InputLabel>
                <DateInputField
                  fullWidth={true}
                  inputVariant="outlined"
                  errors={state.errors.warranty_amc_applicable_till}
                  margin="dense"
                  onChange={(val) =>
                    handleValueChange("warranty_amc_applicable_till", val)
                  }
                  value={state.form.warranty_amc_applicable_till}
                />
              </div>
              <div>
                <InputLabel htmlFor="serial_number" id="name=label">
                  Upload invoice/Warranty card/AMC
                </InputLabel>
                <label className="btn btn-primary mt-2">
                  <input className="hidden" type="file" />
                  Upload File
                </label>
              </div>
              <div className="sm:col-span-2">
                <InputLabel htmlFor="is_working" id="is_working" required>
                  Is Working
                </InputLabel>
                <RadioGroup
                  aria-label="is_working"
                  name="is_working"
                  value={is_working}
                  onChange={(e) =>
                    handleValueChange("is_working", e.target.value === "true")
                  }
                  className="flex flex-col justify-center mt-2"
                >
                  <Box display="flex" flexDirection="row">
                    <FormControlLabel
                      value={true}
                      control={<Radio />}
                      label="Yes"
                    />
                    <FormControlLabel
                      value={false}
                      control={<Radio />}
                      label="No"
                    />
                  </Box>
                </RadioGroup>
                <ErrorHelperText error={state.errors.is_working} />
                {!is_working && (
                  <div>
                    <InputLabel htmlFor="not_working_reason" id="name=label">
                      Reason
                    </InputLabel>
                    <MultilineInputField
                      id="not_working_reason"
                      rows={3}
                      fullWidth
                      name="not_working_reason"
                      placeholder=""
                      variant="outlined"
                      margin="dense"
                      value={not_working_reason}
                      onChange={handleChange}
                      errors={state.errors.not_working_reason}
                    />
                  </div>
                )}
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
                  onChange={handleChange}
                  errors={state.errors.support_name}
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
                  value={qr_code_id}
                  onChange={handleChange}
                  actionIcon={<CropFreeIcon className="cursor-pointer" />}
                  action={() => setIsScannerActive(true)}
                  errors={state.errors.qr_code_id}
                />
              </div>
              <div>
                <InputLabel htmlFor="support_email" id="name=label">
                  Customer Support Email
                </InputLabel>
                <TextInputField
                  id="support_email"
                  fullWidth
                  name="support_email"
                  placeholder=""
                  variant="outlined"
                  margin="dense"
                  value={support_email}
                  onChange={handleChange}
                  errors={state.errors.support_email}
                />
              </div>
              <div>
                <PhoneNumberField
                  label="Customer Support Phone Number*"
                  value={support_phone}
                  onChange={(value: string) =>
                    handleValueChange("support_phone", value)
                  }
                  errors={state.errors.support_phone}
                />
              </div>
              <div>
                <InputLabel htmlFor="note">Note</InputLabel>
                <MultilineInputField
                  id="note"
                  rows={3}
                  fullWidth
                  name="note"
                  placeholder=""
                  variant="outlined"
                  margin="dense"
                  value={note}
                  onChange={handleChange}
                  errors={state.errors.note}
                />
              </div>
              <div>
                <InputLabel htmlFor="last_service_on" id="last_service_on">
                  Last Serviced on
                </InputLabel>
                <DateInputField
                  fullWidth={true}
                  inputVariant="outlined"
                  errors=""
                  name="last_service_on"
                  margin="dense"
                  onChange={(val) => handleValueChange("last_service_on", val)}
                  value={last_service_on}
                />
              </div>
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
