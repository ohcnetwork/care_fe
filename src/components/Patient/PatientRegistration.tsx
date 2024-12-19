import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { Fragment, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import SectionNavigator from "@/CAREUI/misc/SectionNavigator";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InputErrors } from "@/components/ui/errors";
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

import DialogModal from "@/components/Common/Dialog";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import DuplicatePatientDialog from "@/components/Facility/DuplicatePatientDialog";
import TransferPatientDialog from "@/components/Facility/TransferPatientDialog";
import { PatientModel } from "@/components/Patient/models";

import useAppHistory from "@/hooks/useAppHistory";

import {
  BLOOD_GROUPS,
  DOMESTIC_HEALTHCARE_SUPPORT_CHOICES,
  GENDER_TYPES,
  OCCUPATION_TYPES,
  RATION_CARD_CATEGORY,
  SOCIOECONOMIC_STATUS_CHOICES,
} from "@/common/constants";
import countryList from "@/common/static/countries.json";
import { validatePincode } from "@/common/validation";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import useMutation from "@/Utils/request/useMutation";
import {
  dateQueryString,
  getPincodeDetails,
  includesIgnoreCase,
  parsePhoneNumber,
} from "@/Utils/utils";

interface PatientRegistrationPageProps {
  facilityId: string;
  patientId?: string;
}

