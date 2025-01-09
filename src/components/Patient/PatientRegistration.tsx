import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { navigate, useQueryParams } from "raviger";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import SectionNavigator from "@/CAREUI/misc/SectionNavigator";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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

import { PLUGIN_Component } from "@/PluginEngine";
import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { parsePhoneNumber } from "@/Utils/utils";
import OrganizationSelector from "@/pages/Organization/components/OrganizationSelector";
import { PatientModel } from "@/types/emr/patient";
import { Organization } from "@/types/organization/organization";

import Autocomplete from "../ui/autocomplete";

interface PatientRegistrationPageProps {
  facilityId: string;
  patientId?: string;
}

export const GENDERS = GENDER_TYPES.map((gender) => gender.id) as [
  (typeof GENDER_TYPES)[number]["id"],
];

export const BLOOD_GROUPS = BLOOD_GROUP_CHOICES.map((bg) => bg.id) as [
  (typeof BLOOD_GROUP_CHOICES)[number]["id"],
];

const formSchema = z
  .object({
    name: z.string().nonempty("Name is required"),
    phone_number: z
      .string()
      .regex(/^\+\d{12}$/, "Phone number must be a 10-digit mobile number"),
    same_phone_number: z.boolean(),
    emergency_phone_number: z
      .string()
      .regex(
        /^\+\d{12}$/,
        "Emergency phone number must be a 10-digit mobile number",
      ),
    gender: z.enum(GENDERS, { required_error: "Gender is required" }),
    blood_group: z.enum(BLOOD_GROUPS, {
      required_error: "Blood group is required",
    }),
    yob_or_dob: z.enum(["dob", "age"]),
    date_of_birth: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Date of birth must be in YYYY-MM-DD format",
      )
      .optional(),
    year_of_birth: z
      .string()
      .regex(/^\d{4}$/, "Year of birth must be in YYYY format")
      .optional(),
    address: z.string().nonempty("Address is required"),
    same_address: z.boolean(),
    permanent_address: z.string().nonempty("Emergency address is required"),
    pincode: z
      .number()
      .int()
      .positive()
      .min(100000, "Pincode must be a 6-digit number")
      .max(999999, "Pincode must be a 6-digit number"),
    nationality: z.string().nonempty("Nationality is required"),
    geo_organization: z
      .string()
      .uuid("Geo organization must be a valid UUID")
      .optional(),
  })
  .refine((data) => (data.yob_or_dob === "dob" ? !!data.date_of_birth : true), {
    message: "Date of birth must be present",
    path: ["date_of_birth"],
  })
  .refine((data) => (data.yob_or_dob === "age" ? !!data.year_of_birth : true), {
    message: "Year of birth must be present",
    path: ["year_of_birth"],
  })
  .refine(
    (data) => (data.nationality === "India" ? !!data.geo_organization : true),
    {
      message: "Geo organization is required when nationality is India",
      path: ["geo_organization"],
    },
  );

