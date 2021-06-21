import React, { useReducer, useState, useEffect } from "react";
import { createAsset, listFacilityAssetLocation } from "../../Redux/actions";
import { useDispatch } from "react-redux";
import * as Notification from "../../Utils/Notifications.js";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  InputLabel,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Box,
  Radio,
} from "@material-ui/core";
import {
  SelectField,
  TextInputField,
  MultilineInputField,
} from "../Common/HelperInputFields";

import PageTitle from "../Common/PageTitle";
const initForm: any = {
  name: "",
  asset_type: "",
  description: "",
  is_working: "",
  serial_number: "",
  warranty_details: "",
  location: "0",
};

const initError = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" }))
);

const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};

interface AssetProps {
  facilityId: string;
}

const asset_create_reducer = (state = initialState, action: any) => {
  switch (action.type) {
    case "set_form": {
      return {
        ...state,
        form: action.form,
      };
    }
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
  const [isLoading, setIsLoading] = useState(false);
  const [isLocationsLoading, setIsLocationsLoading] = useState(false);
  const dispatchAction: any = useDispatch();
  const [locations, setLocations] = useState([{ id: "0", name: "Select" }]);

  const handleChange = (e: any) => {
    let form = { ...state.form };
    form[e.target.name] = e.target.value;
    dispatch({ type: "set_form", form });
  };

  const { facilityId } = props;

  const validateForm = () => {
    let errors = { ...initError };
    let invalidForm = false;
    Object.keys(state.form).forEach((field) => {
      switch (field) {
        case "name":
          if (!state.form[field]) {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          return;
        case "is_working":
          if (state.form[field] !== "true" && state.form[field] !== "false") {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          return;
        case "location":
          if (
            !state.form[field] ||
            state.form[field] === "0" ||
            state.form[field] === ""
          ) {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          return;
        case "asset_type":
          if (
            state.form[field] !== "INTERNAL" &&
            state.form[field] !== "EXTERNAL"
          ) {
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

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const validated = validateForm();
    if (validated) {
      setIsLoading(true);
      const data = {
        name: state.form.name,
        asset_type: state.form.asset_type,
        description: state.form.description,
        is_working: state.form.is_working,
        serial_number: state.form.serial_number,
        warranty_details: state.form.warranty_details,
        location: state.form.location,
      };
      const res = await dispatchAction(createAsset(data));
      if (res && res.data && res.status == 201) {
        dispatch({ type: "set_form", form: initForm });
        Notification.Success({
          msg: "Asset created successfully",
        });
        goBack();
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLocationsLoading(true);
    dispatchAction(
      listFacilityAssetLocation({}, { facility_external_id: facilityId })
    ).then(({ data }: any) => {
      setLocations([...locations, ...data.results]);
      setIsLocationsLoading(false);
    });
  }, []);

  return (
    <div className="px-6 pb-2">
      <PageTitle title="Create New Asset" />
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
                value={state.form.name}
                onChange={handleChange}
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
                    id: 0,
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
                value={state.form.asset_type}
                onChange={(e) => handleChange(e)}
                errors={state.errors.asset_type}
              />
            </div>
            <div>
              <InputLabel htmlFor="location" id="name=label">
                Location*
              </InputLabel>
              {isLocationsLoading ? (
                <CircularProgress size={20} />
              ) : (
                <SelectField
                  id="location"
                  fullWidth
                  name="location"
                  placeholder=""
                  variant="outlined"
                  margin="dense"
                  options={locations}
                  optionValue="name"
                  value={state.form.location}
                  onChange={(e) => handleChange(e)}
                  errors={state.errors.location}
                />
              )}
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
                    id: 0,
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
                value={state.form.is_working}
                onChange={handleChange}
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
                value={state.form.description}
                onChange={handleChange}
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
                value={state.form.serial_number}
                onChange={handleChange}
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
                value={state.form.warranty_details}
                onChange={handleChange}
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
              Create
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssetCreate;
