import * as Notification from "../../Utils/Notifications.js";

import ButtonV2, { Cancel, Submit } from "../Common/components/ButtonV2";
import { CapacityModal, DoctorModal } from "./models";
import { DraftSection, useAutoSaveReducer } from "../../Utils/AutoSave.js";
import {
  FACILITY_FEATURE_TYPES,
  FACILITY_TYPES,
  getBedTypes,
} from "../../Common/constants";
import {
  MultiSelectFormField,
  SelectFormField,
} from "../Form/FormFields/SelectFormField";
import { Popover, Transition } from "@headlessui/react";
import { Fragment, lazy, useCallback, useState } from "react";
import Steps, { Step } from "../Common/Steps";
import {
  createFacility,
  getDistrictByState,
  getLocalbodyByDistrict,
  getPermittedFacility,
  getStates,
  getWardByLocalBody,
  listCapacity,
  listDoctor,
  updateFacility,
} from "../../Redux/actions";
import { getPincodeDetails, includesIgnoreCase } from "../../Utils/utils";
import {
  phonePreg,
  validateLatitude,
  validateLongitude,
  validatePincode,
} from "../../Common/validation";
import { statusType, useAbortableEffect } from "../../Common/utils";

import { BedCapacity } from "./BedCapacity";
import BedTypeCard from "./BedTypeCard";
import Card from "../../CAREUI/display/Card.js";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { DoctorCapacity } from "./DoctorCapacity";
import DoctorsCountCard from "./DoctorsCountCard";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
import { FormAction } from "../Form/Utils.js";
import GLocationPicker from "../Common/GLocationPicker";
import Page from "../Common/components/Page.js";
import PhoneNumberFormField from "../Form/FormFields/PhoneNumberFormField";
import RadioFormField from "../Form/FormFields/RadioFormField";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import TextFormField from "../Form/FormFields/TextFormField";

import { navigate } from "raviger";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import useAppHistory from "../../Common/hooks/useAppHistory";
import useConfig from "../../Common/hooks/useConfig";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";

const Loading = lazy(() => import("../Common/Loading"));

interface FacilityProps {
  facilityId?: string;
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
  oxygen_capacity?: number;
  type_b_cylinders?: number;
  type_c_cylinders?: number;
  type_d_cylinders?: number;
  expected_oxygen_requirement?: number;
  expected_type_b_cylinders?: number;
  expected_type_c_cylinders?: number;
  expected_type_d_cylinders?: number;
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
  oxygen_capacity: undefined,
  type_b_cylinders: undefined,
  type_c_cylinders: undefined,
  type_d_cylinders: undefined,
  expected_oxygen_requirement: undefined,
  expected_type_b_cylinders: undefined,
  expected_type_c_cylinders: undefined,
  expected_type_d_cylinders: undefined,
};

const initError: Record<keyof FacilityForm, string> = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" }))
);

const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};

const facilityCreateReducer = (state = initialState, action: FormAction) => {
  switch (action.type) {
    case "set_form":
      return { ...state, form: action.form };
    case "set_errors":
      return { ...state, errors: action.errors };
    case "set_state": {
      if (action.state) return action.state;
      return state;
    }
  }
};

