import careConfig from "@careConfig";
import { useMutation, useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import Spinner from "@/components/Common/Spinner";
import {
  DistrictModel,
  LocalBodyModel,
  WardModel,
} from "@/components/Facility/models";
import {
  FieldError,
  RequiredFieldValidator,
} from "@/components/Form/FieldValidators";
import Form from "@/components/Form/Form";
import DateFormField from "@/components/Form/FormFields/DateFormField";
import RadioFormField from "@/components/Form/FormFields/RadioFormField";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import TextAreaFormField from "@/components/Form/FormFields/TextAreaFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import {
  Appointment,
  AppointmentCreate,
  SlotAvailability,
} from "@/components/Schedule/types";

import { CarePatientTokenKey, GENDER_TYPES } from "@/common/constants";
import { validateName, validatePincode } from "@/common/validation";

import * as Notification from "@/Utils/Notifications";
import { usePubSub } from "@/Utils/pubsubContext";
import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import request from "@/Utils/request/request";
import { compareBy, dateQueryString } from "@/Utils/utils";
import { getPincodeDetails, includesIgnoreCase } from "@/Utils/utils";
import {
  AppointmentPatient,
  AppointmentPatientRegister,
} from "@/pages/Patient/Utils";
import { TokenData } from "@/types/auth/otpToken";

const initialForm: AppointmentPatientRegister = {
  name: "",
  gender: "1",
  year_of_birth: undefined,
  date_of_birth: "",
  phone_number: "",
  state: undefined,
  district: undefined,
  local_body: undefined,
  address: "",
  pincode: undefined,
};

type PatientRegistrationProps = {
  facilityId: string;
  staffUsername: string;
};

