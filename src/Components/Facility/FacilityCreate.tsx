import {
  Card,
  CardContent,
  CircularProgress,
  IconButton,
} from "@material-ui/core";
import Popover from "@material-ui/core/Popover";
import MyLocationIcon from "@material-ui/icons/MyLocation";
import { navigate } from "raviger";
import loadable from "@loadable/component";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import React, { useCallback, useReducer, useState } from "react";
import { useDispatch } from "react-redux";
import {
  FACILITY_FEATURE_TYPES,
  FACILITY_TYPES,
  KASP_ENABLED,
  KASP_STRING,
} from "../../Common/constants";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  phonePreg,
  validatePincode,
  validateLatitude,
  validateLongitude,
} from "../../Common/validation";
import {
  createFacility,
  getDistrictByState,
  getPermittedFacility,
  getLocalbodyByDistrict,
  getStates,
  updateFacility,
  getWardByLocalBody,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { ErrorHelperText, PhoneNumberField } from "../Common/HelperInputFields";
import GLocationPicker from "../Common/GLocationPicker";
import { goBack } from "../../Utils/utils";
import useWindowDimensions from "../../Common/hooks/useWindowDimensions";
import MultiSelectMenuV2 from "../Form/MultiSelectMenuV2";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
import SelectMenuV2 from "../Form/SelectMenuV2";
import RadioInputsV2 from "../Common/components/RadioInputsV2";
import ButtonV2 from "../Common/components/ButtonV2";
import TextFormField from "../Form/FormFields/TextFormField";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

interface FacilityProps {
  facilityId?: number;
}

interface StateObj {
  id: number;
  name: string;
}

interface WardObj extends StateObj {
  number: number;
}

type FacilityForm = {
  facility_type: string;
  name: string;
  state: number;
  district: number;
  local_body: number;
  features: number[];
  ward: number;
  kasp_empanelled: string;
  address: string;
  phone_number: string;
  latitude: string;
  longitude: string;
  pincode: string;
  oxygen_capacity: number;
  type_b_cylinders: number;
  type_c_cylinders: number;
  type_d_cylinders: number;
  expected_oxygen_requirement: number;
  expected_type_b_cylinders: number;
  expected_type_c_cylinders: number;
  expected_type_d_cylinders: number;
};

const initForm: FacilityForm = {
  facility_type: "Private Hospital",
  name: "",
  state: 0,
  district: 0,
  local_body: 0,
  ward: 0,
  kasp_empanelled: "false",
  features: [],
  address: "",
  phone_number: "",
  latitude: "",
  longitude: "",
  pincode: "",
  oxygen_capacity: 0,
  type_b_cylinders: 0,
  type_c_cylinders: 0,
  type_d_cylinders: 0,
  expected_oxygen_requirement: 0,
  expected_type_b_cylinders: 0,
  expected_type_c_cylinders: 0,
  expected_type_d_cylinders: 0,
};

const initError: Record<keyof FacilityForm, string> = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" }))
);

const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};

type SetFormAction = { type: "set_form"; form: FacilityForm };
type SetErrorAction = {
  type: "set_error";
  errors: Record<keyof FacilityForm, string>;
};
type FacilityCreateFormAction = SetFormAction | SetErrorAction;

const facilityCreateReducer = (
  state = initialState,
  action: FacilityCreateFormAction
) => {
  switch (action.type) {
    case "set_form":
      return { ...state, form: action.form };
    case "set_error":
      return { ...state, errors: action.errors };
  }
};

