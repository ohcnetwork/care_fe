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
import Popover from "@material-ui/core/Popover";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import MyLocationIcon from "@material-ui/icons/MyLocation";
import { makeStyles } from "@material-ui/styles";
import { navigate } from "raviger";
import loadable from "@loadable/component";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import React, { useCallback, useReducer, useState } from "react";
import { useDispatch } from "react-redux";
import { FACILITY_TYPES } from "../../Common/constants";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  validateLocationCoordinates,
  phonePreg,
} from "../../Common/validation";
import {
  createFacility,
  getDistrictByState,
  getFacility,
  getLocalbodyByDistrict,
  getStates,
  updateFacility,
  getWardByLocalBody,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import {
  MultilineInputField,
  PhoneNumberField,
  SelectField,
  TextInputField,
} from "../Common/HelperInputFields";
const Loading = loadable(() => import("../Common/Loading"));
import { LocationSearchAndPick } from "../Common/LocationSearchAndPick";
const PageTitle = loadable(() => import("../Common/PageTitle"));

const DEFAULT_MAP_LOCATION = [10.038394700000001, 76.5074145180173]; // Ernakulam

interface FacilityProps {
  facilityId?: number;
}

const facilityTypes = [...FACILITY_TYPES.map((i) => i.text)];
const initialStates = [{ id: 0, name: "Choose State *" }];
const initialDistricts = [{ id: 0, name: "Choose District" }];
const selectStates = [{ id: 0, name: "Please select your state" }];
const initialLocalbodies = [{ id: 0, name: "Choose Localbody" }];
const selectDistrict = [{ id: 0, name: "Please select your district" }];
const selectLocalBody = [{ id: 0, name: "Please select your Local Body", number: 0 }];
const initialWards = [{ id: 0, name: "Choose Ward", number: 0 }];

const initForm: any = {
  facility_type: "2",
  name: "",
  state: "",
  district: "",
  local_body: "",
  ward: "",
  kasp_empanelled: "false",
  address: "",
  phone_number: "",
  latitude: "",
  longitude: "",
  pincode: "",
  oxygen_capacity: "",
  type_b_cylinders: "",
  type_c_cylinders: "",
  type_d_cylinders: "",
};

const initError = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" }))
);

const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};