export function PatientRegistration(props: PatientRegistrationProps) {
  const { staffUsername } = props;
  const selectedSlot = JSON.parse(
    localStorage.getItem("selectedSlot") ?? "",
  ) as SlotAvailability;
  const reason = localStorage.getItem("reason");
  const tokenData: TokenData = JSON.parse(
    localStorage.getItem(CarePatientTokenKey) || "{}",
  );

  const { t } = useTranslation();
  const [ageInputType, setAgeInputType] = useState<"age" | "date_of_birth">(
    "date_of_birth",
  );

  const { publish } = usePubSub();

  const validateForm = (form: any) => {
    const errors: Partial<Record<keyof any, FieldError>> = {};

    Object.keys(form).forEach((field) => {
      switch (field) {
        case "name": {
          const requiredError = RequiredFieldValidator()(form[field]);
          if (requiredError) {
            errors[field] = requiredError;
          } else if (!validateName(form[field])) {
            errors[field] = t("min_char_length_error", { min_length: 3 });
          }
          return;
        }
        case "address":
        case "gender":
          errors[field] = RequiredFieldValidator()(form[field]);
          return;
        case "year_of_birth":
        case "date_of_birth": {
          const field =
            ageInputType === "age" ? "year_of_birth" : "date_of_birth";

          errors[field] = RequiredFieldValidator()(form[field]);
          if (errors[field]) {
            return;
          }

          if (field === "year_of_birth") {
            if (form.year_of_birth < 0) {
              errors.year_of_birth = "Age cannot be less than 0";
              return;
            }

            form.date_of_birth = null;
            form.year_of_birth = new Date().getFullYear() - form.year_of_birth;
          }

          if (field === "date_of_birth") {
            form.year_of_birth = null;
          }

          return;
        }
        case "local_body":
          if (form.nationality === "India" && !Number(form[field])) {
            errors[field] = "Please select a localbody";
          }
          return;
        case "district":
          if (form.nationality === "India" && !Number(form[field])) {
            errors[field] = "Please select district";
          }
          return;
        case "state":
          if (form.nationality === "India" && !Number(form[field])) {
            errors[field] = "Please enter the state";
          }
          return;
        case "pincode":
          if (!validatePincode(form[field])) {
            errors[field] = "Please enter valid pincode";
          }
          return;
        default:
          return;
      }
    });

    return errors;
  };

  const { mutate: createAppointment } = useMutation({
    mutationFn: (body: AppointmentCreate) =>
      mutate(routes.otp.createAppointment, {
        pathParams: { id: selectedSlot?.id },
        body,
        headers: {
          Authorization: `Bearer ${tokenData.token}`,
        },
      })(body),
    onSuccess: (data: Appointment) => {
      Notification.Success({ msg: t("appointment_created_success") });
      navigate(`/facility/${props.facilityId}/appointments/${data.id}/success`);
    },
    onError: (error) => {
      Notification.Error({
        msg: error?.message || t("failed_to_create_appointment"),
      });
    },
  });

  const { mutate: createPatient } = useMutation({
    mutationFn: (body: AppointmentPatientRegister) =>
      mutate(routes.otp.createPatient, {
        body,
        headers: {
          Authorization: `Bearer ${tokenData.token}`,
        },
      })(body),
    onSuccess: (data: AppointmentPatient) => {
      Notification.Success({ msg: "Patient created successfully" });
      publish("patient:upsert", data);
      createAppointment({
        patient: data.id,
        reason_for_visit: reason ?? "",
      });
    },
    onError: (error) => {
      Notification.Error({
        msg: error.message,
      });
    },
  });

  const handleSubmit = async (formData: AppointmentPatientRegister) => {
    const data = {
      phone_number: tokenData.phoneNumber,
      date_of_birth:
        ageInputType === "date_of_birth"
          ? dateQueryString(formData.date_of_birth)
          : undefined,
      age: ageInputType === "age" ? formData.year_of_birth : undefined,
      /* year_of_birth:
        ageInputType === "age"
          ? (
              new Date().getFullYear() - Number(formData.year_of_birth ?? 0)
            ).toString()
          : undefined, */
      name: formData.name,
      pincode: formData.pincode ? formData.pincode : undefined,
      gender: formData.gender,
      state: formData.state ? formData.state : undefined,
      district: formData.district ? formData.district : undefined,
      local_body: formData.local_body ? formData.local_body : undefined,
      address: formData.address ? formData.address : "",
      is_active: true,
    };
    createPatient(data);
  };
  const [isDistrictLoading, setIsDistrictLoading] = useState(false);
  const [isLocalbodyLoading, setIsLocalbodyLoading] = useState(false);
  const [isWardLoading, setIsWardLoading] = useState(false);
  const [districts, setDistricts] = useState<DistrictModel[]>([]);
  const [localBody, setLocalBody] = useState<LocalBodyModel[]>([]);
  const [ward, setWard] = useState<WardModel[]>([]);
  const [showAutoFilledPincode, setShowAutoFilledPincode] = useState(false);

  const fetchDistricts = useCallback(async (id: number) => {
    if (id > 0) {
      setIsDistrictLoading(true);
      const { res, data } = await request(routes.getDistrictByState, {
        pathParams: { id },
      });
      if (res?.ok && data) {
        setDistricts(data);
      }
      setIsDistrictLoading(false);
      return data ? [...data] : [];
    }
  }, []);

  const fetchLocalBody = useCallback(async (id: string) => {
    if (Number(id) > 0) {
      setIsLocalbodyLoading(true);
      const { data } = await request(routes.getLocalbodyByDistrict, {
        pathParams: { id },
      });
      setIsLocalbodyLoading(false);
      setLocalBody(data || []);
    } else {
      setLocalBody([]);
    }
  }, []);

  const fetchWards = useCallback(async (id: string) => {
    if (Number(id) > 0) {
      setIsWardLoading(true);
      const { data } = await request(routes.getWardByLocalBody, {
        pathParams: { id },
      });
      setIsWardLoading(false);
      if (data) {
        setWard(data.results);
      }
    } else {
      setWard([]);
    }
  }, []);

  const { data: stateData, isLoading: isStateLoading } = useQuery({
    queryKey: [routes.statesList],
    queryFn: () => request(routes.statesList),
  });

  const handlePincodeChange = async (e: any, setField: any) => {
    if (!validatePincode(e.value)) return;

    const pincodeDetails = await getPincodeDetails(
      e.value,
      careConfig.govDataApiKey,
    );
    if (!pincodeDetails) return;

    const matchedState = stateData?.data?.results?.find((state) => {
      return includesIgnoreCase(state.name, pincodeDetails.statename);
    });
    if (!matchedState) return;

    const fetchedDistricts = await fetchDistricts(matchedState.id);
    if (!fetchedDistricts) return;

    const matchedDistrict = fetchedDistricts.find((district) => {
      return includesIgnoreCase(district.name, pincodeDetails.districtname);
    });
    if (!matchedDistrict) return;

    setField({ name: "state", value: matchedState.id });
    setField({ name: "district", value: matchedDistrict.id.toString() }); // Convert matchedDistrict.id to string

    fetchLocalBody(matchedDistrict.id.toString()); // Convert matchedDistrict.id to string
    setShowAutoFilledPincode(true);
    setTimeout(() => {
      setShowAutoFilledPincode(false);
    }, 2000);
  };

  return (
    <>
      <div className="container mx-auto p-4 max-w-4xl flex justify-start">
        <Button
          variant="outline"
          className="border border-secondary-400"
          type="button"
          onClick={() =>
            navigate(
              `/facility/${props.facilityId}/appointments/${staffUsername}/patient-select`,
            )
          }
        >
          <CareIcon icon="l-square-shape" className="h-4 w-4 mr-1" />
          <span className="text-sm underline">Back</span>
        </Button>
      </div>
      <Form
        defaults={initialForm}
        validate={validateForm}
        onSubmit={handleSubmit}
        className="mx-auto space-y-6"
        submitLabel="Register Patient"
        hideRestoreDraft
        noPadding
        hideSubmitButton
        hideCancelButton
        disableMarginOnChildren
      >
        {(field) => (
          <>
            <div className="container mx-auto p-4 max-w-3xl">
              <h2 className="text-xl font-semibold">
                {t("patient_registration")}
              </h2>

              <div className="mt-4 flex-row bg-white border border-gray-200/50 rounded-md p-8 shadow-md">
                <span className="inline-block bg-primary-100 p-4 rounded-md w-full mb-4 text-primary-600 text-sm">
                  Phone Number Verified:{" "}
                  <span className="font-bold">{tokenData.phoneNumber}</span>
                </span>
                <TextFormField
                  {...field("name")}
                  label="Patient Name"
                  required
                />

                <RadioFormField
                  {...field("gender")}
                  label="Gender"
                  options={GENDER_TYPES}
                  optionLabel={(o: any) => o.text}
                  optionValue={(o: any) => o.id.toString()}
                />

                <RadioFormField
                  name="age_input_type"
                  label="Date of Birth or Age"
                  options={[
                    { id: "date_of_birth", text: "Date of Birth" },
                    { id: "age", text: "Age" },
                  ]}
                  optionLabel={(o: any) => o.text}
                  optionValue={(o: any) => o.id}
                  value={ageInputType}
                  onChange={(e) => {
                    setAgeInputType(e.value);
                  }}
                />
                {ageInputType === "date_of_birth" && (
                  <DateFormField
                    className="w-full"
                    containerClassName="w-full"
                    {...field("date_of_birth")}
                    errorClassName="hidden"
                    required
                    disableFuture
                  />
                )}
                {ageInputType === "age" && (
                  <TextFormField
                    {...field("year_of_birth")}
                    placeholder="Enter Age"
                    required
                    type="number"
                  />
                )}
              </div>
              <div className="space-y-2 mt-12 flex-row bg-white border border-gray-200/50 rounded-md p-8 shadow-md">
                <TextAreaFormField
                  {...field("address")}
                  label="Current Address"
                  required
                />

                <TextFormField
                  {...field("pincode")}
                  label="Pin code"
                  required
                  onChange={(e) => {
                    field("pincode").onChange(e);
                    handlePincodeChange(e, field("pincode").onChange);
                  }}
                />
                {showAutoFilledPincode && (
                  <div>
                    <CareIcon
                      icon="l-check-circle"
                      className="mr-2 text-sm text-green-500"
                    />
                    <span className="text-sm text-primary-500">
                      State and District auto-filled from Pincode
                    </span>
                  </div>
                )}

                <div data-testid="state" id="state-div">
                  {isStateLoading ? (
                    <Spinner />
                  ) : (
                    <SelectFormField
                      {...field("state")}
                      label="State"
                      required
                      placeholder="Choose State"
                      options={stateData?.data?.results || []}
                      optionLabel={(o: any) => o.name}
                      optionValue={(o: any) => o.id}
                      onChange={(e: any) => {
                        field("state").onChange(e);
                        field("district").onChange({
                          name: "district",
                          value: undefined,
                        });
                        field("local_body").onChange({
                          name: "local_body",
                          value: undefined,
                        });
                        field("ward").onChange({
                          name: "ward",
                          value: undefined,
                        });
                        fetchDistricts(e.value);
                        fetchLocalBody("0");
                        fetchWards("0");
                      }}
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div data-testid="district" id="district-div">
                    {isDistrictLoading ? (
                      <div className="flex w-full items-center justify-center">
                        <Spinner />
                      </div>
                    ) : (
                      <SelectFormField
                        {...field("district")}
                        label="District"
                        required
                        placeholder={
                          field("state").value
                            ? "Choose District"
                            : "Select State First"
                        }
                        disabled={!field("state").value}
                        options={districts}
                        optionLabel={(o: any) => o.name}
                        optionValue={(o: any) => o.id}
                        onChange={(e: any) => {
                          field("district").onChange(e);
                          field("local_body").onChange({
                            name: "local_body",
                            value: undefined,
                          });
                          field("ward").onChange({
                            name: "ward",
                            value: undefined,
                          });
                          fetchLocalBody(String(e.value));
                          fetchWards("0");
                        }}
                      />
                    )}
                  </div>
                  <div data-testid="localbody" id="local_body-div">
                    {isLocalbodyLoading ? (
                      <div className="flex w-full items-center justify-center">
                        <Spinner />
                      </div>
                    ) : (
                      <SelectFormField
                        {...field("local_body")}
                        label="Localbody"
                        required
                        placeholder={
                          field("district").value
                            ? "Choose Localbody"
                            : "Select District First"
                        }
                        disabled={!field("district").value}
                        options={localBody}
                        optionLabel={(o) => o.name}
                        optionValue={(o) => o.id}
                        onChange={(e) => {
                          field("local_body").onChange(e);
                          field("ward").onChange({
                            name: "ward",
                            value: undefined,
                          });
                          fetchWards(String(e.value));
                        }}
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div data-testid="ward-respective-lsgi" id="ward-div">
                    {isWardLoading ? (
                      <div className="flex w-full items-center justify-center">
                        <Spinner />
                      </div>
                    ) : (
                      <SelectFormField
                        {...field("ward")}
                        label="Ward"
                        options={ward.sort(compareBy("number")).map((e) => {
                          return {
                            id: e.id,
                            name: e.number + ": " + e.name,
                          };
                        })}
                        placeholder={
                          field("local_body").value
                            ? "Choose Ward"
                            : "Select Localbody First"
                        }
                        disabled={!field("local_body").value}
                        optionLabel={(o: any) => o.name}
                        optionValue={(o: any) => o.id}
                        onChange={(e: any) => {
                          field("ward").onChange(e);
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-secondary-200 pt-3 pb-8">
              <div className="flex flex-row gap-2 justify-center sm:ml-64 mt-4">
                <Button
                  variant="white"
                  className="sm:w-1/5"
                  type="button"
                  onClick={() => {
                    navigate(
                      `/facility/${props.facilityId}/appointments/${staffUsername}/patient-select`,
                    );
                  }}
                >
                  <span className="bg-gradient-to-b from-white/15 to-transparent"></span>
                  {t("cancel")}
                </Button>
                <Button
                  variant="primary_gradient"
                  className="sm:w-1/5"
                  type="submit"
                >
                  <span className="bg-gradient-to-b from-white/15 to-transparent"></span>
                  {t("register_patient")}
                </Button>
              </div>
            </div>
          </>
        )}
      </Form>
    </>
  );
}