export const FacilityCreate = (props: FacilityProps) => {
  const dispatchAction: any = useDispatch();
  const { facilityId } = props;

  const [state, dispatch] = useReducer(facilityCreateReducer, initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [isStateLoading, setIsStateLoading] = useState(false);
  const [isDistrictLoading, setIsDistrictLoading] = useState(false);
  const [isLocalbodyLoading, setIsLocalbodyLoading] = useState(false);
  const [isWardLoading, setIsWardLoading] = useState(false);
  const [states, setStates] = useState<StateObj[]>([]);
  const [districts, setDistricts] = useState<StateObj[]>([]);
  const [localBodies, setLocalBodies] = useState<StateObj[]>([]);
  const [ward, setWard] = useState<WardObj[]>([]);
  const { width } = useWindowDimensions();

  const [anchorEl, setAnchorEl] = React.useState<
    (EventTarget & Element) | null
  >(null);

  const headerText = !facilityId ? "Create Facility" : "Update Facility";
  const buttonText = !facilityId ? "Save Facility" : "Update Facility";

  const fetchDistricts = useCallback(
    async (id: number) => {
      if (id > 0) {
        setIsDistrictLoading(true);
        const districtList = await dispatchAction(getDistrictByState({ id }));
        if (districtList) {
          setDistricts([...districtList.data]);
        }
        setIsDistrictLoading(false);
      }
    },
    [dispatchAction]
  );

  const fetchLocalBody = useCallback(
    async (id: number) => {
      if (id > 0) {
        setIsLocalbodyLoading(true);
        const localBodyList = await dispatchAction(
          getLocalbodyByDistrict({ id })
        );
        setIsLocalbodyLoading(false);
        if (localBodyList) {
          setLocalBodies([...localBodyList.data]);
        }
      }
    },
    [dispatchAction]
  );

  const fetchWards = useCallback(
    async (id: number) => {
      if (id > 0) {
        setIsWardLoading(true);
        const wardList = await dispatchAction(getWardByLocalBody({ id }));
        setIsWardLoading(false);
        if (wardList) {
          setWard([...wardList.data.results]);
        }
      }
    },
    [dispatchAction]
  );

  const fetchData = useCallback(
    async (status: statusType) => {
      if (facilityId) {
        setIsLoading(true);
        const res = await dispatchAction(getPermittedFacility(facilityId));
        if (!status.aborted && res.data) {
          const formData = {
            facility_type: res.data.facility_type,
            name: res.data.name,
            state: res.data.state ? res.data.state : 0,
            district: res.data.district ? res.data.district : 0,
            local_body: res.data.local_body ? res.data.local_body : 0,
            features: res.data.features || [],
            ward: res.data.ward_object ? res.data.ward_object.id : 0,
            kasp_empanelled: res.data.kasp_empanelled
              ? String(res.data.kasp_empanelled)
              : "false",
            address: res.data.address,
            pincode: res.data.pincode,
            phone_number:
              res.data.phone_number.length == 10
                ? "+91" + res.data.phone_number
                : res.data.phone_number,
            latitude: res.data.latitude || "",
            longitude: res.data.longitude || "",
            type_b_cylinders: res.data.type_b_cylinders,
            type_c_cylinders: res.data.type_c_cylinders,
            type_d_cylinders: res.data.type_d_cylinders,
            expected_type_b_cylinders: res.data.expected_type_b_cylinders,
            expected_type_c_cylinders: res.data.expected_type_c_cylinders,
            expected_type_d_cylinders: res.data.expected_type_d_cylinders,
            expected_oxygen_requirement: res.data.expected_oxygen_requirement,
            oxygen_capacity: res.data.oxygen_capacity,
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
        setStates([...statesRes.data.results]);
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

  const handleChange = (e: FieldChangeEvent<string>) => {
    dispatch({
      type: "set_form",
      form: { ...state.form, [e.name]: e.value },
    });
  };

  const handleLocationChange = (location: google.maps.LatLng | undefined) => {
    if (location) {
      dispatch({
        type: "set_form",
        form: {
          ...state.form,
          latitude: location.lat().toString(),
          longitude: location.lng().toString(),
        },
      });
    }
  };

  const handleValueChange = (value: any, field: string) => {
    dispatch({
      type: "set_form",
      form: { ...state.form, [field]: value },
    });
  };

  const handleSelectCurrentLocation = (
    setCenter: (lat: number, lng: number) => void
  ) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        dispatch({
          type: "set_form",
          form: {
            ...state.form,
            latitude: String(position.coords.latitude),
            longitude: String(position.coords.longitude),
          },
        });

        setCenter?.(position.coords.latitude, position.coords.longitude);
      });
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const validateForm = () => {
    const errors = { ...initError };
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
          if (!Number(state.form[field])) {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          return;

        case "pincode":
          if (!validatePincode(state.form[field])) {
            errors[field] = "Please enter valid pincode";
            invalidForm = true;
          }
          return;
        case "phone_number":
          // eslint-disable-next-line no-case-declarations
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
          if (!!state.form.latitude && !validateLatitude(state.form[field])) {
            errors[field] = "Please enter valid latitude between -90 and 90.";
            invalidForm = true;
          }
          return;
        case "longitude":
          if (!!state.form.longitude && !validateLongitude(state.form[field])) {
            errors[field] =
              "Please enter valid longitude between -180 and 180.";
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
    console.log(state.form);
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
        features: state.form.features,
        ward: state.form.ward,
        kasp_empanelled: JSON.parse(state.form.kasp_empanelled),
        latitude: state.form.latitude || null,
        longitude: state.form.longitude || null,
        phone_number: parsePhoneNumberFromString(
          state.form.phone_number
        )?.format("E.164"),
        oxygen_capacity: state.form.oxygen_capacity
          ? state.form.oxygen_capacity
          : 0,
        type_b_cylinders: state.form.type_b_cylinders
          ? state.form.type_b_cylinders
          : 0,
        type_c_cylinders: state.form.type_c_cylinders
          ? state.form.type_c_cylinders
          : 0,
        type_d_cylinders: state.form.type_d_cylinders
          ? state.form.type_d_cylinders
          : 0,
        expected_oxygen_requirement: state.form.expected_oxygen_requirement
          ? state.form.expected_oxygen_requirement
          : 0,
        expected_type_b_cylinders: state.form.expected_type_b_cylinders
          ? state.form.expected_type_b_cylinders
          : 0,

        expected_type_c_cylinders: state.form.expected_type_c_cylinders
          ? state.form.expected_type_c_cylinders
          : 0,

        expected_type_d_cylinders: state.form.expected_type_d_cylinders
          ? state.form.expected_type_d_cylinders
          : 0,
      };
      const res = await dispatchAction(
        facilityId ? updateFacility(facilityId, data) : createFacility(data)
      );

      if (res && (res.status === 200 || res.status === 201) && res.data) {
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
      } else {
        if (res?.data)
          Notification.Error({
            msg: "Something went wrong: " + (res.data.detail || ""),
          });
      }
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  const extremeSmallScreenBreakpoint = 320;
  const isExtremeSmallScreen =
    width <= extremeSmallScreenBreakpoint ? true : false;
  const open = Boolean(anchorEl);
  const id = open ? "map-popover" : undefined;
  return (
    <div className="px-2 pb-2">
      <PageTitle
        title={headerText}
        crumbsReplacements={{
          [facilityId || "????"]: { name: state.form.name },
        }}
      />
      <Card className="mt-4">
        <CardContent>
          <form onSubmit={(e) => handleSubmit(e)}>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
                <label htmlFor="facility-type" className="mb-2">
                  Facility Type
                  <span className="text-red-500">{" *"}</span>
                </label>
                <SelectMenuV2
                  id="facility-type"
                  required
                  options={FACILITY_TYPES}
                  value={state.form.facility_type}
                  optionLabel={(o) => o.text}
                  optionValue={(o) => o.text}
                  onChange={(e) => handleValueChange(e, "facility_type")}
                />
                <ErrorHelperText error={state.errors.facility_type} />
              </div>
              <div>
                <label htmlFor="facility-name" className="mb-2">
                  Facility Name
                  <span className="text-red-500">{" *"}</span>
                </label>
                <TextFormField
                  id="facility-name"
                  name="name"
                  required
                  onChange={handleChange}
                  value={state.form.name}
                  error={state.errors.name}
                />
              </div>
              <div>
                <label htmlFor="facility-features" className="mb-2">
                  Features
                </label>
                <MultiSelectMenuV2
                  id="facility-features"
                  placeholder="Features"
                  value={state.form.features}
                  options={FACILITY_FEATURE_TYPES}
                  optionLabel={(o) => o.name}
                  optionValue={(o) => o.id}
                  onChange={(o) => handleValueChange(o, "features")}
                />
                <ErrorHelperText error={state.errors.features} />
              </div>
              <div>
                <label htmlFor="facility-state" className="mb-2">
                  State
                  <span className="text-red-500">{" *"}</span>
                </label>
                {isStateLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <>
                    <SelectMenuV2
                      id="facility-state"
                      placeholder="Choose State *"
                      options={states}
                      optionLabel={(o) => o.name}
                      optionValue={(o) => o.id}
                      value={state.form.state}
                      onChange={(e) => {
                        if (e) {
                          return [
                            handleValueChange(e, "state"),
                            fetchDistricts(e),
                          ];
                        }
                      }}
                    />
                    <ErrorHelperText error={state.errors.state} />
                  </>
                )}
              </div>

              <div>
                <label htmlFor="facility-district" className="mb-2">
                  District
                  <span className="text-red-500">{" *"}</span>
                </label>

                {isDistrictLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <>
                    <SelectMenuV2
                      id="facility-district"
                      placeholder="Choose District"
                      options={districts}
                      optionLabel={(o) => o.name}
                      optionValue={(o) => o.id}
                      value={state.form.district}
                      onChange={(e) => {
                        if (e) {
                          return [
                            handleValueChange(e, "district"),
                            fetchLocalBody(e),
                          ];
                        }
                      }}
                    />
                    <ErrorHelperText error={state.errors.district} />
                  </>
                )}
              </div>

              <div>
                <label htmlFor="facility-localbody" className="mb-2">
                  LocalBody
                  <span className="text-red-500">{" *"}</span>
                </label>
                {isLocalbodyLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <>
                    <SelectMenuV2
                      id="facility-localbody"
                      placeholder="Choose LocalBody"
                      options={localBodies}
                      optionLabel={(o) => o.name}
                      optionValue={(o) => o.id}
                      value={state.form.local_body}
                      onChange={(e) => {
                        if (e) {
                          return [
                            handleValueChange(e, "local_body"),
                            fetchWards(e),
                          ];
                        }
                      }}
                    />
                    <ErrorHelperText error={state.errors.local_body} />
                  </>
                )}
              </div>
              <div className="md:col-span-2">
                <label htmlFor="facility-ward" className="mb-2">
                  Ward
                  <span className="text-red-500">{" *"}</span>
                </label>
                {isWardLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <>
                    <SelectMenuV2
                      id="facility-ward"
                      placeholder="Choose Ward"
                      options={ward
                        .sort((a, b) => a.number - b.number)
                        .map((e) => {
                          return { id: e.id, name: e.number + ": " + e.name };
                        })}
                      optionLabel={(o) => o.name}
                      optionValue={(o) => o.id}
                      value={state.form.ward}
                      onChange={(e) => {
                        if (e) {
                          return [handleValueChange(e, "ward")];
                        }
                      }}
                    />
                    <ErrorHelperText error={state.errors.ward} />
                  </>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="facility-address" className="mb-2">
                  Address
                  <span className="text-red-500">{" *"}</span>
                </label>
                <TextAreaFormField
                  id="facility-address"
                  name="address"
                  required
                  onChange={handleChange}
                  value={state.form.address}
                  error={state.errors.address}
                />
              </div>
              <div>
                <label htmlFor="facility-pincode" className="mb-2">
                  Pincode
                  <span className="text-red-500">{" *"}</span>
                </label>
                <TextFormField
                  id="facility-pincode"
                  name="pincode"
                  required
                  onChange={handleChange}
                  value={state.form.pincode}
                  error={state.errors.pincode}
                />
              </div>
              <div>
                <label htmlFor="facility-tel" className="mb-1">
                  Emergency Contact Number
                  <span className="text-red-500">{" *"}</span>
                </label>
                <PhoneNumberField
                  value={state.form.phone_number}
                  onChange={(value: string) =>
                    handleValueChange(value, "phone_number")
                  }
                  errors={state.errors.phone_number}
                  onlyIndia={true}
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 xl:grid-cols-2 gap-4 py-4">
                <div className="grid vs:grid-cols-2 grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="facility-oxygen_capacity" className="mb-2">
                      Liquid Oxygen Capacity
                      <span className="text-red-500">{" *"}</span>
                    </label>
                    <TextFormField
                      id="facility-oxygen_capacity"
                      name="oxygen_capacity"
                      type="number"
                      required
                      onChange={(e) => handleValueChange(e.value, e.name)}
                      value={String(state.form.oxygen_capacity)}
                      errorClassName="hidden"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="facility-expected_oxygen_requirement"
                      className="mb-2"
                    >
                      Expected Burn Rate
                      <span className="text-red-500">{" *"}</span>
                    </label>
                    <TextFormField
                      id="facility-expected_oxygen_requirement"
                      name="expected_oxygen_requirement"
                      type="number"
                      required
                      placeholder="Litres / day"
                      onChange={handleChange}
                      value={String(state.form.expected_oxygen_requirement)}
                      error={state.errors.expected_oxygen_requirement}
                    />
                  </div>
                </div>

                <div className="grid vs:grid-cols-2 grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="facility-type_b_cylinders" className="mb-2">
                      B Type Cylinders
                      <span className="text-red-500">{" *"}</span>
                    </label>
                    <TextFormField
                      id="facility-type_b_cylinders"
                      name="type_b_cylinders"
                      type="number"
                      required
                      onChange={handleChange}
                      value={String(state.form.type_b_cylinders)}
                      error={state.errors.type_b_cylinders}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="facility-expected_type_b_cylinders"
                      className="mb-2"
                    >
                      Expected Burn Rate
                      <span className="text-red-500">{" *"}</span>
                    </label>
                    <TextFormField
                      id="facility-expected_type_b_cylinders"
                      name="expected_type_b_cylinders"
                      type="number"
                      required
                      placeholder="Cylinders / day"
                      onChange={handleChange}
                      value={String(state.form.expected_type_b_cylinders)}
                      error={state.errors.expected_type_b_cylinders}
                    />
                  </div>
                </div>

                <div className="grid vs:grid-cols-2 grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="facility-type_c_cylinders" className="mb-2">
                      C Type Cylinders
                      <span className="text-red-500">{" *"}</span>
                    </label>
                    <TextFormField
                      id="facility-type_c_cylinders"
                      name="type_c_cylinders"
                      type="number"
                      required
                      onChange={handleChange}
                      value={String(state.form.type_c_cylinders)}
                      error={state.errors.type_c_cylinders}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="facility-expected_type_c_cylinders"
                      className="mb-2"
                    >
                      Expected Burn Rate
                      <span className="text-red-500">{" *"}</span>
                    </label>
                    <TextFormField
                      id="facility-expected_type_c_cylinders"
                      name="expected_type_c_cylinders"
                      type="number"
                      required
                      placeholder="Cylinders / day"
                      onChange={handleChange}
                      value={String(state.form.expected_type_c_cylinders)}
                      error={state.errors.expected_type_c_cylinders}
                    />
                  </div>
                </div>

                <div className="grid vs:grid-cols-2 grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="facility-type_d_cylinders" className="mb-2">
                      D Type Cylinders
                      <span className="text-red-500">{" *"}</span>
                    </label>
                    <TextFormField
                      id="facility-type_d_cylinders"
                      name="type_d_cylinders"
                      type="number"
                      required
                      onChange={handleChange}
                      value={String(state.form.type_d_cylinders)}
                      error={state.errors.type_d_cylinders}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="facility-expected_type_d_cylinders"
                      className="mb-2"
                    >
                      Expected Burn Rate
                      <span className="text-red-500">{" *"}</span>
                    </label>
                    <TextFormField
                      id="facility-expected_type_d_cylinders"
                      name="expected_type_d_cylinders"
                      type="number"
                      required
                      placeholder="Cylinders / day"
                      onChange={handleChange}
                      value={String(state.form.expected_type_d_cylinders)}
                      error={state.errors.expected_type_d_cylinders}
                    />
                  </div>
                </div>
              </div>

              {KASP_ENABLED && (
                <div>
                  <label htmlFor="facility-kasp_empanelled" className="mb-2">
                    Is this facility {KASP_STRING} empanelled?
                  </label>
                  <RadioInputsV2
                    name="kasp_empanelled"
                    selected={state.form.kasp_empanelled}
                    onSelect={(value) =>
                      handleValueChange(value, "kasp_empanelled")
                    }
                    error={state.errors.kasp_empanelled}
                    options={[
                      { label: "Yes", value: "true" },
                      { label: "No", value: "false" },
                    ]}
                  />
                </div>
              )}
            </div>
            <div
              className={`${
                isExtremeSmallScreen
                  ? " grid grid-cols-1 "
                  : " flex items-center "
              } -mx-2`}
            >
              <div className="flex-1 px-2">
                <label className="mb-2">Location</label>
                <TextFormField
                  name="latitude"
                  placeholder="Latitude"
                  value={state.form.latitude}
                  onChange={handleChange}
                  error={state.errors.latitude}
                />
              </div>
              <div className="">
                <IconButton
                  id="facility-location-button"
                  onClick={(event) => setAnchorEl(event.currentTarget)}
                >
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
                  <GLocationPicker
                    lat={Number(state.form.latitude)}
                    lng={Number(state.form.longitude)}
                    handleOnChange={handleLocationChange}
                    handleOnClose={handleClose}
                    handleOnSelectCurrentLocation={handleSelectCurrentLocation}
                  />
                </Popover>
              </div>
              <div className="flex-1 px-2">
                <label className="mb-1">&nbsp;</label>
                <TextFormField
                  name="longitude"
                  placeholder="Longitude"
                  value={state.form.longitude}
                  onChange={handleChange}
                  error={state.errors.longitude}
                />
              </div>
            </div>
            <div
              className={`${
                isExtremeSmallScreen
                  ? " grid grid-cols-1 "
                  : " flex justify-between "
              } mt-2 gap-2 `}
            >
              <ButtonV2
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault();
                  goBack();
                }}
              >
                Cancel
              </ButtonV2>
              <ButtonV2
                id="facility-save"
                variant="primary"
                type="submit"
                onClick={(e) => handleSubmit(e)}
              >
                <i className="fa-regular fa-circle-check"></i> {buttonText}
              </ButtonV2>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
