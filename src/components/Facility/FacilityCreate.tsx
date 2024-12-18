import careConfig from "@careConfig";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Card from "@/CAREUI/display/Card";
import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2, { Cancel, Submit } from "@/components/Common/ButtonV2";
import GLocationPicker from "@/components/Common/GLocationPicker";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import SpokeFacilityEditor from "@/components/Facility/SpokeFacilityEditor";
import { DistrictModel, FacilityRequest } from "@/components/Facility/models";
import { PhoneNumberValidator } from "@/components/Form/FieldValidators";
import PhoneNumberFormField from "@/components/Form/FormFields/PhoneNumberFormField";
import RadioFormField from "@/components/Form/FormFields/RadioFormField";
import {
  MultiSelectFormField,
  SelectFormField,
} from "@/components/Form/FormFields/SelectFormField";
import TextAreaFormField from "@/components/Form/FormFields/TextAreaFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import { FieldChangeEvent } from "@/components/Form/FormFields/Utils";
import { FormAction } from "@/components/Form/Utils";

import useAppHistory from "@/hooks/useAppHistory";
import useAuthUser from "@/hooks/useAuthUser";

import { FACILITY_FEATURE_TYPES, FACILITY_TYPES } from "@/common/constants";
import {
  phonePreg,
  validateLatitude,
  validateLongitude,
  validatePincode,
} from "@/common/validation";

import { DraftSection, useAutoSaveReducer } from "@/Utils/AutoSave";
import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { RequestResult } from "@/Utils/request/types";
import useTanStackQueryInstead from "@/Utils/request/useQuery";
import {
  compareBy,
  getPincodeDetails,
  includesIgnoreCase,
  parsePhoneNumber,
} from "@/Utils/utils";

interface FacilityProps {
  facilityId?: string;
}

type FacilityForm = {
  facility_type?: string;
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
};

const initForm: FacilityForm = {
  facility_type: undefined,
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
};

const initError: Record<keyof FacilityForm, string> = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" })),
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
  const { facilityId } = props;

  const [state, dispatch] = useAutoSaveReducer<FacilityForm>(
    facilityCreateReducer,
    initialState,
  );
  const [isLoading, setIsLoading] = useState(false);

  const [showAutoFilledPincode, setShowAutoFilledPincode] = useState(false);
  const [stateId, setStateId] = useState<number>();
  const [districtId, setDistrictId] = useState<number>();
  const [localBodyId, setLocalBodyId] = useState<number>();
  const { goBack } = useAppHistory();
  const headerText = !facilityId ? "Create Facility" : "Update Facility";
  const buttonText = !facilityId ? "Save Facility" : "Update Facility";

  const authUser = useAuthUser();
  useEffect(() => {
    if (
      authUser &&
      authUser.user_type !== "StateAdmin" &&
      authUser.user_type !== "DistrictAdmin" &&
      authUser.user_type !== "DistrictLabAdmin"
    ) {
      navigate("/facility");
      Notification.Error({
        msg: "You don't have permission to perform this action. Contact the admin",
      });
    }
  }, [authUser]);

  const {
    data: districtData,
    refetch: districtFetch,
    loading: isDistrictLoading,
  } = useTanStackQueryInstead(routes.getDistrictByState, {
    pathParams: {
      id: String(stateId),
    },
    prefetch: !!stateId,
  });

  const { data: localbodyData, loading: isLocalbodyLoading } =
    useTanStackQueryInstead(routes.getLocalbodyByDistrict, {
      pathParams: {
        id: String(districtId),
      },
      prefetch: !!districtId,
    });

  const { data: wardData, loading: isWardLoading } = useTanStackQueryInstead(
    routes.getWardByLocalBody,
    {
      pathParams: {
        id: String(localBodyId),
      },
      prefetch: !!localBodyId,
    },
  );

  const facilityQuery = useTanStackQueryInstead(routes.getPermittedFacility, {
    pathParams: {
      id: facilityId!,
    },
    prefetch: !!facilityId,
    onResponse: ({ res, data }) => {
      if (facilityId) {
        setIsLoading(true);
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
          };
          dispatch({ type: "set_form", form: formData });
          setStateId(data.state);
          setDistrictId(data.district);
          setLocalBodyId(data.local_body);
        } else {
          navigate(`/facility/${facilityId}`);
        }
        setIsLoading(false);
      }
    },
  });

  const { data: stateData, loading: isStateLoading } = useTanStackQueryInstead(
    routes.statesList,
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

    const pincodeDetails = await getPincodeDetails(
      e.value,
      careConfig.govDataApiKey,
    );
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
    setCenter: (lat: number, lng: number) => void,
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
        case "facility_type":
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
    if (validated) {
      setIsLoading(true);
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
        } else {
          Notification.Success({
            msg: "Facility updated successfully",
          });
        }
        navigate(`/facility/${id}`);
      }
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading />;
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

  return (
    <Page
      title={headerText}
      crumbsReplacements={{
        [facilityId || "????"]: { name: state.form.name },
      }}
    >
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
                    <CareIcon icon="l-check-circle" />
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
              {facilityId && (
                <div className="py-4 md:col-span-2">
                  <h4 className="mb-4">{t("spokes")}</h4>
                  <SpokeFacilityEditor
                    facility={{ ...facilityQuery.data, id: facilityId }}
                  />
                </div>
              )}
              {careConfig.kasp.enabled && (
                <RadioFormField
                  {...field("kasp_empanelled")}
                  label={`Is this facility ${careConfig.kasp.string} empanelled?`}
                  options={[true, false]}
                  optionLabel={(o) => (o ? "Yes" : "No")}
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
                    <PopoverButton>
                      <ButtonV2
                        circle
                        type="button"
                        id="facility-location-button"
                        className="tooltip p-2"
                      >
                        <CareIcon icon="l-map-marker" className="text-xl" />
                        <span className="tooltip-text tooltip-bottom">
                          Select location from map
                        </span>
                      </ButtonV2>
                    </PopoverButton>

                    <Transition
                      enter="transition ease-out duration-200"
                      enterFrom="opacity-0 translate-y-1"
                      enterTo="opacity-100 translate-y-0"
                      leave="transition ease-in duration-150"
                      leaveFrom="opacity-100 translate-y-0"
                      leaveTo="opacity-0 translate-y-1"
                    >
                      <PopoverPanel className="absolute -right-36 bottom-10 sm:-right-48">
                        <GLocationPicker
                          lat={Number(state.form.latitude)}
                          lng={Number(state.form.longitude)}
                          handleOnChange={handleLocationChange}
                          handleOnClose={() => null}
                          handleOnSelectCurrentLocation={
                            handleSelectCurrentLocation
                          }
                        />
                      </PopoverPanel>
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
              <Submit type="button" onClick={handleSubmit} label={buttonText} />
            </div>
          </form>
        </div>
      </Card>
    </Page>
  );
};