const facility_create_reducer = (state = initialState, action: any) => {
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

export const FacilityCreate = (props: FacilityProps) => {
  const dispatchAction: any = useDispatch();
  const { facilityId } = props;

  const [state, dispatch] = useReducer(facility_create_reducer, initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [isStateLoading, setIsStateLoading] = useState(false);
  const [isDistrictLoading, setIsDistrictLoading] = useState(false);
  const [isLocalbodyLoading, setIsLocalbodyLoading] = useState(false);
  const [isWardLoading, setIsWardLoading] = useState(false);
  const [states, setStates] = useState(initialStates);
  const [districts, setDistricts] = useState(selectStates);
  const [localBody, setLocalBody] = useState(selectDistrict);
  const [ward, setWard] = useState(selectLocalBody);

  const [anchorEl, setAnchorEl] = React.useState<
    (EventTarget & Element) | null
  >(null);
  const [mapLoadLocation, setMapLoadLocation] = useState(DEFAULT_MAP_LOCATION);

  const headerText = !facilityId ? "Create Facility" : "Update Facility";
  const buttonText = !facilityId ? "Save Facility" : "Update Facility";

  const fetchDistricts = useCallback(
    async (id: string) => {
      if (Number(id) > 0) {
        setIsDistrictLoading(true);
        const districtList = await dispatchAction(getDistrictByState({ id }));
        setDistricts([...initialDistricts, ...districtList.data]);
        setIsDistrictLoading(false);
      } else {
        setDistricts(selectStates);
      }
    },
    [dispatchAction]
  );

  const fetchLocalBody = useCallback(
    async (id: string) => {
      if (Number(id) > 0) {
        setIsLocalbodyLoading(true);
        const localBodyList = await dispatchAction(
          getLocalbodyByDistrict({ id })
        );
        setIsLocalbodyLoading(false);
        setLocalBody([...initialLocalbodies, ...localBodyList.data]);
      } else {
        setLocalBody(selectDistrict);
      }
    },
    [dispatchAction]
  );

  const fetchWards = useCallback(
    async (id: string) => {
      if (Number(id) > 0) {
        setIsWardLoading(true);
        const wardList = await dispatchAction(getWardByLocalBody({ id }));
        setIsWardLoading(false);
        setWard([...initialWards, ...wardList.data.results]);
      } else {
        setWard(selectLocalBody);
      }
    },
    [dispatchAction]
  );

  const fetchData = useCallback(
    async (status: statusType) => {
      if (facilityId) {
        setIsLoading(true);
        const res = await dispatchAction(getFacility(facilityId));
        if (!status.aborted && res.data) {
          const formData = {
            facility_type: res.data.facility_type,
            name: res.data.name,
            state: res.data.state ? res.data.state : "",
            district: res.data.district ? res.data.district : "",
            local_body: res.data.local_body ? res.data.local_body : "",
            ward: res.data.ward_object ? res.data.ward_object.id : initialWards,
            kasp_empanelled: res.data.kasp_empanelled
              ? String(res.data.kasp_empanelled)
              : "false",
            address: res.data.address,
            pincode: res.data.pincode,
            phone_number: res.data.phone_number.length == 10 ? "+91" + res.data.phone_number : res.data.phone_number,
            latitude: res.data.location ? res.data.location.latitude : "",
            longitude: res.data.location ? res.data.location.longitude : "",
            oxygen_capacity: res.data.oxygen_capacity
              ? res.data.oxygen_capacity
              : "",
          };
          dispatch({ type: "set_form", form: formData });
          Promise.all([
            fetchDistricts(res.data.state),
            fetchLocalBody(res.data.district),
            fetchWards(res.data.local_body),
          ]);
        } else {
          navigate(`/facility/${facilityId}`);
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, facilityId, fetchDistricts, fetchLocalBody, fetchWards]
  );

  const fetchStates = useCallback(
    async (status: statusType) => {
      setIsStateLoading(true);
      const statesRes = await dispatchAction(getStates());
      if (!status.aborted && statesRes.data.results) {
        setStates([...initialStates, ...statesRes.data.results]);
      }
      setIsStateLoading(false);
    },
    [dispatchAction]
  );

  useAbortableEffect(
    (status: statusType) => {
      if (facilityId) {
        fetchData(status);
      }
      fetchStates(status);
    },
    [dispatch, fetchData]
  );

  const handleChange = (e: any) => {
    let form = { ...state.form };
    form[e.target.name] = e.target.value;
    dispatch({ type: "set_form", form });
  };

  const handleValueChange = (value: any, name: string) => {
    const form = { ...state.form };
    form[name] = value;
    dispatch({ type: "set_form", form });
  };

  const handleClickLocationPicker = (event: React.MouseEvent) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setMapLoadLocation([
          position.coords.latitude,
          position.coords.longitude,
        ]);
        const form = { ...state.form };
        form["latitude"] = position.coords.latitude;
        form["longitude"] = position.coords.longitude;
        dispatch({ type: "set_form", form });
      });
    }

    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const validateForm = () => {
    let errors = { ...initError };
    let invalidForm = false;
    Object.keys(state.form).forEach((field) => {
      switch (field) {
        case "name":
        case "address":
          if (!state.form[field]) {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          return;

        case "district":
        case "state":
        case "local_body":
        case "ward":
          if (!state.form[field]) {
            errors[field] = "Field is required";
            invalidForm = true;
          }

        case "pincode":
          if (!Number(state.form[field])) {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          return;
        case "phone_number":
          const phoneNumber = parsePhoneNumberFromString(state.form[field]);
          if (
            !state.form[field] ||
            !phoneNumber?.isPossible() ||
            !phonePreg(String(phoneNumber?.number))
          ) {
            errors[field] = "Please enter valid phone number";
            invalidForm = true;
          }
          return;
        case "latitude":
        case "longitude":
          if (
            !!state.form.latitude &&
            !!state.form.longitude &&
            !validateLocationCoordinates(state.form[field])
          ) {
            errors[field] = "Please enter valid coordinates";
            invalidForm = true;
          }
          return;

        case "type_b_cylinders":
          if (state.form.type_b_cylinders == "") {
            errors[field] = "Please fill number of type B cylinders";
            invalidForm = true;
          }
          return;

        case "type_c_cylinders":
          if (state.form.type_c_cylinders == "") {
            errors[field] = "Please fill number of type C cylinders";
            invalidForm = true;
          }
          return;

        case "type_d_cylinders":
          if (state.form.type_d_cylinders == "") {
            errors[field] = "Please fill number of type D cylinders";
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
        facility_type: state.form.facility_type,
        name: state.form.name,
        district: state.form.district,
        state: state.form.state,
        address: state.form.address,
        pincode: state.form.pincode,
        local_body: state.form.local_body,
        ward: state.form.ward,
        kasp_empanelled: JSON.parse(state.form.kasp_empanelled),
        location:
          state.form.latitude && state.form.longitude
            ? {
              latitude: Number(state.form.latitude),
              longitude: Number(state.form.longitude),
            }
            : undefined,
        phone_number: parsePhoneNumberFromString(
          state.form.phone_number
        )?.format("E.164"),
        oxygen_capacity: state.form.oxygen_capacity
          ? Number(state.form.oxygen_capacity)
          : 0,
        type_b_cylinders: state.form.type_b_cylinders
          ? Number(state.form.type_b_cylinders) :
          0,
        type_c_cylinders: state.form.type_c_cylinders
          ? Number(state.form.type_c_cylinders) :
          0,
        type_d_cylinders: state.form.type_d_cylinders
          ? Number(state.form.type_d_cylinders) :
          0,
      };
      const res = await dispatchAction(
        facilityId ? updateFacility(facilityId, data) : createFacility(data)
      );
      if (res && res.data) {
        const id = res.data.id;
        dispatch({ type: "set_form", form: initForm });
        if (!facilityId) {
          Notification.Success({
            msg: "Facility added successfully",
          });
          navigate(`/facility/${id}/bed`);
        } else {
          Notification.Success({
            msg: "Facility updated successfully",
          });
          navigate(`/facility/${facilityId}`);
        }
      }
      setIsLoading(false);
    }
  };

  const handleLocationSelect = (location: any) => {
    const form = { ...state.form };
    const latitude = parseFloat(location.lat);
    const longitude = parseFloat(location.lon);
    form["latitude"] = latitude;
    form["longitude"] = longitude;
    dispatch({ type: "set_form", form });
    setMapLoadLocation([latitude, longitude]);
  };

  if (isLoading) {
    return <Loading />;
  }
  const open = Boolean(anchorEl);
  const id = open ? "map-popover" : undefined;
  return (
    <div className="px-2 pb-2">
      <PageTitle title={headerText} />
      <Card className="mt-4">
        <CardContent>
          <form onSubmit={(e) => handleSubmit(e)}>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
                <InputLabel id="facility_type-label">Facility Type*</InputLabel>
                <SelectField
                  name="facility_type"
                  variant="outlined"
                  margin="dense"
                  optionArray={true}
                  value={state.form.facility_type}
                  options={facilityTypes}
                  onChange={handleChange}
                  errors={state.errors.facility_type}
                />
              </div>

              <div>
                <InputLabel id="name-label">Facility Name*</InputLabel>
                <TextInputField
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
                <InputLabel id="gender-label">State*</InputLabel>
                {isStateLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <SelectField
                    name="state"
                    variant="outlined"
                    margin="dense"
                    value={state.form.state}
                    options={states}
                    optionValue="name"
                    onChange={(e) => [
                      handleChange(e),
                      fetchDistricts(String(e.target.value)),
                    ]}
                    errors={state.errors.state}
                  />
                )}
              </div>

              <div>
                <InputLabel id="district-label">District*</InputLabel>
                {isDistrictLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <SelectField
                    name="district"
                    variant="outlined"
                    margin="dense"
                    value={state.form.district}
                    options={districts}
                    optionValue="name"
                    onChange={(e) => [
                      handleChange(e),
                      fetchLocalBody(String(e.target.value)),
                    ]}
                    errors={state.errors.district}
                  />
                )}
              </div>

              <div className="md:col-span-2">
                <InputLabel id="local_body-label">Localbody*</InputLabel>
                {isLocalbodyLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <SelectField
                    name="local_body"
                    variant="outlined"
                    margin="dense"
                    value={state.form.local_body}
                    options={localBody}
                    optionValue="name"
                    onChange={(e) => [
                      handleChange(e),
                      fetchWards(String(e.target.value)),
                    ]}
                    errors={state.errors.local_body}
                  />
                )}
              </div>
              <div className="md:col-span-2">
                <InputLabel id="ward-label">Ward*</InputLabel>
                {isWardLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <SelectField
                    name="ward"
                    variant="outlined"
                    margin="dense"
                    options={ward
                      .sort((a, b) => a.number - b.number)
                      .map((e) => {
                        return { id: e.id, name: e.number + ": " + e.name };
                      })}
                    value={state.form.ward}
                    optionValue="name"
                    onChange={handleChange}
                    errors={state.errors.ward}
                  />
                )}
              </div>

              <div className="md:col-span-2">
                <InputLabel id="name-label">Address*</InputLabel>
                <MultilineInputField
                  rows={5}
                  name="address"
                  placeholder=""
                  variant="outlined"
                  margin="dense"
                  value={state.form.address}
                  onChange={handleChange}
                  errors={state.errors.address}
                />
              </div>
              <div>
                <InputLabel id="name-label">Pincode*</InputLabel>
                <TextInputField
                  name="pincode"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  value={state.form.pincode}
                  onChange={handleChange}
                  errors={state.errors.pincode}
                />
              </div>
              <div>
                <PhoneNumberField
                  label="Emergency Contact Number"
                  value={state.form.phone_number}
                  onChange={(value: any) =>
                    handleValueChange(value, "phone_number")
                  }
                  errors={state.errors.phone_number}
                  onlyIndia={true}
                />
              </div>
              <div>
                <InputLabel id="name-label">
                  Oxygen Capacity in liters
                </InputLabel>
                <TextInputField
                  name="oxygen_capacity"
                  type="number"
                  variant="outlined"
                  margin="dense"
                  value={state.form.oxygen_capacity}
                  onChange={handleChange}
                  errors={state.errors.oxygen_capacity}
                />
              </div>

              <div>
                <InputLabel id="name-label">
                  B Type Oxygen Cylinders
                </InputLabel>
                <TextInputField
                  name="type_b_cylinders"
                  type="number"
                  variant="outlined"
                  margin="dense"
                  value={state.form.type_b_cylinders}
                  onChange={handleChange}
                  errors={state.errors.type_b_cylinders}
                />
              </div>

              <div>
                <InputLabel id="name-label">
                  C Type Oxygen Cylinders
                </InputLabel>
                <TextInputField
                  name="type_c_cylinders"
                  type="number"
                  variant="outlined"
                  margin="dense"
                  value={state.form.type_c_cylinders}
                  onChange={handleChange}
                  errors={state.errors.type_c_cylinders}
                />
              </div>

              <div>
                <InputLabel id="name-label">
                  Jumbo D Type Oxygen Cylinders
                </InputLabel>
                <TextInputField
                  name="type_d_cylinders"
                  type="number"
                  variant="outlined"
                  margin="dense"
                  value={state.form.type_d_cylinders}
                  onChange={handleChange}
                  errors={state.errors.type_d_cylinders}
                />
              </div>

              <div>
                <InputLabel id="kasp_empanelled">
                  Is this facility KASP empanelled?
                </InputLabel>
                <RadioGroup
                  aria-label="kasp_empanelled"
                  name="kasp_empanelled"
                  value={state.form.kasp_empanelled}
                  onChange={handleChange}
                  style={{ padding: "0px 5px" }}
                >
                  <Box display="flex" flexDirection="row">
                    <FormControlLabel
                      value="true"
                      control={<Radio />}
                      label="Yes"
                    />
                    <FormControlLabel
                      value="false"
                      control={<Radio />}
                      label="No"
                    />
                  </Box>
                </RadioGroup>
              </div>
            </div>
            <div className="flex items-center mt-4 -mx-2">
              <div className="flex-1 px-2">
                <InputLabel id="location-label">Location</InputLabel>
                <TextInputField
                  name="latitude"
                  label="Latitude"
                  placeholder=""
                  variant="outlined"
                  margin="dense"
                  value={state.form.latitude}
                  onChange={handleChange}
                  errors={state.errors.latitude}
                />
              </div>
              <div className="pt-4">
                <IconButton onClick={handleClickLocationPicker}>
                  <MyLocationIcon />
                </IconButton>
                <Popover
                  id={id}
                  open={open}
                  anchorEl={anchorEl}
                  onClose={handleClose}
                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "left",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "left",
                  }}
                >
                  <LocationSearchAndPick
                    latitude={mapLoadLocation[0]}
                    longitude={mapLoadLocation[1]}
                    onSelectLocation={handleLocationSelect}
                  />
                </Popover>
              </div>
              <div className="flex-1 px-2">
                <InputLabel>&nbsp;</InputLabel>
                <TextInputField
                  name="longitude"
                  label="Longitude"
                  placeholder=""
                  variant="outlined"
                  margin="dense"
                  value={state.form.longitude}
                  onChange={handleChange}
                  errors={state.errors.longitude}
                />
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <Button color="default" variant="contained" onClick={goBack}>
                Cancel
              </Button>
              <Button
                color="primary"
                variant="contained"
                type="submit"
                style={{ marginLeft: "auto" }}
                onClick={(e) => handleSubmit(e)}
                startIcon={
                  <CheckCircleOutlineIcon>save</CheckCircleOutlineIcon>
                }
              >
                {buttonText}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
