import careConfig from "@careConfig";
import { useMutation, useQuery } from "@tanstack/react-query";
import { navigate, useQueryParams } from "raviger";
import { Fragment, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import SectionNavigator from "@/CAREUI/misc/SectionNavigator";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import DuplicatePatientDialog from "@/components/Facility/DuplicatePatientDialog";

import useAppHistory from "@/hooks/useAppHistory";

import {
  BLOOD_GROUP_CHOICES, // DOMESTIC_HEALTHCARE_SUPPORT_CHOICES,
  GENDER_TYPES, // OCCUPATION_TYPES,
  //RATION_CARD_CATEGORY, // SOCIOECONOMIC_STATUS_CHOICES ,
} from "@/common/constants";
import countryList from "@/common/static/countries.json";
import { validatePincode } from "@/common/validation";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  dateQueryString,
  getPincodeDetails,
  parsePhoneNumber,
} from "@/Utils/utils";
import OrganizationSelector from "@/pages/Organization/components/OrganizationSelector";
import { PatientModel, validatePatient } from "@/types/emr/patient";

import Autocomplete from "../ui/autocomplete";

interface PatientRegistrationPageProps {
  facilityId: string;
  patientId?: string;
}

export default function PatientRegistration(
  props: PatientRegistrationPageProps,
) {
  const [{ phone_number }] = useQueryParams();
  const { patientId, facilityId } = props;
  const { t } = useTranslation();
  const { goBack } = useAppHistory();

  const [samePhoneNumber, setSamePhoneNumber] = useState(false);
  const [sameAddress, setSameAddress] = useState(true);
  const [ageDob, setAgeDob] = useState<"dob" | "age">("dob");
  const [_showAutoFilledPincode, setShowAutoFilledPincode] = useState(false);
  const [form, setForm] = useState<Partial<PatientModel>>({
    nationality: "India",
    phone_number: phone_number || "+91",
    emergency_phone_number: "+91",
  });
  const [feErrors, setFeErrors] = useState<
    Partial<Record<keyof PatientModel, string[]>>
  >({});
  const [suppressDuplicateWarning, setSuppressDuplicateWarning] =
    useState(!!patientId);
  const [debouncedNumber, setDebouncedNumber] = useState<string>();

  const sidebarItems = [
    { label: t("patient__general-info"), id: "general-info" },
    // { label: t("social_profile"), id: "social-profile" },
    //{ label: t("volunteer_contact"), id: "volunteer-contact" },
    //{ label: t("patient__insurance-details"), id: "insurance-details" },
  ];

  const mutationFields: (keyof PatientModel)[] = [
    "name",
    "phone_number",
    "emergency_phone_number",
    "geo_organization",
    "gender",
    "blood_group",
    "date_of_birth",
    "age",
    "address",
    "permanent_address",
    "pincode",
    "nationality",
    "meta_info",
    "ration_card_category",
  ];

  const mutationData: Partial<PatientModel> = {
    ...Object.fromEntries(
      Object.entries(form).filter(([key]) =>
        mutationFields.includes(key as keyof PatientModel),
      ),
    ),
    date_of_birth:
      ageDob === "dob" ? dateQueryString(form.date_of_birth) : undefined,
    age: ageDob === "age" ? form.age : undefined,
    meta_info: {
      ...(form.meta_info as any),
      occupation:
        form.meta_info?.occupation === ""
          ? undefined
          : form.meta_info?.occupation,
    },
  };

  const createPatientMutation = useMutation({
    mutationFn: mutate(routes.addPatient),
    onSuccess: (resp: PatientModel) => {
      toast.success(t("patient_registration_success"));
      // Lets navigate the user to the verify page as the patient is not accessible to the user yet
      navigate(`/facility/${facilityId}/patients/verify`, {
        query: {
          phone_number: resp.phone_number,
          year_of_birth:
            ageDob === "dob"
              ? new Date(resp.date_of_birth!).getFullYear()
              : new Date().getFullYear() - Number(resp.age!),
          partial_id: resp?.id?.slice(0, 5),
        },
      });
    },
    onError: () => {
      toast.error(t("patient_registration_error"));
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: mutate(routes.updatePatient, {
      pathParams: { id: patientId || "" },
    }),
    onSuccess: () => {
      toast.success(t("patient_update_success"));
      goBack();
    },
    onError: () => {
      toast.error(t("patient_update_error"));
    },
  });

  const patientQuery = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(routes.getPatient, {
      pathParams: { id: patientId || "" },
    }),
    enabled: !!patientId,
  });

  useEffect(() => {
    if (patientQuery.data) {
      setForm(patientQuery.data);
      if (patientQuery.data.year_of_birth && !patientQuery.data.date_of_birth) {
        setAgeDob("age");
      }
      if (
        patientQuery.data.phone_number ===
        patientQuery.data.emergency_phone_number
      )
        setSamePhoneNumber(true);
      if (patientQuery.data.address === patientQuery.data.permanent_address)
        setSameAddress(true);
    }
  }, [patientQuery.data]);

  const handlePincodeChange = async (value: string) => {
    if (!validatePincode(value)) return;
    if (form.state && form.district) return;

    const pincodeDetails = await getPincodeDetails(
      value,
      careConfig.govDataApiKey,
    );
    if (!pincodeDetails) return;

    const { statename: _stateName, districtname: _districtName } =
      pincodeDetails;

    setShowAutoFilledPincode(true);
    setTimeout(() => {
      setShowAutoFilledPincode(false);
    }, 2000);
  };

  useEffect(() => {
    const timeout = setTimeout(
      () => handlePincodeChange(form.pincode?.toString() || ""),
      1000,
    );
    return () => clearTimeout(timeout);
  }, [form.pincode]);

  const title = !patientId
    ? t("add_details_of_patient")
    : t("update_patient_details");

  const errors = {
    ...feErrors,
    ...(createPatientMutation.error as unknown as string[]),
  };

  const fieldProps = (field: keyof typeof form) => ({
    value: form[field] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({
        ...f,
        [field]: e.target.value === "" ? undefined : e.target.value,
      })),
  });

  const selectProps = (field: keyof typeof form) => ({
    value: (form[field] as string)?.toString(),
    onValueChange: (value: string) =>
      setForm((f) => ({ ...f, [field]: value })),
  });

  const handleDialogClose = (action: string) => {
    if (action === "transfer") {
      navigate(`/facility/${facilityId}/patients`, {
        query: {
          phone_number: form.phone_number,
        },
      });
    } else {
      setSuppressDuplicateWarning(true);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validate = validatePatient(form, ageDob === "dob");
    if (typeof validate !== "object") {
      patientId
        ? updatePatientMutation.mutate({ ...mutationData, ward_old: undefined })
        : createPatientMutation.mutate({
            ...mutationData,
            facility: facilityId,
            ward_old: undefined,
          });
    } else {
      const firstErrorField = document.querySelector("[data-input-error]");
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      toast.error(t("please_fix_errors"));
      setFeErrors(validate);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      if (!patientId || patientQuery.data?.phone_number !== form.phone_number) {
        setSuppressDuplicateWarning(false);
      }
      setDebouncedNumber(form.phone_number);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [form.phone_number]);

  const patientPhoneSearch = useQuery({
    queryKey: ["patients", "phone-number", debouncedNumber],
    queryFn: query(routes.searchPatient, {
      body: {
        phone_number: parsePhoneNumber(debouncedNumber || "") || "",
      },
    }),
    enabled: !!parsePhoneNumber(debouncedNumber || ""),
  });

  const duplicatePatients = patientPhoneSearch.data?.results.filter(
    (p) => p.id !== patientId,
  );
  if (patientId && patientQuery.isLoading) {
    return <Loading />;
  }

  return (
    <Page title={title}>
      <hr className="mt-4" />
      <div className="relative mt-4 flex flex-col md:flex-row gap-4">
        <SectionNavigator sections={sidebarItems} className="hidden md:flex" />
        <form className="md:w-[500px]" onSubmit={handleFormSubmit}>
          <div id={"general-info"}>
            <h2 className="text-lg font-semibold">
              {t("patient__general-info")}
            </h2>
            <div className="text-sm">{t("general_info_detail")}</div>
            <br />
            <Label className="mb-2">
              {t("name")}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              {...fieldProps("name")}
              placeholder={t("type_patient_name")}
            />
            <div className="mt-1" data-input-error>
              {errors["name"] &&
                errors["name"].map((error, i) => (
                  <div key={i} className="text-red-500 text-xs">
                    {error}
                  </div>
                ))}
            </div>
            <br />
            <Label className="mb-2">
              {t("phone_number")}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              {...fieldProps("phone_number")}
              onChange={(e) => {
                if (e.target.value.length > 13) return;
                setForm((f) => ({
                  ...f,
                  phone_number: e.target.value,
                  emergency_phone_number: samePhoneNumber
                    ? e.target.value
                    : f.emergency_phone_number,
                }));
              }}
            />
            <div className="mt-1" data-input-error>
              {errors["phone_number"] &&
                errors["phone_number"]?.map((error, i) => (
                  <div key={i} className="text-red-500 text-xs">
                    {error}
                  </div>
                ))}
            </div>

            <div className="mt-1 flex gap-1 items-center">
              <Checkbox
                checked={samePhoneNumber}
                onCheckedChange={() => {
                  const newValue = !samePhoneNumber;
                  setSamePhoneNumber(newValue);
                  if (newValue) {
                    setForm((f) => ({
                      ...f,
                      emergency_phone_number: f.phone_number,
                    }));
                  }
                }}
                id="same-phone-number"
              />
              <Label htmlFor="same-phone-number">
                {t("use_phone_number_for_emergency")}
              </Label>
            </div>
            <br />

            <Label className="mb-2">
              {t("emergency_phone_number")}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              {...fieldProps("emergency_phone_number")}
              onChange={(e) => {
                if (e.target.value.length > 13) return;
                setForm((f) => ({
                  ...f,
                  emergency_phone_number: e.target.value,
                }));
              }}
              disabled={samePhoneNumber}
            />
            <div className="mt-1" data-input-error>
              {errors["emergency_phone_number"] &&
                errors["emergency_phone_number"]?.map((error, i) => (
                  <div key={i} className="text-red-500 text-xs">
                    {error}
                  </div>
                ))}
            </div>
            {/* <br />
            <Input
              // This field does not exist in the backend, but is present in the design
              required
              label={t("emergency_contact_person_name_details")}
              placeholder={t("emergency_contact_person_name")}
            /> */}
            <br />

            <Label className="mb-2">
              {t("sex")}
              <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={form.gender?.toString()}
              onValueChange={(value) =>
                setForm((f) => ({ ...f, gender: value }))
              }
              className="flex items-center gap-4"
            >
              {GENDER_TYPES.map((g) => (
                <Fragment key={g.id}>
                  <RadioGroupItem
                    value={g.id.toString()}
                    id={"gender_" + g.id}
                  />
                  <Label htmlFor={"gender_" + g.id}>
                    {t(`GENDER__${g.id}`)}
                  </Label>
                </Fragment>
              ))}
            </RadioGroup>
            <div className="mt-1" data-input-error>
              {errors["gender"] &&
                errors["gender"]?.map((error, i) => (
                  <div key={i} className="text-red-500 text-xs">
                    {error}
                  </div>
                ))}
            </div>

            <br />

            <Label className="mb-2">
              {t("blood_group")}
              <span className="text-red-500">*</span>
            </Label>
            <Select {...selectProps("blood_group")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLOOD_GROUP_CHOICES.map((bg) => (
                  <SelectItem key={bg.id} value={bg.id}>
                    {bg.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-1" data-input-error>
              {errors["blood_group"] &&
                errors["blood_group"]?.map((error, i) => (
                  <div key={i} className="text-red-500 text-xs">
                    {error}
                  </div>
                ))}
            </div>

            <br />
            <Tabs
              value={ageDob}
              onValueChange={(value: string) =>
                setAgeDob(value as typeof ageDob)
              }
            >
              <TabsList className="mb-4">
                {[
                  ["dob", t("date_of_birth")],
                  ["age", t("age")],
                ].map(([key, label]) => (
                  <TabsTrigger value={key}>{label}</TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="dob">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Label className="mb-2">
                      {t("day")}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="DD"
                      type="number"
                      value={form.date_of_birth?.split("-")[2] || ""}
                      maxLength={2}
                      max={31}
                      min={1}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          date_of_birth: `${form.date_of_birth?.split("-")[0] || ""}-${form.date_of_birth?.split("-")[1] || ""}-${e.target.value}`,
                        }))
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="mb-2">
                      {t("month")}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="MM"
                      type="number"
                      value={form.date_of_birth?.split("-")[1] || ""}
                      maxLength={2}
                      max={12}
                      min={1}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          date_of_birth: `${form.date_of_birth?.split("-")[0] || ""}-${e.target.value}-${form.date_of_birth?.split("-")[2] || ""}`,
                        }))
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="mb-2">
                      {t("year")}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="YYYY"
                      value={form.date_of_birth?.split("-")[0] || ""}
                      maxLength={4}
                      max={new Date().getFullYear()}
                      min={1900}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          date_of_birth: `${e.target.value}-${form.date_of_birth?.split("-")[1] || ""}-${form.date_of_birth?.split("-")[2] || ""}`,
                        }))
                      }
                    />
                  </div>
                </div>
                {errors["date_of_birth"] && (
                  <div className="mt-1" data-input-error>
                    {errors["date_of_birth"].map((error, i) => (
                      <div key={i} className="text-red-500 text-xs">
                        {error}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="age">
                <div className="bg-yellow-500/10 border border-yellow-500 rounded-md p-4 text-sm text-yellow-800 mb-4">
                  {t("age_input_warning")}
                  <br />
                  <b>{t("age_input_warning_bold")}</b>
                </div>
                <div className="relative">
                  <Label className="mb-2">
                    {t("age")}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={form.age ? form.age : undefined}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        age: e.target.value,
                        year_of_birth: e.target.value
                          ? new Date().getFullYear() - Number(e.target.value)
                          : undefined,
                      }))
                    }
                    type="number"
                  />
                  <div className="mt-1" data-input-error>
                    {errors["year_of_birth"] &&
                      errors["year_of_birth"]?.map((error, i) => (
                        <div key={i} className="text-red-500 text-xs">
                          {error}
                        </div>
                      ))}
                  </div>

                  {form.year_of_birth && (
                    <div className="text-xs absolute right-6 top-[22px] bottom-0 flex items-center justify-center p-2 pointer-events-none">
                      {t("year_of_birth")} : {form.year_of_birth}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            <br />

            <Label className="mb-2">
              {t("current_address")}
              <span className="text-red-500">*</span>
            </Label>
            <Textarea
              {...fieldProps("address")}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  address: e.target.value,
                  permanent_address: sameAddress
                    ? e.target.value
                    : f.permanent_address,
                }))
              }
            />
            <div className="mt-1" data-input-error>
              {errors["address"] &&
                errors["address"]?.map((error, i) => (
                  <div key={i} className="text-red-500 text-xs">
                    {error}
                  </div>
                ))}
            </div>

            <div className="mt-1 flex gap-1 items-center">
              <Checkbox
                checked={sameAddress}
                onCheckedChange={() => {
                  setSameAddress(!sameAddress);
                  setForm((f) => ({
                    ...f,
                    permanent_address: !sameAddress
                      ? f.address
                      : f.permanent_address,
                  }));
                }}
                id="same-address"
              />
              <Label htmlFor="same-address">
                {t("use_address_as_permanent")}
              </Label>
            </div>
            <br />

            <Label className="mb-2">
              {t("permanent_address")}
              <span className="text-red-500">*</span>
            </Label>
            <Textarea
              {...fieldProps("permanent_address")}
              value={form.permanent_address}
              onChange={(e) =>
                setForm((f) => ({ ...f, permanent_address: e.target.value }))
              }
              disabled={sameAddress}
            />
            {/* <br />
            <Input
              // This field does not exist in the backend, but is present in the design
              label={t("landmark")}
            /> */}
            <br />
            <Label className="mb-2">
              {t("pincode")}
              <span className="text-red-500">*</span>
            </Label>
            <Input {...fieldProps("pincode")} type="number" />
            <div className="mt-1" data-input-error>
              {errors["pincode"] &&
                errors["pincode"]?.map((error, i) => (
                  <div key={i} className="text-red-500 text-xs">
                    {error}
                  </div>
                ))}
            </div>

            {/* {showAutoFilledPincode && (
              <div>
                <CareIcon
                  icon="l-check-circle"
                  className="mr-2 text-sm text-green-500"
                />
                <span className="text-sm text-primary-500">
                  {t("pincode_autofill")}
                </span>
              </div>
            )} */}
            <br />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2">
                  {t("nationality")}
                  <span className="text-red-500">*</span>
                </Label>
                <Autocomplete
                  options={countryList.map((c) => ({ label: c, value: c }))}
                  value={form.nationality || ""}
                  onChange={(value) => {
                    setForm((f) => ({
                      ...f,
                      nationality: value,
                    }));
                  }}
                />
                <div className="mt-1" data-input-error>
                  {errors["nationality"] &&
                    errors["nationality"]?.map((error, i) => (
                      <div key={i} className="text-red-500 text-xs">
                        {error}
                      </div>
                    ))}
                </div>
              </div>
              {form.nationality === "India" && (
                <>
                  <OrganizationSelector
                    required={true}
                    onChange={(value) =>
                      setForm((f) => ({
                        ...f,
                        geo_organization: value,
                      }))
                    }
                  />
                </>
              )}
            </div>
          </div>
          {/* <div id="social-profile" className="mt-10"> */}
          {/* <h2 className="text-lg font-semibold">
              {t("patient__social-profile")}
            </h2>
            <div className="text-sm">{t("social_profile_detail")}</div>
            <br /> */}
          {/* <div>
              <InputWithError label={t("occupation")}>
                <Autocomplete
                  options={OCCUPATION_TYPES.map((occupation) => ({
                    label: occupation.text,
                    value: occupation.value,
                  }))}
                  value={form.meta_info?.occupation || ""}
                  onChange={(value) =>
                    setForm((f) => ({
                      ...f,
                      meta_info: { ...(f.meta_info as any), occupation: value },
                    }))
                  }
                />
              </InputWithError>
            </div> */}
          {/* <br /> */}
          {/* <div>
              <InputWithError
                label={t("ration_card_category")}
                errors={errors["ration_card_category"]}
              >
                <Select {...selectProps("ration_card_category")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RATION_CARD_CATEGORY.map((rcg) => (
                      <SelectItem key={rcg} value={rcg}>
                        {t(`ration_card__${rcg}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </InputWithError>
            </div> */}
          {/* <br /> */}
          {/* <InputWithError label={t("socioeconomic_status")}>
              <RadioGroup
                value={form.meta_info?.socioeconomic_status}
                onValueChange={(value) =>
                  setForm((f) => ({
                    ...f,
                    meta_info: {
                      ...(f.meta_info as any),
                      socioeconomic_status: value,
                    },
                  }))
                }
                className="flex items-center gap-4"
              >
                {SOCIOECONOMIC_STATUS_CHOICES.map((sec) => (
                  <Fragment key={sec}>
                    <RadioGroupItem value={sec} id={"sec_" + sec} />
                    <Label htmlFor={"sec_" + sec}>
                      {t(`SOCIOECONOMIC_STATUS__${sec}`)}
                    </Label>
                  </Fragment>
                ))}
              </RadioGroup>
            </InputWithError> */}
          {/* <br /> */}
          {/* <InputWithError label={t("has_domestic_healthcare_support")}>
              <RadioGroup
                value={form.meta_info?.domestic_healthcare_support}
                onValueChange={(value) =>
                  setForm((f) => ({
                    ...f,
                    meta_info: {
                      ...(f.meta_info as any),
                      domestic_healthcare_support: value,
                    },
                  }))
                }
                className="flex items-center gap-4"
              >
                {DOMESTIC_HEALTHCARE_SUPPORT_CHOICES.map((dhs) => (
                  <Fragment key={dhs}>
                    <RadioGroupItem value={dhs} id={"dhs_" + dhs} />
                    <Label htmlFor={"dhs_" + dhs}>
                      {t(`DOMESTIC_HEALTHCARE_SUPPORT__${dhs}`)}
                    </Label>
                  </Fragment>
                ))}
              </RadioGroup>
            </InputWithError> */}
          {/* </div> */}
          {/* <div id="volunteer-contact" className="mt-10">
            <h2 className="text-lg font-semibold">
              {t("patient__volunteer-contact")}
            </h2>
            <div className="text-sm">{t("volunteer_contact_detail")}</div>
            <br />

          </div> */}
          {/* <div id="insurance-details" className="mt-10">
            <h2 className="text-lg font-semibold">
              {t("patient__insurance-details")}
            </h2>
            <div className="text-sm">{t("insurance_details_detail")}</div>
            <br />
          </div> */}
          <div className="flex justify-end mt-20 gap-4">
            <Button
              variant={"secondary"}
              type="button"
              onClick={() => goBack()}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant={"primary"}
              disabled={
                patientId
                  ? updatePatientMutation.isPending
                  : createPatientMutation.isPending
              }
            >
              {patientId ? t("save") : t("save_and_continue")}
            </Button>
          </div>
        </form>
      </div>
      {!patientPhoneSearch.isLoading &&
        !!duplicatePatients?.length &&
        !!parsePhoneNumber(debouncedNumber || "") &&
        !suppressDuplicateWarning && (
          <DuplicatePatientDialog
            patientList={duplicatePatients}
            handleOk={handleDialogClose}
            handleCancel={() => {
              handleDialogClose("close");
            }}
          />
        )}
    </Page>
  );
}