export default function PatientRegistration(
  props: PatientRegistrationPageProps,
) {
  const { patientId, facilityId } = props;
  const { t } = useTranslation();
  const { goBack } = useAppHistory();

  const [samePhoneNumber, setSamePhoneNumber] = useState(false);
  const [sameAddress, setSameAddress] = useState(false);
  const [ageDob, setAgeDob] = useState<"dob" | "age">("dob");
  const [showAutoFilledPincode, setShowAutoFilledPincode] = useState(false);
  const [form, setForm] = useState<Partial<PatientModel>>({
    nationality: "India",
    phone_number: "+91",
    emergency_phone_number: "+91",
  });
  const [feErrors, setFeErrors] = useState<
    Partial<Record<keyof PatientModel, string[]>>
  >({});
  const [suppressDuplicateWarning, setSuppressDuplicateWarning] =
    useState(!!patientId);
  const [showTransferDialog, setShowTransferDialog] = useState(false);

  const sidebarItems = [
    { label: t("patient__general-info"), id: "general-info" },
    { label: t("social_profile"), id: "social-profile" },
    //{ label: t("volunteer_contact"), id: "volunteer-contact" },
    //{ label: t("patient__insurance-details"), id: "insurance-details" },
  ];

  const mutationFields: (keyof PatientModel)[] = [
    "name",
    "phone_number",
    "emergency_phone_number",
    "gender",
    "blood_group",
    "date_of_birth",
    "age",
    "address",
    "permanent_address",
    "pincode",
    "nationality",
    "state",
    "district",
    "local_body",
    "ward",
    "village",
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
    year_of_birth: ageDob === "age" ? form.year_of_birth : undefined,
    is_active: true,
    is_antenatal: false,
    passport_no: form.nationality === "Indian" ? form.passport_no : undefined,
    meta_info: {
      ...(form.meta_info as any),
      occupation:
        form.meta_info?.occupation === ""
          ? undefined
          : form.meta_info?.occupation,
    },
  };

  const createPatientMutation = useMutation(routes.addPatient, {
    body: { ...mutationData, facility: facilityId, ward_old: undefined },
    onResponse: (resp) => {
      if (resp.error) {
        Notification.Error({
          msg: t("patient_registration_error"),
        });
      } else {
        Notification.Success({
          msg: t("patient_registration_success"),
        });
        navigate(
          `/facility/${facilityId}/patient/${resp.data?.id}/consultation`,
        );
      }
    },
  });

  const updatePatientMutation = useMutation(routes.updatePatient, {
    pathParams: { id: patientId || "" },
    body: { ...mutationData, ward_old: undefined },
    onResponse: (data) => {
      if (data.error) {
        Notification.Error({
          msg: t("patient_update_error"),
        });
      } else {
        Notification.Success({
          msg: t("patient_update_success"),
        });
        goBack();
      }
    },
  });

  const patientQuery = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(routes.getPatient, {
      pathParams: { id: patientId || "" },
    }),
    enabled: !!patientId,
  });

  const setAddress = async (args: {
    state: (typeof form)["state"];
    district?: (typeof form)["district"];
    local_body?: (typeof form)["local_body"];
    ward?: string;
  }) => {
    const { state, district, local_body, ward } = args;
    setForm((f) => ({
      ...f,
      state,
    }));
    await new Promise((resolve) => setTimeout(resolve, 500));
    const districts = await districtsQuery.refetch();

    const matchedDistrict = districts.data?.find((d) => d.id === district);
    if (!matchedDistrict) return;
    setForm((f) => ({
      ...f,
      district: matchedDistrict.id,
    }));

    if (local_body) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const localBodies = await localBodyQuery.refetch();

      const matchedLocalBody = localBodies.data?.find(
        (lb) => lb.id === local_body,
      );
      if (!matchedLocalBody) return;
      setForm((f) => ({
        ...f,
        local_body: matchedLocalBody.id,
      }));

      if (ward) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const wards = await wardsQuery.refetch();

        const matchedWard = wards.data?.results.find(
          (w) => w.id === Number(ward),
        );
        if (!matchedWard) return;
        setForm((f) => ({
          ...f,
          ward: matchedWard.id.toString(),
        }));
      }
    }
  };

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
      setAddress({
        state: patientQuery.data.state,
        district: patientQuery.data.district,
        local_body: patientQuery.data.local_body,
        ward: patientQuery.data.ward,
      });
    }
  }, [patientQuery.data]);

  const statesQuery = useQuery({
    queryKey: ["states"],
    queryFn: query(routes.statesList),
  });

  const districtsQuery = useQuery({
    queryKey: ["districts", form.state],
    enabled: !!form.state,
    queryFn: query(routes.getDistrictByState, {
      pathParams: { id: form.state?.toString() || "" },
    }),
  });

  const localBodyQuery = useQuery({
    queryKey: ["localbodies", form.district],
    enabled: !!form.district,
    queryFn: query(routes.getLocalbodyByDistrict, {
      pathParams: { id: form.district?.toString() || "" },
    }),
  });

  const wardsQuery = useQuery({
    queryKey: ["wards", form.local_body],
    enabled: !!form.local_body,
    queryFn: query(routes.getWardByLocalBody, {
      pathParams: { id: form.local_body?.toString() || "" },
    }),
  });

  const handlePincodeChange = async (value: string) => {
    if (!validatePincode(value)) return;
    if (form.state && form.district) return;

    const pincodeDetails = await getPincodeDetails(
      value,
      careConfig.govDataApiKey,
    );
    if (!pincodeDetails) return;

    const matchedState = statesQuery.data?.results?.find((state) => {
      return includesIgnoreCase(state.name, pincodeDetails.statename);
    });
    if (!matchedState) return;
    setForm((f) => ({
      ...f,
      state: matchedState.id,
    }));
    await new Promise((resolve) => setTimeout(resolve, 500));
    const districts = await districtsQuery.refetch();

    const matchedDistrict = districts.data?.find((district) => {
      return includesIgnoreCase(district.name, pincodeDetails.districtname);
    });
    if (!matchedDistrict) return;
    setForm((f) => ({
      ...f,
      district: matchedDistrict.id,
    }));

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

  const errors = { ...feErrors, ...createPatientMutation.error };

  const fieldProps = (field: keyof typeof form) => ({
    value: form[field] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({
        ...f,
        [field]: e.target.value === "" ? undefined : e.target.value,
      })),
    errors: errors[field],
  });

  const selectProps = (field: keyof typeof form) => ({
    value: (form[field] as string)?.toString(),
    onValueChange: (value: string) =>
      setForm((f) => ({ ...f, [field]: value })),
  });

  const handleDialogClose = (action: string) => {
    if (action === "transfer") {
      setShowTransferDialog(true);
    } else if (action === "back") {
      setShowTransferDialog(false);
    } else {
      setSuppressDuplicateWarning(true);
      setShowTransferDialog(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors: Record<string, string[]> = {};
    const requiredFields: Array<keyof typeof form> = [
      "name",
      "phone_number",
      "emergency_phone_number",
      "gender",
      "blood_group",
      ageDob === "dob" ? "date_of_birth" : "year_of_birth",
      "pincode",
      "nationality",
      "address",
      "permanent_address",
    ];

    if (form.nationality === "India") {
      requiredFields.push("state", "district", "local_body");
    }

    requiredFields.forEach((field) => {
      if (!form[field]) {
        errors[field] = errors[field] || [];
        errors[field].push(`This field is required`);
      } else if (
        ageDob === "dob" &&
        field === "date_of_birth" &&
        !/^(19[0-9]{2}|20[0-9]{2}|2100)-(0?[1-9]|1[0-2])-(0?[1-9]|[12]\d|3[01])$/.test(
          form[field],
        )
      ) {
        errors[field] = errors[field] || [];
        errors[field].push(t("invalid_date_format", { format: "DD-MM-YYYY" }));
      } else if (
        (field === "phone_number" || field === "emergency_phone_number") &&
        form[field]?.length < 13
      ) {
        errors[field] = errors[field] || [];
        errors[field].push(t("phone_number_min_error"));
      }
    });

    if (Object.keys(errors).length > 0) {
      setFeErrors(errors);
    } else {
      patientId
        ? updatePatientMutation.mutate()
        : createPatientMutation.mutate();
    }
  };

  const [debouncedNumber, setDebouncedNumber] = useState<string>();

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
      queryParams: {
        phone_number: parsePhoneNumber(debouncedNumber || "") || "",
      },
    }),
    enabled: !!parsePhoneNumber(debouncedNumber || ""),
  });

  const duplicatePatients = patientPhoneSearch.data?.results.filter(
    (p) => p.patient_id !== patientId,
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
          {/* 
          // This will need to be updated
          <PLUGIN_Component
                __name="ExtendPatientRegisterForm"
                facilityId={facilityId}
                patientId={patientId}
                state={state}
                dispatch={dispatch}
                field={field}
              /> */}
          <div id={"general-info"}>
            <h2 className="text-lg font-semibold">
              {t("patient__general-info")}
            </h2>
            <div className="text-sm">{t("general_info_detail")}</div>
            <br />
            <Input
              {...fieldProps("name")}
              required
              label={t("name")}
              placeholder={t("type_patient_name")}
            />
            <br />
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
              required
              label={t("phone_number")}
            />
            <div className="mt-1">
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
                label={t("use_phone_number_for_emergency")}
              />
            </div>
            <br />
            <Input
              {...fieldProps("emergency_phone_number")}
              onChange={(e) => {
                if (e.target.value.length > 13) return;
                setForm((f) => ({
                  ...f,
                  emergency_phone_number: e.target.value,
                }));
              }}
              required
              disabled={samePhoneNumber}
              label={t("emergency_phone_number")}
            />
            {/* <br />
            <Input
              // This field does not exist in the backend, but is present in the design
              required
              label={t("emergency_contact_person_name_details")}
              placeholder={t("emergency_contact_person_name")}
            /> */}
            <br />
            <RadioGroup
              label={t("sex")}
              required
              value={form.gender?.toString()}
              onValueChange={(value) =>
                setForm((f) => ({ ...f, gender: Number(value) }))
              }
              errors={errors["gender"]}
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
            <br />
            <Select {...selectProps("blood_group")}>
              <SelectTrigger
                label={t("blood_group")}
                required
                errors={errors["blood_group"]}
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLOOD_GROUPS.map((bg) => (
                  <SelectItem value={bg}>{bg}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  <Input
                    required
                    placeholder="DD"
                    type="number"
                    label={t("day")}
                    value={form.date_of_birth?.split("-")[2] || ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        date_of_birth: `${form.date_of_birth?.split("-")[0] || ""}-${form.date_of_birth?.split("-")[1] || ""}-${e.target.value}`,
                      }))
                    }
                    errors={errors["date_of_birth"] ? [""] : undefined}
                  />
                  <Input
                    required
                    placeholder="MM"
                    type="number"
                    label={t("month")}
                    value={form.date_of_birth?.split("-")[1] || ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        date_of_birth: `${form.date_of_birth?.split("-")[0] || ""}-${e.target.value}-${form.date_of_birth?.split("-")[2] || ""}`,
                      }))
                    }
                    errors={errors["date_of_birth"] ? [""] : undefined}
                  />
                  <Input
                    required
                    type="number"
                    placeholder="YYYY"
                    label={t("year")}
                    value={form.date_of_birth?.split("-")[0] || ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        date_of_birth: `${e.target.value}-${form.date_of_birth?.split("-")[1] || ""}-${form.date_of_birth?.split("-")[2] || ""}`,
                      }))
                    }
                    errors={errors["date_of_birth"] ? [""] : undefined}
                  />
                </div>
                {errors["date_of_birth"] && (
                  <InputErrors errors={errors["date_of_birth"]} />
                )}
              </TabsContent>
              <TabsContent value="age">
                <div className="bg-yellow-500/10 border border-yellow-500 rounded-md p-4 text-sm text-yellow-800 mb-4">
                  {t("age_input_warning")}
                  <br />
                  <b>{t("age_input_warning_bold")}</b>
                </div>
                <div className="relative">
                  <Input
                    value={
                      form.year_of_birth
                        ? new Date().getFullYear() - (form.year_of_birth || 0)
                        : undefined
                    }
                    errors={errors["year_of_birth"]}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        year_of_birth: e.target.value
                          ? new Date().getFullYear() - Number(e.target.value)
                          : undefined,
                      }))
                    }
                    required
                    type="number"
                    label={t("age")}
                  />
                  {form.year_of_birth && (
                    <div className="text-xs absolute right-6 top-[22px] bottom-0 flex items-center justify-center p-2 pointer-events-none">
                      {t("year_of_birth")} : {form.year_of_birth}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            <br />
            <Textarea
              {...fieldProps("address")}
              label={t("current_address")}
              required
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
            <div className="mt-1">
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
                label={t("use_address_as_permanent")}
              />
            </div>
            <br />
            <Textarea
              {...fieldProps("permanent_address")}
              label={t("permanent_address")}
              required
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
            <Input
              {...fieldProps("pincode")}
              type="number"
              required
              label={t("pincode")}
            />
            {showAutoFilledPincode && (
              <div>
                <CareIcon
                  icon="l-check-circle"
                  className="mr-2 text-sm text-green-500"
                />
                <span className="text-sm text-primary-500">
                  {t("pincode_autofill")}
                </span>
              </div>
            )}
            <br />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Select
                  {...selectProps("nationality")}
                  onValueChange={(value) => {
                    setForm((f) => ({
                      ...f,
                      nationality: value,
                      state: undefined,
                      district: undefined,
                      local_body: undefined,
                      ward: undefined,
                      village: undefined,
                      passport_no: undefined,
                    }));
                  }}
                >
                  <SelectTrigger
                    label={t("nationality")}
                    required
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countryList.map((country) => (
                      <SelectItem value={country} key={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.nationality === "India" ? (
                <>
                  <div>
                    <Select
                      {...selectProps("state")}
                      disabled={statesQuery.isLoading}
                      onValueChange={(value) =>
                        setForm((f) => ({
                          ...f,
                          state: Number(value),
                          district: undefined,
                          local_body: undefined,
                          ward: undefined,
                        }))
                      }
                    >
                      <SelectTrigger
                        label={t("state")}
                        required
                        errors={errors["state"]}
                        className="w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statesQuery.data?.results.map((state) => (
                          <SelectItem value={state.id.toString()}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select
                      {...selectProps("district")}
                      value={form.district?.toString()}
                      onValueChange={(value) =>
                        setForm((f) => ({
                          ...f,
                          district: Number(value),
                          local_body: undefined,
                          ward: undefined,
                        }))
                      }
                      disabled={
                        !form.state ||
                        districtsQuery.isLoading ||
                        !districtsQuery.data?.length
                      }
                    >
                      <SelectTrigger
                        label={t("district")}
                        required
                        errors={errors["district"]}
                        className="w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {districtsQuery.data?.map((district) => (
                          <SelectItem value={district.id.toString()}>
                            {district.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select
                      {...selectProps("local_body")}
                      onValueChange={(value) =>
                        setForm((f) => ({
                          ...f,
                          local_body: Number(value),
                          ward: undefined,
                        }))
                      }
                      disabled={
                        !form.district ||
                        localBodyQuery.isLoading ||
                        !localBodyQuery.data?.length
                      }
                    >
                      <SelectTrigger
                        label={t("local_body")}
                        required
                        errors={errors["local_body"]}
                        className="w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {localBodyQuery.data?.map((localbody) => (
                          <SelectItem value={localbody.id.toString()}>
                            {localbody.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select
                      {...selectProps("ward")}
                      disabled={
                        !form.local_body ||
                        wardsQuery.isLoading ||
                        !wardsQuery.data?.results.length
                      }
                    >
                      <SelectTrigger
                        label={t("ward")}
                        errors={errors["ward"]}
                        className="w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {wardsQuery.data?.results.map((ward) => (
                          <SelectItem value={ward.id.toString()}>
                            {ward.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input {...fieldProps("village")} label={t("village")} />
                </>
              ) : (
                <Input
                  {...fieldProps("passport_no")}
                  label={t("passport_number")}
                />
              )}
            </div>
          </div>
          <div id="social-profile" className="mt-10">
            <h2 className="text-lg font-semibold">
              {t("patient__social-profile")}
            </h2>
            <div className="text-sm">{t("social_profile_detail")}</div>
            <br />
            <div>
              <Select
                value={form.meta_info?.occupation}
                onValueChange={(value) =>
                  setForm((f) => ({
                    ...f,
                    meta_info: { ...(f.meta_info as any), occupation: value },
                  }))
                }
              >
                <SelectTrigger label={t("occupation")} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OCCUPATION_TYPES.map((occupation) => (
                    <SelectItem value={occupation.value}>
                      {occupation.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <br />
            <div>
              <Select {...selectProps("ration_card_category")}>
                <SelectTrigger
                  label={t("ration_card_category")}
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RATION_CARD_CATEGORY.map((rcg) => (
                    <SelectItem value={rcg}>
                      {t(`ration_card__${rcg}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <br />
            <RadioGroup
              label={t("socioeconomic_status")}
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
                <>
                  <RadioGroupItem value={sec} id={"sec_" + sec} />
                  <Label htmlFor={"sec_" + sec}>
                    {t(`SOCIOECONOMIC_STATUS__${sec}`)}
                  </Label>
                </>
              ))}
            </RadioGroup>
            <br />
            <RadioGroup
              label={t("has_domestic_healthcare_support")}
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
                <>
                  <RadioGroupItem value={dhs} id={"dhs_" + dhs} />
                  <Label htmlFor={"dhs_" + dhs}>
                    {t(`DOMESTIC_HEALTHCARE_SUPPORT__${dhs}`)}
                  </Label>
                </>
              ))}
            </RadioGroup>
          </div>
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
          <div className="flex justify-end mt-20">
            <Button
              type="submit"
              variant={"primary"}
              disabled={
                patientId
                  ? updatePatientMutation.isProcessing
                  : createPatientMutation.isProcessing
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
      {!!duplicatePatients?.length && (
        <DialogModal
          show={showTransferDialog}
          onClose={() => {
            handleDialogClose("close");
          }}
          title="Patient Transfer Form"
          className="max-w-md md:min-w-[600px]"
        >
          <TransferPatientDialog
            patientList={duplicatePatients}
            handleOk={() => handleDialogClose("close")}
            handleCancel={() => {
              handleDialogClose("close");
            }}
            facilityId={facilityId}
          />
        </DialogModal>
      )}
    </Page>
  );
}
