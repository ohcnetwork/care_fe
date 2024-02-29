import * as Notification from "../../Utils/Notifications.js";

import ButtonV2, { Cancel, Submit } from "../Common/components/ButtonV2";
import {
  CapacityModal,
  DistrictModel,
  DoctorModal,
  FacilityRequest,
  FacilityModel,
} from "./models";
import { DraftSection, useAutoSaveReducer } from "../../Utils/AutoSave.js";
import { useMessageListener } from "../../Common/hooks/useMessageListener";

import {
  FACILITY_FEATURE_TYPES,
  FACILITY_TYPES,
  getBedTypes,
  USER_TYPES,
} from "../../Common/constants";
import {
  MultiSelectFormField,
  SelectFormField,
} from "../Form/FormFields/SelectFormField";
import { Popover, Transition } from "@headlessui/react";
import { Fragment, lazy, useState } from "react";
import Steps, { Step } from "../Common/Steps";
import {
  getPincodeDetails,
  includesIgnoreCase,
  parsePhoneNumber,
  compareBy,
} from "../../Utils/utils";
import {
  phonePreg,
  validateLatitude,
  validateLongitude,
  validatePincode,
} from "../../Common/validation";

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
import CoverImageEditModal from "./CoverImageEditModal";
import useAuthUser from "../../Common/hooks/useAuthUser.js";


import { navigate } from "raviger";
import useAppHistory from "../../Common/hooks/useAppHistory";
import useConfig from "../../Common/hooks/useConfig";
import { useTranslation } from "react-i18next";
import { PhoneNumberValidator } from "../Form/FieldValidators.js";
import request from "../../Utils/request/request.js";
import routes from "../../Redux/api.js";
import useQuery from "../../Utils/request/useQuery.js";
import { RequestResult } from "../../Utils/request/types.js";

const Loading = lazy(() => import("../Common/Loading"));

interface FacilityProps {
  facilityId?: string;
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
  const { facilityId } = props;
  const { t } = useTranslation();
  const { gov_data_api_key, kasp_string, kasp_enabled } = useConfig();
  const [state, dispatch] = useAutoSaveReducer<FacilityForm>(
    facilityCreateReducer,
    initialState
  );
  const [isLoading1, setIsLoading1] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [createdFacilityId, setCreatedFacilityId] = useState("");
  const [showAutoFilledPincode, setShowAutoFilledPincode] = useState(false);
  const [capacityData, setCapacityData] = useState<Array<CapacityModal>>([]);
  const [doctorData, setDoctorData] = useState<Array<DoctorModal>>([]);
  const [bedCapacityKey, setBedCapacityKey] = useState(0);
  const [docCapacityKey, setDocCapacityKey] = useState(0);
  const [stateId, setStateId] = useState<number>();
  const [districtId, setDistrictId] = useState<number>();
  const [localBodyId, setLocalBodyId] = useState<number>();
  const { goBack } = useAppHistory();
  const headerText = !facilityId ? "Create Facility" : "Update Facility";
  const buttonText = !facilityId ? "Save Facility" : "Update Facility";
  const [imageKey, setImageKey] = useState(Date.now());
  const [editCoverImage, setEditCoverImage] = useState(false);
  const authUser = useAuthUser();
  useMessageListener((data) => console.log(data));

  const {
    data: facilityData,
    loading: isLoading,
    refetch: facilityFetch,
  } = useQuery(routes.getPermittedFacility, {
    pathParams: {
      id: facilityId || "",
    },
    onResponse: ({ res }) => {
      if (!res?.ok) {
        navigate("/not-found");
      }
    },
  });

  const hasCoverImage = !!facilityData?.read_cover_image_url;

  const StaffUserTypeIndex = USER_TYPES.findIndex((type) => type === "Staff");
  const hasPermissionToEditCoverImage =
    !(authUser.user_type as string).includes("ReadOnly") &&
    USER_TYPES.findIndex((type) => type == authUser.user_type) >=
    StaffUserTypeIndex;
  // const hasPermissionToDeleteFacility =
  //   authUser.user_type === "DistrictAdmin" ||
  //   authUser.user_type === "StateAdmin";