export default function PatientRegistration(
  props: PatientRegistrationPageProps,
) {
  const [{ phone_number }] = useQueryParams();
  const { patientId, facilityId } = props;
  const { t } = useTranslation();
  const { goBack } = useAppHistory();

  const [suppressDuplicateWarning, setSuppressDuplicateWarning] =
    useState(!!patientId);
  const [debouncedNumber, setDebouncedNumber] = useState<string>();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nationality: "India",
      phone_number: phone_number || "+91",
      emergency_phone_number: "+91",
      yob_or_dob: "dob",
    },
  });

  const createPatientMutation = useMutation({
    mutationFn: mutate(routes.addPatient),
    onSuccess: (resp: PatientModel) => {
      Notification.Success({
        msg: t("patient_registration_success"),
      });
      // Lets navigate the user to the verify page as the patient is not accessible to the user yet
      navigate(`/facility/${facilityId}/patients/verify`, {
        query: {
          phone_number: resp.phone_number,
          year_of_birth:
            form.getValues("yob_or_dob") === "dob"
              ? new Date(resp.date_of_birth!).getFullYear()
              : new Date().getFullYear() - Number(resp.age!),
          partial_id: resp?.id?.slice(0, 5),
        },
      });
    },
    onError: () => {
      Notification.Error({
        msg: t("patient_registration_error"),
      });
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: mutate(routes.updatePatient, {
      pathParams: { id: patientId || "" },
    }),
    onSuccess: () => {
      Notification.Success({
        msg: t("patient_update_success"),
      });
      goBack();
    },
    onError: () => {
      Notification.Error({
        msg: t("patient_update_error"),
      });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (patientId) {
      updatePatientMutation.mutate({ ...values, ward_old: undefined });
      return;
    }

    createPatientMutation.mutate({
      ...values,
      facility: facilityId,
      ward_old: undefined,
    });
  }

  const sidebarItems = [
    { label: t("patient__general-info"), id: "general-info" },
  ];

  const title = !patientId
    ? t("add_details_of_patient")
    : t("update_patient_details");

  const handleDialogClose = (action: string) => {
    if (action === "transfer") {
      navigate(`/facility/${facilityId}/patients`, {
        query: {
          phone_number: form.getValues("phone_number"),
        },
      });
    } else {
      setSuppressDuplicateWarning(true);
    }
  };

  const patientPhoneSearch = useQuery({
    queryKey: ["patients", "phone-number", debouncedNumber],
    queryFn: query(routes.searchPatient, {
      body: {
        phone_number: parsePhoneNumber(debouncedNumber || "") || "",
      },
    }),
    enabled: !!parsePhoneNumber(debouncedNumber || ""),
  });

  const duplicatePatients = useMemo(() => {
    return patientPhoneSearch.data?.results.filter((p) => p.id !== patientId);
  }, [patientPhoneSearch.data, patientId]);

  const patientQuery = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(routes.getPatient, {
      pathParams: { id: patientId || "" },
    }),
    enabled: !!patientId,
  });

  useEffect(() => {
    if (patientQuery.data) {
      form.reset({
        ...patientQuery.data,
        same_phone_number:
          patientQuery.data.phone_number ===
          patientQuery.data.emergency_phone_number,
        same_address:
          patientQuery.data.address === patientQuery.data.permanent_address,
        yob_or_dob: patientQuery.data.date_of_birth ? "dob" : "age",
        geo_organization: (
          patientQuery.data.geo_organization as unknown as Organization
        )?.id,
      } as unknown as z.infer<typeof formSchema>);
    }
  }, [patientQuery.data]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = setTimeout(() => {
      const phoneNumber = form.getValues("phone_number");
      if (!patientId || patientQuery.data?.phone_number !== phoneNumber) {
        setSuppressDuplicateWarning(false);
      }
      setDebouncedNumber(phoneNumber);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [form.watch("phone_number")]); // eslint-disable-line react-hooks/exhaustive-deps

  if (patientId && patientQuery.isLoading) {
    return <Loading />;
  }

  return (
    <Page title={title}>
      <hr className="mt-4" />
      <div className="relative mt-4 flex flex-col md:flex-row gap-4">
        <SectionNavigator sections={sidebarItems} className="hidden md:flex" />

        <Form {...form}>
          <form
            className="md:w-[500px] space-y-10"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <PLUGIN_Component
              __name="PatientRegistrationForm"
              form={form}
              patientId={patientId}
            />

            <div id="general-info" className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">
                  {t("patient__general-info")}
                </h2>
                <div className="text-sm">{t("general_info_detail")}</div>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("name")}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder={t("type_patient_name")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("phone_number")}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => {
                          form.setValue("phone_number", e.target.value);
                          if (form.watch("same_phone_number")) {
                            form.setValue(
                              "emergency_phone_number",
                              e.target.value,
                            );
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      <FormField
                        control={form.control}
                        name="same_phone_number"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(v) => {
                                  field.onChange(v);
                                  if (v) {
                                    form.setValue(
                                      "emergency_phone_number",
                                      form.watch("phone_number"),
                                    );
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel>
                              {t("use_phone_number_for_emergency")}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergency_phone_number"
                disabled={form.watch("same_phone_number")}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("emergency_phone_number")}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>
                      {t("sex")}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        {...field}
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex gap-5 flex-wrap"
                      >
                        {GENDER_TYPES.map((g) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={g.id} />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {t(`GENDER__${g.id}`)}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="blood_group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("blood_group")}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select
                      {...field}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("please_select_blood_group")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BLOOD_GROUP_CHOICES.map((bg) => (
                          <SelectItem value={bg.id}>{bg.text}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Tabs
                value={form.watch("yob_or_dob")}
                onValueChange={(v) =>
                  form.setValue("yob_or_dob", v as "dob" | "age")
                }
              >
                <TabsList className="mb-2" defaultValue="dob">
                  <TabsTrigger value="dob">{t("date_of_birth")}</TabsTrigger>
                  <TabsTrigger value="age">{t("age")}</TabsTrigger>
                </TabsList>
                <TabsContent value="dob">
                  <FormField
                    control={form.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center">
                                <FormLabel>{t("day")}</FormLabel>
                                <span className="text-red-500">*</span>
                              </div>
                              <Input
                                type="number"
                                placeholder="DD"
                                {...field}
                                value={
                                  form.watch("date_of_birth")?.split("-")[2]
                                }
                                onChange={(e) =>
                                  form.setValue(
                                    "date_of_birth",
                                    `${form.watch("date_of_birth")?.split("-")[0]}-${form.watch("date_of_birth")?.split("-")[1]}-${e.target.value}`,
                                  )
                                }
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <div className="flex items-center">
                                <FormLabel>{t("month")}</FormLabel>
                                <span className="text-red-500">*</span>
                              </div>
                              <Input
                                type="number"
                                placeholder="MM"
                                {...field}
                                value={
                                  form.watch("date_of_birth")?.split("-")[1]
                                }
                                onChange={(e) =>
                                  form.setValue(
                                    "date_of_birth",
                                    `${form.watch("date_of_birth")?.split("-")[0]}-${e.target.value}-${form.watch("date_of_birth")?.split("-")[2]}`,
                                  )
                                }
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <div className="flex items-center">
                                <FormLabel>{t("year")}</FormLabel>
                                <span className="text-red-500">*</span>
                              </div>
                              <Input
                                type="number"
                                placeholder="YYYY"
                                {...field}
                                value={
                                  form.watch("date_of_birth")?.split("-")[0]
                                }
                                onChange={(e) =>
                                  form.setValue(
                                    "date_of_birth",
                                    `${e.target.value}-${form.watch("date_of_birth")?.split("-")[1]}-${form.watch("date_of_birth")?.split("-")[2]}`,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                <TabsContent value="age">
                  <div className="bg-yellow-500/10 border border-yellow-500 rounded-md p-4 text-sm text-yellow-800 mb-4">
                    {t("age_input_warning")}
                    <br />
                    <b>{t("age_input_warning_bold")}</b>
                  </div>

                  <FormField
                    control={form.control}
                    name="year_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("age")}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={t("age")}
                            {...field}
                            value={
                              new Date().getFullYear() -
                              Number(form.watch("year_of_birth"))
                            }
                            onChange={(e) =>
                              form.setValue(
                                "year_of_birth",
                                String(
                                  new Date().getFullYear() -
                                    Number(e.target.value),
                                ),
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("current_address")}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        onChange={(e) => {
                          form.setValue("address", e.target.value);
                          if (form.watch("same_address")) {
                            form.setValue("permanent_address", e.target.value);
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      <FormField
                        control={form.control}
                        name="same_address"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(v) => {
                                  field.onChange(v);
                                  if (v) {
                                    form.setValue(
                                      "permanent_address",
                                      form.watch("address"),
                                    );
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel>
                              {t("use_address_as_permanent")}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="permanent_address"
                disabled={form.watch("same_address")}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("permanent_address")}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("pincode")}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          form.setValue("pincode", Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("nationality")}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Autocomplete
                          options={countryList.map((c) => ({
                            label: c,
                            value: c,
                          }))}
                          {...field}
                          onChange={(value) =>
                            form.setValue("nationality", value)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("nationality") === "India" && (
                  <FormField
                    control={form.control}
                    name="geo_organization"
                    render={({ field }) => (
                      <FormItem className="contents">
                        <FormControl>
                          <OrganizationSelector
                            {...field}
                            required={true}
                            value={form.watch("geo_organization")}
                            onChange={(value) =>
                              form.setValue("geo_organization", value)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                variant={"secondary"}
                type="button"
                onClick={() => goBack()}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={
                  createPatientMutation.isPending ||
                  updatePatientMutation.isPending
                }
              >
                {patientId ? t("save") : t("save_and_continue")}
              </Button>
            </div>
          </form>
        </Form>
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
