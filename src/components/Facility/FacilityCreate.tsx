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
import { FacilityRequest } from "@/components/Facility/models";
import { PhoneNumberValidator } from "@/components/Form/FieldValidators";
import PhoneNumberFormField from "@/components/Form/FormFields/PhoneNumberFormField";
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
import useTanStackQueryInstead from "@/Utils/request/useQuery";
import { parsePhoneNumber } from "@/Utils/utils";
import OrganizationSelector from "@/pages/Organization/components/OrganizationSelector";

interface FacilityProps {
  facilityId?: string;
}

type FacilityForm = {
  facility_type?: string;
  name: string;
  geo_organization?: string;
  features: number[];
  address: string;
  phone_number: string;
  latitude: string;
  longitude: string;
  pincode: string;
  description: string;
};

const initForm: FacilityForm = {
  facility_type: undefined,
  name: "",
  features: [],
  address: "",
  phone_number: "",
  latitude: "",
  longitude: "",
  pincode: "",
  description: "",
  geo_organization: "",
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
            geo_organization: data.geo_organization,
            features: data.features || [],
            address: data.address ? data.address : "",
            pincode: data.pincode ? data.pincode : "",
            description: data.description ? data.description : "",
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
        } else {
          navigate(`/facility/${facilityId}`);
        }
        setIsLoading(false);
      }
    },
  });

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

        case "geo_organization":
          if (!String(state.form[field])) {
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
        geo_organization: state.form.geo_organization,
        address: state.form.address,
        features: state.form.features,
        pincode: state.form.pincode,
        latitude: state.form.latitude,
        longitude: state.form.longitude,
        phone_number: parsePhoneNumber(state.form.phone_number),
        description: state.form.description,
        ward: 5896,
        local_body: 95,
        district: 5,
        state: 1,
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
              <TextAreaFormField
                {...field("description")}
                label={t("description")}
                placeholder={t("markdown_supported")}
                className="col-span-2"
              />
              <MultiSelectFormField
                {...field("features")}
                placeholder={t("features")}
                options={FACILITY_FEATURE_TYPES}
                optionLabel={(o) => o.name}
                optionValue={(o) => o.id}
              />
              <div>
                <TextFormField {...field("pincode")} required />
              </div>
              <div className="col-span-2 grid grid-cols-2 gap-5">
                <OrganizationSelector
                  required={true}
                  onChange={(value) =>
                    dispatch({
                      type: "set_form",
                      form: {
                        ...state.form,
                        geo_organization: value,
                      },
                    })
                  }
                />
              </div>

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