export const FacilityCreate = (props: FacilityProps) => {
  const { t } = useTranslation();
  const { gov_data_api_key, kasp_string, kasp_enabled } = useConfig();
  const dispatchAction: any = useDispatch();
  const { facilityId } = props;

  const [state, dispatch] = useAutoSaveReducer<FacilityForm>(
    facilityCreateReducer,
    initialState
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isStateLoading, setIsStateLoading] = useState(false);
  const [isDistrictLoading, setIsDistrictLoading] = useState(false);
  const [isLocalbodyLoading, setIsLocalbodyLoading] = useState(false);
  const [isWardLoading, setIsWardLoading] = useState(false);
  const [states, setStates] = useState<StateObj[]>([]);
  const [districts, setDistricts] = useState<StateObj[]>([]);
  const [localBodies, setLocalBodies] = useState<StateObj[]>([]);
  const [ward, setWard] = useState<WardObj[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [createdFacilityId, setCreatedFacilityId] = useState("");
  const [showAutoFilledPincode, setShowAutoFilledPincode] = useState(false);
  const [capacityData, setCapacityData] = useState<Array<CapacityModal>>([]);
  const [doctorData, setDoctorData] = useState<Array<DoctorModal>>([]);
  const [bedCapacityKey, setBedCapacityKey] = useState(0);
  const [docCapacityKey, setDocCapacityKey] = useState(0);
  const { goBack } = useAppHistory();
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
        return districtList ? [...districtList.data] : [];
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

  const getSteps = (): Step[] => {
    return [
      {
        id: 1,
        name: "Facility details",
        onClick: () => {
          setCurrentStep(1);
        },
        status: currentStep === 1 ? "current" : "complete",
        disabled: currentStep > 1,
      },
      {
        id: 2,
        name: "Bed Capacity",
        onClick: () => {
          setCurrentStep(2);
        },
        status:
          currentStep === 2
            ? "current"
            : currentStep > 2
            ? "complete"
            : "upcoming",
        disabled: createdFacilityId == "",
      },
      {
        id: 3,
        name: "Doctor Capacity",
        onClick: () => {
          setCurrentStep(3);
        },
        disabled: createdFacilityId == "",
        status: currentStep === 3 ? "current" : "upcoming",
      },
    ];
  };

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

  const handleChange = (e: FieldChangeEvent<unknown>) => {
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

  const handlePincodeChange = async (e: FieldChangeEvent<string>) => {
    handleChange(e);

    if (!validatePincode(e.value)) return;

    const pincodeDetails = await getPincodeDetails(e.value, gov_data_api_key);
    if (!pincodeDetails) return;

    const matchedState = states.find((state) => {
      return includesIgnoreCase(state.name, pincodeDetails.statename);
    });
    if (!matchedState) return;

    const fetchedDistricts = await fetchDistricts(matchedState.id);
    if (!fetchedDistricts) return;

    const matchedDistrict = fetchedDistricts.find((district) => {
      return includesIgnoreCase(district.name, pincodeDetails.district);
    });
    if (!matchedDistrict) return;

    dispatch({
      type: "set_form",
      form: {
        ...state.form,
        state: matchedState.id,
        district: matchedDistrict.id,
        pincode: e.value,
      },
    });

    fetchLocalBody(matchedDistrict.id);
    setShowAutoFilledPincode(true);
    setTimeout(() => {
      setShowAutoFilledPincode(false);
    }, 2000);
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

  const validateForm = () => {
    const errors = { ...initError };
    let invalidForm = false;
    Object.keys(state.form).forEach((field) => {
      switch (field) {
        case "name":
        case "address":
          if (!state.form[field]) {
            errors[field] = t("required");
            invalidForm = true;
          }
          return;

        case "district":
        case "state":
        case "local_body":
        case "ward":
          if (!Number(state.form[field])) {
            errors[field] = t("required");
            invalidForm = true;
          }
          return;

        case "pincode":
          if (!validatePincode(state.form[field])) {
            errors[field] = t("invalid_pincode");
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
            errors[field] = t("invalid_phone_number");
            invalidForm = true;
          }
          return;
        case "latitude":
          if (!!state.form.latitude && !validateLatitude(state.form[field])) {
            errors[field] = t("latitude_invalid");
            invalidForm = true;
          }
          return;
        case "longitude":
          if (!!state.form.longitude && !validateLongitude(state.form[field])) {
            errors[field] = t("longitude_invalid");
            invalidForm = true;
          }
          return;

        default:
          return;
      }
    });
    if (invalidForm) {
      dispatch({ type: "set_errors", errors });
      return false;
    }
    dispatch({ type: "set_errors", errors });
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
          setCreatedFacilityId(id);
          setCurrentStep(2);
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

  let capacityList: any = null;
  let totalBedCount = 0;
  let totalOccupiedBedCount = 0;

  if (!capacityData || !capacityData.length) {
    capacityList = (
      <h5 className="mt-4 flex w-full items-center justify-center rounded-lg bg-white p-4 text-xl font-bold text-gray-500 shadow">
        {t("no_bed_types_found")}
      </h5>
    );
  } else {
    capacityData.forEach((x) => {
      totalBedCount += x.total_capacity ? x.total_capacity : 0;
      totalOccupiedBedCount += x.current_capacity ? x.current_capacity : 0;
    });

    capacityList = (
      <div className="mt-4 grid w-full gap-7 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <BedTypeCard
          label={t("total_beds")}
          bedCapacityId={0}
          used={totalOccupiedBedCount}
          total={totalBedCount}
          handleUpdate={() => {
            return;
          }}
        />
        {getBedTypes({ kasp_string, kasp_enabled }).map((x) => {
          const res = capacityData.find((data) => {
            return data.room_type === x.id;
          });
          if (res) {
            const removeCurrentBedType = (bedTypeId: number | undefined) => {
              setCapacityData((state) =>
                state.filter((i) => i.id !== bedTypeId)
              );
              setBedCapacityKey((bedCapacityKey) => bedCapacityKey + 1);
            };
            return (
              <BedTypeCard
                facilityId={createdFacilityId}
                bedCapacityId={res.id}
                key={`bed_${res.id}`}
                room_type={res.room_type}
                label={x.text}
                used={res.current_capacity || 0}
                total={res.total_capacity || 0}
                lastUpdated={res.modified_date}
                removeBedType={removeCurrentBedType}
                handleUpdate={async () => {
                  const capacityRes = await dispatchAction(
                    listCapacity({}, { facilityId: createdFacilityId })
                  );
                  if (capacityRes && capacityRes.data) {
                    setCapacityData(capacityRes.data.results);
                  }
                }}
              />
            );
          }
        })}
      </div>
    );
  }
  let doctorList: any = null;
  if (!doctorData || !doctorData.length) {
    doctorList = (
      <h5 className="flex w-full items-center justify-center rounded-lg bg-white p-4 text-xl font-bold text-gray-500 shadow">
        {t("no_doctors")}
      </h5>
    );
  } else {
    doctorList = (
      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {doctorData.map((data: DoctorModal) => {
          const removeCurrentDoctorData = (doctorId: number | undefined) => {
            setDoctorData((state) =>
              state.filter((i: DoctorModal) => i.id !== doctorId)
            );
            setDocCapacityKey((docCapacityKey) => docCapacityKey + 1);
          };

          return (
            <DoctorsCountCard
              facilityId={createdFacilityId || ""}
              key={`bed_${data.id}`}
              handleUpdate={async () => {
                const doctorRes = await dispatchAction(
                  listDoctor({}, { facilityId: createdFacilityId })
                );
                if (doctorRes && doctorRes.data) {
                  setDoctorData(doctorRes.data.results);
                }
              }}
              {...data}
              removeDoctor={removeCurrentDoctorData}
            />
          );
        })}
      </div>
    );
  }

  const field = (name: string) => {
    return {
      name,
      id: name,
      label: t(name),
      value: (state.form as any)[name],
      error: (state.errors as any)[name],
      onChange: handleChange,
    };
  };

  switch (currentStep) {
    case 3:
      return (
        <Page
          title={headerText}
          crumbsReplacements={{
            [createdFacilityId || "????"]: { name: state.form.name },
          }}
        >
          <Steps steps={getSteps()} />
          <div className="mt-3">
            <DoctorCapacity
              key={docCapacityKey}
              className="mx-auto w-full max-w-2xl"
              facilityId={createdFacilityId || ""}
              handleClose={() => {
                navigate(`/facility/${createdFacilityId}`);
              }}
              handleUpdate={async () => {
                const doctorRes = await dispatchAction(
                  listDoctor({}, { facilityId: createdFacilityId })
                );
                if (doctorRes && doctorRes.data) {
                  setDoctorData(doctorRes.data.results);
                }
              }}
            />
          </div>
          <div className="mt-5 rounded bg-white p-3 shadow-sm md:p-6">
            <div className="justify-between md:flex md:pb-2">
              <div className="mb-2 text-xl font-bold">{t("doctors_list")}</div>
            </div>
            <div className="mt-4">{doctorList}</div>
          </div>
        </Page>
      );
    case 2:
      return (
        <Page
          title={headerText}
          crumbsReplacements={{
            [createdFacilityId || "????"]: { name: state.form.name },
          }}
        >
          <Steps steps={getSteps()} />
          <div className="mt-3">
            <BedCapacity
              key={bedCapacityKey}
              className="mx-auto w-full max-w-2xl"
              facilityId={createdFacilityId || ""}
              handleClose={() => {
                setCurrentStep(3);
              }}
              handleUpdate={async () => {
                const capacityRes = await dispatchAction(
                  listCapacity({}, { facilityId: createdFacilityId })
                );
                if (capacityRes && capacityRes.data) {
                  setCapacityData(capacityRes.data.results);
                }
              }}
            />
          </div>
          <div className="mt-5 rounded bg-white p-3 shadow-sm md:p-6">
            <div className="justify-between md:flex  md:border-b md:pb-2">
              <div className="mb-2 text-xl font-semibold">
                {t("bed_capacity")}
              </div>
            </div>
            <div>{capacityList}</div>
          </div>
        </Page>
      );
    case 1:
    default:
      return (
        <Page
          title={headerText}
          crumbsReplacements={{
            [facilityId || "????"]: { name: state.form.name },
          }}
        >
          {!facilityId && <Steps steps={getSteps()} />}
          <Card className="mt-4">
            <div className="md:p-4">
              <form onSubmit={(e) => handleSubmit(e)}>
                <DraftSection
                  handleDraftSelect={(newState: any) => {
                    dispatch({ type: "set_state", state: newState });
                    Promise.all([
                      fetchDistricts(newState.form.state),
                      fetchLocalBody(newState.form.district),
                      fetchWards(newState.form.local_body),
                    ]);
                  }}
                  formData={state.form}
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SelectFormField
                    {...field("facility_type")}
                    required
                    options={FACILITY_TYPES}
                    optionLabel={(o) => o.text}
                    optionValue={(o) => o.text}
                  />
                  <TextFormField
                    {...field("name")}
                    required
                    label={t("facility_name")}
                  />
                  <MultiSelectFormField
                    {...field("features")}
                    placeholder={t("features")}
                    options={FACILITY_FEATURE_TYPES}
                    optionLabel={(o) => o.name}
                    optionValue={(o) => o.id}
                  />
                  <div>
                    <TextFormField
                      {...field("pincode")}
                      required
                      onChange={handlePincodeChange}
                    />
                    {showAutoFilledPincode && (
                      <div className="flex items-center gap-2 text-primary-500">
                        <CareIcon className="care-l-check-circle" />
                        <span className="text-sm">
                          State and district auto-filled from pincode
                        </span>
                      </div>
                    )}
                  </div>
                  <SelectFormField
                    {...field("state")}
                    required
                    placeholder="Choose State"
                    className={isStateLoading ? "animate-pulse" : ""}
                    disabled={isStateLoading}
                    options={states}
                    optionLabel={(o) => o.name}
                    optionValue={(o) => o.id}
                    onChange={(event) => {
                      handleChange(event);
                      if (!event) return;
                      fetchDistricts(event.value);
                    }}
                  />
                  <SelectFormField
                    {...field("district")}
                    placeholder="Choose District"
                    required
                    className={isDistrictLoading ? "animate-pulse" : ""}
                    disabled={isDistrictLoading}
                    options={districts}
                    optionLabel={(o) => o.name}
                    optionValue={(o) => o.id}
                    onChange={(event) => {
                      handleChange(event);
                      if (!event) return;
                      fetchLocalBody(event.value);
                    }}
                  />
                  <SelectFormField
                    {...field("local_body")}
                    required
                    className={isLocalbodyLoading ? "animate-pulse" : ""}
                    disabled={isLocalbodyLoading}
                    placeholder="Choose Local Body"
                    options={localBodies}
                    optionLabel={(o) => o.name}
                    optionValue={(o) => o.id}
                    onChange={(event) => {
                      handleChange(event);
                      if (!event) return;
                      fetchWards(event.value);
                    }}
                  />
                  <SelectFormField
                    {...field("ward")}
                    required
                    className={isWardLoading ? "animate-pulse" : ""}
                    disabled={isWardLoading}
                    placeholder="Choose Ward"
                    options={ward
                      .sort((a, b) => a.number - b.number)
                      .map((e) => {
                        return {
                          id: e.id,
                          name: e.number + ": " + e.name,
                        };
                      })}
                    optionLabel={(o) => o.name}
                    optionValue={(o) => o.id}
                  />
                  <TextAreaFormField {...field("address")} required />
                  <PhoneNumberFormField
                    {...field("phone_number")}
                    label={t("emergency_contact_number")}
                    required
                    types={["mobile", "landline"]}
                  />
                  <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2 md:col-span-2 xl:grid-cols-4">
                    <TextFormField
                      {...field("oxygen_capacity")}
                      type="number"
                      placeholder="0"
                      label={t("liquid_oxygen_capacity")}
                      trailingPadding=" "
                      trailing={<FieldUnit unit={t("litres")} />}
                      min={0}
                    />
                    <TextFormField
                      {...field("expected_oxygen_requirement")}
                      type="number"
                      placeholder="0"
                      trailingPadding=" "
                      trailing={<FieldUnit unit={t("litres_per_day")} />}
                      label={t("expected_burn_rate")}
                      min={0}
                    />

                    <TextFormField
                      {...field("type_b_cylinders")}
                      type="number"
                      placeholder="0"
                      trailingPadding=" "
                      trailing={<FieldUnit unit={t("cylinders")} />}
                      min={0}
                    />
                    <TextFormField
                      {...field("expected_type_b_cylinders")}
                      type="number"
                      placeholder="0"
                      label={t("expected_burn_rate")}
                      trailingPadding=" "
                      trailing={<FieldUnit unit={t("cylinders_per_day")} />}
                      min={0}
                    />
                    <TextFormField
                      {...field("type_c_cylinders")}
                      type="number"
                      placeholder="0"
                      trailingPadding=" "
                      trailing={<FieldUnit unit={t("cylinders")} />}
                      min={0}
                    />
                    <TextFormField
                      {...field("expected_type_c_cylinders")}
                      type="number"
                      placeholder="0"
                      trailingPadding=" "
                      trailing={<FieldUnit unit={t("cylinders_per_day")} />}
                      label={t("expected_burn_rate")}
                      min={0}
                    />
                    <TextFormField
                      {...field("type_d_cylinders")}
                      type="number"
                      placeholder="0"
                      trailingPadding=" "
                      trailing={<FieldUnit unit={t("cylinders")} />}
                      min={0}
                    />
                    <TextFormField
                      {...field("expected_type_d_cylinders")}
                      type="number"
                      placeholder="0"
                      label={t("expected_burn_rate")}
                      trailingPadding=" "
                      trailing={<FieldUnit unit={t("cylinders_per_day")} />}
                      min={0}
                    />
                  </div>

                  {kasp_enabled && (
                    <RadioFormField
                      {...field("kasp_empanelled")}
                      label={`Is this facility ${kasp_string} empanelled?`}
                      options={[true, false]}
                      optionDisplay={(o) => (o ? "Yes" : "No")}
                      optionValue={(o) => String(o)}
                    />
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <TextFormField
                    className="flex-1"
                    {...field("latitude")}
                    label={t("location")}
                    placeholder="Latitude"
                  />

                  <div className="flex flex-col justify-center md:block">
                    <Popover id="map-popover" className="relative">
                      <>
                        <Popover.Button>
                          <ButtonV2
                            circle
                            type="button"
                            id="facility-location-button"
                            className="tooltip p-2"
                          >
                            <CareIcon className="care-l-map-marker text-xl" />
                            <span className="tooltip-text tooltip-bottom">
                              Select location from map
                            </span>
                          </ButtonV2>
                        </Popover.Button>

                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-200"
                          enterFrom="opacity-0 translate-y-1"
                          enterTo="opacity-100 translate-y-0"
                          leave="transition ease-in duration-150"
                          leaveFrom="opacity-100 translate-y-0"
                          leaveTo="opacity-0 translate-y-1"
                        >
                          <Popover.Panel className="absolute -right-40 bottom-10 sm:-right-48">
                            <GLocationPicker
                              lat={Number(state.form.latitude)}
                              lng={Number(state.form.longitude)}
                              handleOnChange={handleLocationChange}
                              handleOnClose={() => null}
                              handleOnSelectCurrentLocation={
                                handleSelectCurrentLocation
                              }
                            />
                          </Popover.Panel>
                        </Transition>
                      </>
                    </Popover>
                  </div>
                  <TextFormField
                    className="flex-1"
                    {...field("longitude")}
                    label={<br />}
                    placeholder="Longitude"
                  />
                </div>
                <div className="mt-12 flex flex-col-reverse justify-end gap-3 sm:flex-row">
                  <Cancel onClick={() => goBack()} />
                  <Submit
                    type="button"
                    onClick={handleSubmit}
                    label={buttonText}
                  />
                </div>
              </form>
            </div>
          </Card>
        </Page>
      );
  }
};

const FieldUnit = ({ unit }: { unit: string }) => {
  return <p className="mr-8 text-xs text-gray-700">{unit}</p>;
};