  const editCoverImageTooltip = hasPermissionToEditCoverImage && (
    <div
      id="facility-coverimage"
      className="absolute right-0 top-0 z-10 flex h-full w-full flex-col items-center justify-center bg-black text-sm text-gray-300 opacity-0 transition-[opacity] hover:opacity-60 md:h-[88px]"
    >
      <CareIcon icon="l-pen" className="text-lg" />
      <span className="mt-2">{`${hasCoverImage ? "Edit" : "Upload"}`}</span>
    </div>
  );


  const CoverImage = () => (
    <img
      src={`${facilityData?.read_cover_image_url}?imgKey=${imageKey}`}
      alt={facilityData?.name}
      className="h-full w-full object-cover"
    />
  );
  const {
    data: districtData,
    refetch: districtFetch,
    loading: isDistrictLoading,
  } = useQuery(routes.getDistrictByState, {
    pathParams: {
      id: String(stateId),
    },
    prefetch: !!stateId,
  });

  const { data: localbodyData, loading: isLocalbodyLoading } = useQuery(
    routes.getLocalbodyByDistrict,
    {
      pathParams: {
        id: String(districtId),
      },
      prefetch: !!districtId,
    }
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

  const { data: wardData, loading: isWardLoading } = useQuery(
    routes.getWardByLocalBody,
    {
      pathParams: {
        id: String(localBodyId),
      },
      prefetch: !!localBodyId,
    }
  );

  useQuery(routes.getPermittedFacility, {
    pathParams: {
      id: facilityId!,
    },
    prefetch: !!facilityId,
    onResponse: ({ res, data }) => {
      if (facilityId) {
        setIsLoading1(true);
        if (res?.ok && data) {
          const formData = {
            facility_type: data.facility_type ? data.facility_type : "",
            name: data.name ? data.name : "",
            state: data.state ? data.state : 0,
            district: data.district ? data.district : 0,
            local_body: data.local_body ? data.local_body : 0,
            features: data.features || [],
            ward: data.ward_object ? data.ward_object.id : 0,
            kasp_empanelled: "",
            address: data.address ? data.address : "",
            pincode: data.pincode ? data.pincode : "",
            phone_number: data.phone_number
              ? data.phone_number.length == 10
                ? "+91" + data.phone_number
                : data.phone_number
              : "",
            latitude: data.latitude ? parseFloat(data.latitude).toFixed(7) : "",
            longitude: data.longitude
              ? parseFloat(data.longitude).toFixed(7)
              : "",
            type_b_cylinders: data.type_b_cylinders,
            type_c_cylinders: data.type_c_cylinders,
            type_d_cylinders: data.type_d_cylinders,
            expected_type_b_cylinders: data.expected_type_b_cylinders,
            expected_type_c_cylinders: data.expected_type_c_cylinders,
            expected_type_d_cylinders: data.expected_type_d_cylinders,
            expected_oxygen_requirement: data.expected_oxygen_requirement,
            oxygen_capacity: data.oxygen_capacity,
          };
          dispatch({ type: "set_form", form: formData });
          setStateId(data.state);
          setDistrictId(data.district);
          setLocalBodyId(data.local_body);
        } else {
          navigate(`/facility/${facilityId}`);
        }
        setIsLoading1(false);
      }
    },
  });

  const { data: stateData, loading: isStateLoading } = useQuery(
    routes.statesList
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
          latitude: location.lat().toFixed(7),
          longitude: location.lng().toFixed(7),
        },
      });
    }
  };

  const handlePincodeChange = async (e: FieldChangeEvent<string>) => {
    handleChange(e);

    if (!validatePincode(e.value)) return;

    const pincodeDetails = await getPincodeDetails(e.value, gov_data_api_key);
    if (!pincodeDetails) return;

    const matchedState = (stateData ? stateData.results : []).find((state) => {
      return includesIgnoreCase(state.name, pincodeDetails.statename);
    });
    if (!matchedState) return;

    const newDistrictDataResult: RequestResult<DistrictModel[]> =
      await districtFetch({ pathParams: { id: String(matchedState.id) } });
    const fetchedDistricts: DistrictModel[] = newDistrictDataResult.data || [];

    if (!fetchedDistricts) return;

    const matchedDistrict = fetchedDistricts.find((district) => {
      return includesIgnoreCase(district.name, pincodeDetails.districtname);
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

    setDistrictId(matchedDistrict.id);
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
          const phoneNumber = state.form[field];
          if (
            !phoneNumber ||
            !PhoneNumberValidator()(phoneNumber) === undefined ||
            !phonePreg(phoneNumber)
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
      setIsLoading1(true);
      const data: FacilityRequest = {
        facility_type: state.form.facility_type,
        name: state.form.name,
        district: state.form.district,
        state: state.form.state,
        address: state.form.address,
        local_body: state.form.local_body,
        features: state.form.features,
        ward: state.form.ward,
        pincode: state.form.pincode,
        latitude: state.form.latitude,
        longitude: state.form.longitude,
        phone_number: parsePhoneNumber(state.form.phone_number),
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

      const { res, data: requestData } = facilityId
        ? await request(routes.updateFacility, {
          body: data,
          pathParams: {
            id: facilityId,
          },
        })
        : await request(routes.createFacility, {
          body: data,
        });

      if (res?.ok && requestData) {
        const id = requestData.id;
        dispatch({ type: "set_form", form: initForm });
        if (!facilityId) {
          Notification.Success({
            msg: "Facility added successfully",
          });
          setCreatedFacilityId(String(id));
          setCurrentStep(2);
        } else {
          Notification.Success({
            msg: "Facility updated successfully",
          });
          navigate(`/facility/${facilityId}`);
        }
      }
      setIsLoading1(false);
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
      <div
        className="mt-4 grid w-full gap-7 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        id="total-bed-capacity"
      >
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
                  const { res, data } = await request(routes.getCapacity, {
                    pathParams: { facilityId: createdFacilityId },
                  });
                  if (res?.ok && data) {
                    setCapacityData(data.results);
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
                const { res, data } = await request(routes.listDoctor, {
                  pathParams: { facilityId: createdFacilityId },
                });
                if (res?.ok && data) {
                  setDoctorData(data.results);
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
                const { res, data } = await request(routes.listDoctor, {
                  pathParams: { facilityId: createdFacilityId },
                });
                if (res?.ok && data) {
                  setDoctorData(data.results);
                }
              }}
            />
          </div>
          <div className="mt-5 rounded bg-white p-3 shadow-sm md:p-6">
            <div className="justify-between md:flex md:pb-2">
              <div className="mb-2 text-xl font-bold">{t("doctors_list")}</div>
            </div>
            <div className="mt-4" id="total-doctor-capacity">
              {doctorList}
            </div>
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
                const { res, data } = await request(routes.getCapacity, {
                  pathParams: { facilityId: createdFacilityId },
                });
                if (res?.ok && data) {
                  setCapacityData(data.results);
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
                    setStateId(newState.form.state);
                    setDistrictId(newState.form.district);
                    setLocalBodyId(newState.form.local_body);
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
                    options={stateData ? stateData.results : []}
                    optionLabel={(o) => o.name}
                    optionValue={(o) => o.id}
                    onChange={(event) => {
                      handleChange(event);
                      if (!event) return;
                      setStateId(event.value);
                    }}
                  />
                  <SelectFormField
                    {...field("district")}
                    placeholder="Choose District"
                    required
                    className={isDistrictLoading ? "animate-pulse" : ""}
                    disabled={isDistrictLoading}
                    options={districtData ? districtData : []}
                    optionLabel={(o) => o.name}
                    optionValue={(o) => o.id}
                    onChange={(event) => {
                      handleChange(event);
                      if (!event) return;
                      setDistrictId(event.value);
                    }}
                  />
                  <SelectFormField
                    {...field("local_body")}
                    required
                    className={isLocalbodyLoading ? "animate-pulse" : ""}
                    disabled={isLocalbodyLoading}
                    placeholder="Choose Local Body"
                    options={localbodyData ? localbodyData : []}
                    optionLabel={(o) => o.name}
                    optionValue={(o) => o.id}
                    onChange={(event) => {
                      handleChange(event);
                      if (!event) return;
                      setLocalBodyId(event.value);
                    }}
                  />
                  <SelectFormField
                    {...field("ward")}
                    required
                    className={isWardLoading ? "animate-pulse" : ""}
                    disabled={isWardLoading}
                    placeholder="Choose Ward"
                    options={(wardData ? wardData.results : [])
                      .sort(compareBy("number"))
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
                  <p>Upload Cover Image</p>
                  <CoverImageEditModal
                    open={editCoverImage}
                    onSave={() =>
                      facilityData?.read_cover_image_url
                        ? setImageKey(Date.now())
                        : facilityFetch()
                    }
                    onClose={() => setEditCoverImage(false)}
                    onDelete={() => facilityFetch()}
                    facility={facilityData ?? ({} as FacilityModel)}
                  />
                  {hasCoverImage ? (
                    <div
                      className={
                        "group relative h-48 w-full text-clip rounded-t bg-gray-200 opacity-100 transition-all duration-200 ease-in-out md:h-0 md:opacity-0"
                      }
                    >
                      <CoverImage />
                      {editCoverImageTooltip}
                    </div>
                  ) : (
                    <div
                      className={`group relative z-0 flex w-full shrink-0 items-center justify-center self-stretch bg-gray-300 md:hidden ${hasPermissionToEditCoverImage && "cursor-pointer"
                        }`}
                      onClick={() =>
                        hasPermissionToEditCoverImage && setEditCoverImage(true)
                      }
                    >
                      <CareIcon
                        icon="l-hospital"
                        className="block p-10 text-4xl text-gray-500"
                        aria-hidden="true"
                      />
                      {editCoverImageTooltip}
                    </div>
                  )}
                  {/* <div className="items-center justify-center">Upload Cover Image</div> */}
                  <div
                    className={`group relative hidden h-[88px] w-[88px] text-clip rounded transition-all duration-200 ease-in-out md:flex ${hasPermissionToEditCoverImage && "cursor-pointer"
                      }`}
                    onClick={() =>
                      hasPermissionToEditCoverImage && setEditCoverImage(true)
                    }
                  >
                      <div className="flex h-[88px] w-full items-center justify-center bg-gray-200 font-medium text-gray-700" >
                        <svg
                          className="h-8 w-8 fill-current text-gray-500"
                          viewBox="0 0 40 32"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M18.5 6C18.5 5.4475 18.95 5 19.5 5H20.5C21.05 5 21.5 5.4475 21.5 6V7.5H23C23.55 7.5 24 7.95 24 8.5V9.5C24 10.05 23.55 10.5 23 10.5H21.5V12C21.5 12.55 21.05 13 20.5 13H19.5C18.95 13 18.5 12.55 18.5 12V10.5H17C16.45 10.5 16 10.05 16 9.5V8.5C16 7.95 16.45 7.5 17 7.5H18.5V6ZM25.5 0C27.9875 0 30 2.015 30 4.5V5H35.5C37.9875 5 40 7.0125 40 9.5V27.5C40 29.9875 37.9875 32 35.5 32H4.49875C2.01188 32 0 29.9875 0 27.5V9.5C0 7.0125 2.015 5 4.5 5H10V4.5C10 2.015 12.0125 0 14.5 0H25.5ZM30 8V29H35.5C36.3312 29 37 28.3313 37 27.5V21H33.5C32.6688 21 32 20.3313 32 19.5C32 18.6688 32.6688 18 33.5 18H37V15H33.5C32.6688 15 32 14.3313 32 13.5C32 12.6688 32.6688 12 33.5 12H37V9.5C37 8.66875 36.3312 8 35.5 8H30ZM3 9.5V12H6.5C7.33125 12 8 12.6688 8 13.5C8 14.3313 7.33125 15 6.5 15H3V18H6.5C7.33125 18 8 18.6688 8 19.5C8 20.3313 7.33125 21 6.5 21H3V27.5C3 28.3313 3.67125 29 4.49875 29H10V8H4.5C3.67188 8 3 8.66875 3 9.5ZM13 29H17V25C17 23.3438 18.3438 22 20 22C21.6562 22 23 23.3438 23 25V29H27V4.5C27 3.67188 26.3312 3 25.5 3H14.5C13.6688 3 13 3.67188 13 4.5V29Z" />
                        </svg>
                      </div>
                   
                    {editCoverImageTooltip}
                  </div>
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
