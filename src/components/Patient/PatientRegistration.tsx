import careConfig from "@careConfig";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { InfoIcon } from "lucide-react";
import { navigate, useNavigationPrompt, useQueryParams } from "raviger";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { isValidPhoneNumber } from "react-phone-number-input";
import { toast } from "sonner";
import { z } from "zod";

import { tzAwareDateTime } from "@/lib/validators";

import SectionNavigator from "@/CAREUI/misc/SectionNavigator";

import RadioInput from "@/components/ui/RadioInput";
import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import DateField from "@/components/ui/date-field";
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
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { DateTimeInput } from "@/components/Common/DateTimeInput";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import DuplicatePatientDialog from "@/components/Facility/DuplicatePatientDialog";
import { TagSelectorPopover } from "@/components/Tags/TagAssignmentSheet";

import useAppHistory from "@/hooks/useAppHistory";

import { BLOOD_GROUP_CHOICES, GENDER_TYPES } from "@/common/constants";
import { GENDERS } from "@/common/constants";
import countryList from "@/common/static/countries.json";

import { PLUGIN_Component } from "@/PluginEngine";
import dayjs from "@/Utils/dayjs";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { dateQueryString } from "@/Utils/utils";
import validators from "@/Utils/validators";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import GovtOrganizationSelector from "@/pages/Organization/components/GovtOrganizationSelector";
import {
  BloodGroupChoices,
  PatientIdentifierCreate,
  PatientRead,
} from "@/types/emr/patient/patient";
import patientApi from "@/types/emr/patient/patientApi";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import { Organization } from "@/types/organization/organization";

interface PatientRegistrationPageProps {
  facilityId?: string;
  patientId?: string;
}

export const BLOOD_GROUPS = BLOOD_GROUP_CHOICES.map((bg) => bg.id) as [
  (typeof BLOOD_GROUP_CHOICES)[number]["id"],
];

export default function PatientRegistration(
  props: PatientRegistrationPageProps,
) {
  const { enableMinimalPatientRegistration } = careConfig;
  const [{ phone_number }] = useQueryParams();
  const { patientId, facilityId } = props;
  const { t } = useTranslation();
  const { goBack } = useAppHistory();
  const defaultCountry = careConfig.defaultCountry.name;
  const { facility } = useCurrentFacility();

  const [suppressDuplicateWarning, setSuppressDuplicateWarning] =
    useState(!!patientId);
  const [selectedTags, setSelectedTags] = useState<TagConfig[]>([]);

  const formSchema = useMemo(
    () =>
      z
        .object({
          name: z.string().trim().nonempty(t("name_is_required")),
          phone_number: validators().phoneNumber.required,
          same_phone_number: z.boolean(),
          emergency_phone_number: validators().phoneNumber.required,
          gender: z.enum(GENDERS, { required_error: t("gender_is_required") }),
          blood_group: z.nativeEnum(BloodGroupChoices, {
            required_error: t("blood_group_is_required"),
          }),
          age_or_dob: z.enum(["dob", "age"]),
          date_of_birth: z
            .string()
            .nonempty(t("date_of_birth_must_be_present"))
            .regex(/^\d{4}-\d{2}-\d{2}$/, t("date_of_birth_format"))
            .refine((date) => {
              const parsedDate = dayjs(date);
              return parsedDate.isValid() && !parsedDate.isAfter(dayjs());
            }, t("enter_valid_dob"))
            .optional(),
          deceased_datetime: tzAwareDateTime.optional().nullable(),
          age: z
            .number()
            .int()
            .positive()
            .min(1, t("age_must_be_positive"))
            .max(120, t("age_must_be_below_120"))
            .optional(),
          address: enableMinimalPatientRegistration
            ? z.string().trim().optional()
            : z.string().trim().nonempty(t("address_is_required")),
          same_address: z.boolean(),
          permanent_address: enableMinimalPatientRegistration
            ? z.string().trim().optional()
            : z.string().trim().nonempty(t("field_required")),
          pincode: enableMinimalPatientRegistration
            ? validators().pincode.optional()
            : validators().pincode,
          nationality: z.string().nonempty(t("nationality_is_required")),
          geo_organization: z.string().uuid({
            message: enableMinimalPatientRegistration
              ? t("minimal_patient_registration_geo_organization_required")
              : t("geo_organization_is_required"),
          }),
          _selected_levels: z.array(z.custom<Organization>()),
          _is_deceased: z.boolean(),
          identifiers: z.array(
            z.object({
              config: z.string().uuid(),
              value: z.string().optional(),
            }),
          ),
        })
        .superRefine((data, ctx) => {
          if (data.age_or_dob === "dob" && !data.date_of_birth) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("date_of_birth_must_be_present"),
              path: ["date_of_birth"],
            });
          }
          if (data.age_or_dob === "age" && !data.age) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("age_must_be_present"),
              path: ["age"],
            });
          }

          if (data.nationality === defaultCountry && !data.geo_organization) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("geo_organization_required"),
              path: ["geo_organization"],
            });
          }
          if (data.deceased_datetime) {
            const deathDate = dayjs(data.deceased_datetime);
            if (!deathDate.isValid()) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: t("invalid_date_format", {
                  format: "DD-MM-YYYY HH:mm",
                }),
                path: ["deceased_datetime"],
              });
            } else {
              const dob = data.date_of_birth
                ? dayjs(data.date_of_birth)
                : dayjs().subtract(data.age || 0, "years");
              const valid = data.date_of_birth
                ? dob.isBefore(deathDate)
                : dob.year() < deathDate.year();
              if (!valid) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: t("death_date_must_be_after_dob"),
                  path: ["deceased_datetime"],
                });
              }
            }
          }

          const identifierConfigs =
            facility?.patient_instance_identifier_configs || [];
          const identifiers = data.identifiers || [];
          identifiers.forEach((identifier, index) => {
            const config = identifierConfigs.find(
              (c) => c.id === identifier.config,
            );
            const isAutogenerated = !!config?.config.default_value;
            if (
              config?.config.required &&
              !identifier.value &&
              !isAutogenerated
            ) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: config?.config.display + " " + t("is_required"),
                path: ["identifiers", index, "value"],
              });
            }
          });
        }),
    [facility], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nationality: defaultCountry,
      phone_number: phone_number || "",
      emergency_phone_number: "",
      age_or_dob: "dob",
      date_of_birth: "",
      same_phone_number: false,
      same_address: true,
      _selected_levels: [],
      _is_deceased: false,
    },
    mode: "onSubmit",
  });

  const { mutate: createPatient, isPending: isCreatingPatient } = useMutation({
    mutationKey: ["create_patient"],
    mutationFn: mutate(patientApi.addPatient),
    onSuccess: (resp: PatientRead) => {
      toast.success(t("patient_registration_success"));
      // Lets navigate the user to the verify page as the patient is not accessible to the user yet
      navigate(`/facility/${facilityId}/patients/verify`, {
        query: {
          phone_number: resp.phone_number,
          year_of_birth: resp.year_of_birth,
          partial_id: resp?.id?.slice(0, 5),
        },
      });
    },
    onError: () => {
      toast.error(t("patient_registration_error"));
    },
  });

  const {
    mutate: updatePatient,
    isPending: isUpdatingPatient,
    isSuccess: isUpdateSuccess,
  } = useMutation({
    mutationFn: mutate(patientApi.updatePatient, {
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

  function onSubmit(values: z.infer<typeof formSchema>) {
    const editableIdentifiers = values.identifiers.filter((identifier) => {
      const config = facility?.patient_instance_identifier_configs.find(
        (c) => c.id === identifier.config,
      );
      return !config?.config.default_value && !!identifier.value;
    }) as PatientIdentifierCreate[];

    if (patientId) {
      updatePatient({
        ...values,
        age: values.age_or_dob === "age" ? values.age : undefined,
        date_of_birth:
          values.age_or_dob === "dob" ? values.date_of_birth : undefined,
        emergency_phone_number: values.same_phone_number
          ? values.phone_number
          : values.emergency_phone_number,
        permanent_address: values.same_address
          ? values.address
          : values.permanent_address,
        pincode: values.pincode || undefined,
        identifiers: editableIdentifiers,
      });
      return;
    } else if (facilityId) {
      createPatient({
        ...values,
        emergency_phone_number: values.same_phone_number
          ? values.phone_number
          : values.emergency_phone_number,
        permanent_address: values.same_address
          ? values.address
          : values.permanent_address,
        facility: facilityId,
        pincode: values.pincode || undefined,
        tags: selectedTags.map((tag) => tag.id),
        identifiers: editableIdentifiers,
      });
    }
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

  const phoneNumber = form.watch("phone_number");

  const patientPhoneSearch = useQuery({
    queryKey: ["patients", "phone-number", phoneNumber],
    queryFn: query.debounced(patientApi.searchPatient, {
      body: {
        phone_number: phoneNumber,
      },
    }),
    enabled: isValidPhoneNumber(phoneNumber),
  });

  const duplicatePatients = useMemo(() => {
    return patientPhoneSearch.data?.results.filter((p) => p.id !== patientId);
  }, [patientPhoneSearch.data, patientId]);

  const patientQuery = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(patientApi.getPatient, {
      pathParams: { id: patientId || "" },
    }),
    enabled: !!patientId,
  });

  useEffect(() => {
    if (patientQuery.data && facility) {
      form.reset({
        _selected_levels: [
          patientQuery.data.geo_organization as unknown as Organization,
        ],
        _is_deceased: !!patientQuery.data.deceased_datetime,
        name: patientQuery.data.name || "",
        phone_number: patientQuery.data.phone_number || "",
        emergency_phone_number: patientQuery.data.emergency_phone_number || "",
        same_phone_number:
          patientQuery.data.phone_number ===
          patientQuery.data.emergency_phone_number,
        same_address:
          patientQuery.data.address === patientQuery.data.permanent_address,
        gender: patientQuery.data.gender as (typeof GENDERS)[number],
        blood_group: patientQuery.data.blood_group,
        age_or_dob: patientQuery.data.date_of_birth ? "dob" : "age",
        date_of_birth: patientQuery.data.date_of_birth || undefined,
        age:
          !patientQuery.data.date_of_birth && patientQuery.data.year_of_birth
            ? new Date().getFullYear() - patientQuery.data.year_of_birth
            : undefined,
        address: patientQuery.data.address || "",
        permanent_address: patientQuery.data.permanent_address || "",
        pincode: patientQuery.data.pincode || undefined,
        nationality: patientQuery.data.nationality || defaultCountry,
        geo_organization: (
          patientQuery.data.geo_organization as unknown as Organization
        )?.id,
        deceased_datetime: null,
        identifiers: facility.patient_instance_identifier_configs.map(
          (identifierConfig) => {
            const identifier = patientQuery.data.instance_identifiers?.find(
              (i) => i.config.id === identifierConfig.id,
            );
            return {
              config: identifierConfig.id,
              value: identifier?.value,
            };
          },
        ),
      } as unknown as z.infer<typeof formSchema>);
    } else if (facility) {
      form.setValue(
        "identifiers",
        facility.patient_instance_identifier_configs.map(
          (identifierConfig) => ({
            config: identifierConfig.id,
            value: "",
          }),
        ),
      );
    }
  }, [patientQuery.data, facility]);

  const showDuplicate =
    !patientPhoneSearch.isLoading &&
    !!duplicatePatients?.length &&
    !!isValidPhoneNumber(phoneNumber) &&
    !suppressDuplicateWarning;

  // TODO: Use useBlocker hook after switching to tanstack router
  // https://tanstack.com/router/latest/docs/framework/react/guide/navigation-blocking#how-do-i-use-navigation-blocking
  useNavigationPrompt(
    form.formState.isDirty &&
      !isCreatingPatient &&
      !(isUpdatingPatient || isUpdateSuccess) &&
      !showDuplicate,
    t("unsaved_changes"),
  );

  if (patientId && patientQuery.isLoading) {
    return <Loading />;
  }

  return (
    <Page title={title}>
      <hr className="mt-4 border-gray-200" />
      <div className="relative mt-4 flex flex-col md:flex-row gap-4">
        <SectionNavigator sections={sidebarItems} className="hidden md:flex" />

        <Form {...form}>
          <form
            className="md:w-[500px] space-y-10"
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              console.log("errors", errors);
            })}
          >
            <PLUGIN_Component
              __name="PatientRegistrationForm"
              form={form}
              facilityId={facilityId}
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
                    <FormLabel aria-required>{t("name")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("type_patient_name")}
                        {...field}
                        data-cy="patient-name-input"
                      />
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
                    <FormLabel aria-required>{t("phone_number")}</FormLabel>
                    <FormControl>
                      <PhoneInput
                        {...field}
                        onChange={(value) => {
                          field.onChange(value);
                          if (form.getValues("same_phone_number")) {
                            form.setValue(
                              "emergency_phone_number",
                              value || "",
                              { shouldDirty: true },
                            );
                          }
                        }}
                        data-cy="patient-phone-input"
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
                                      { shouldValidate: true },
                                    );
                                  } else {
                                    form.setValue(
                                      "emergency_phone_number",
                                      "",
                                      { shouldValidate: true },
                                    );
                                  }
                                }}
                                data-cy="same-phone-number-checkbox"
                                className="mt-2"
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
                    <FormLabel aria-required>
                      {t("emergency_phone_number")}
                    </FormLabel>
                    <FormControl>
                      <PhoneInput
                        {...field}
                        data-cy="patient-emergency-phone-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel aria-required>{t("sex")}</FormLabel>
                    <FormControl>
                      <RadioInput
                        {...field}
                        onValueChange={field.onChange}
                        value={field.value ?? undefined}
                        options={GENDER_TYPES.map((g) => ({
                          value: g.id,
                          label: t(`GENDER__${g.id}`),
                        }))}
                      />
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
                    <FormLabel aria-required>{t("blood_group")}</FormLabel>
                    <Select
                      {...field}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger
                          data-cy="blood-group-select"
                          ref={field.ref}
                        >
                          <SelectValue
                            placeholder={t("please_select_blood_group")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BLOOD_GROUP_CHOICES.map((bg) => (
                          <SelectItem key={bg.id} value={bg.id}>
                            {bg.text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tag Selector (only for create) */}
              {!patientId && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">{t("tags")}</h3>
                  <TagSelectorPopover
                    selected={selectedTags}
                    onChange={setSelectedTags}
                    resource={TagResource.PATIENT}
                  />
                </div>
              )}

              <Tabs
                value={form.watch("age_or_dob")}
                onValueChange={(v) => {
                  form.setValue("age_or_dob", v as "dob" | "age");
                  if (v === "age") {
                    form.setValue("date_of_birth", undefined);
                  } else {
                    form.setValue("age", undefined);
                  }
                }}
              >
                <TabsList className="mb-2" defaultValue="dob">
                  <TabsTrigger value="dob" data-cy="dob-tab">
                    {t("date_of_birth")}
                  </TabsTrigger>
                  <TabsTrigger value="age" data-cy="age-tab">
                    {t("age")}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="dob">
                  <FormField
                    control={form.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <DateField
                            date={
                              field.value ? new Date(field.value) : undefined
                            }
                            onChange={(date) =>
                              field.onChange(dateQueryString(date))
                            }
                            id="dob"
                          />
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
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel aria-required>{t("age")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder={t("age")}
                            min={1}
                            max={120}
                            {...field}
                            onChange={(e) =>
                              form.setValue(
                                "age",
                                e.target.value
                                  ? Number(e.target.value)
                                  : (null as unknown as number),
                                { shouldDirty: true },
                              )
                            }
                            data-cy="age-input"
                          />
                        </FormControl>

                        <FormMessage />
                        {form.getValues("age") && (
                          <div className="text-sm font-bold">
                            {Number(form.getValues("age")) <= 0 ? (
                              <span className="text-red-600">
                                {t("invalid_age")}
                              </span>
                            ) : (
                              <span
                                className="text-violet-600"
                                data-cy="year-of-birth"
                              >
                                {t("year_of_birth")}:{" "}
                                {new Date().getFullYear() -
                                  Number(form.getValues("age"))}
                              </span>
                            )}
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <div className="space-y-4 rounded-lg bg-white p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold">
                      {t("deceased_status")}
                    </h2>
                    <span
                      className="text-sm text-gray-500
"
                    >
                      ({t("only_mark_if_applicable")})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="is-deceased"
                      checked={form.watch("_is_deceased")}
                      onCheckedChange={(checked) => {
                        form.setValue("_is_deceased", checked as boolean);
                        form.setValue(
                          "deceased_datetime",
                          checked ? form.getValues("deceased_datetime") : "",
                        );
                      }}
                      data-cy="is-deceased-checkbox"
                    />
                    <label
                      htmlFor="is-deceased"
                      className="text-sm font-medium"
                    >
                      {t("patient_is_deceased")}
                    </label>
                  </div>
                </div>

                {(form.watch("_is_deceased") ||
                  form.watch("deceased_datetime")) && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-4 text-gray-500">
                      <InfoIcon className="size-4" />
                      <p className="text-sm text-gray-500">
                        {t("deceased_disclaimer")}
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="deceased_datetime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("date_and_time_of_death")}</FormLabel>
                          <FormControl>
                            <DateTimeInput
                              id="death-datetime"
                              data-cy="death-datetime-input"
                              value={field.value ?? ""}
                              onDateChange={(val) => {
                                field.onChange(val);
                                form.setValue("_is_deceased", !!val);
                              }}
                              max={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      aria-required={!enableMinimalPatientRegistration}
                    >
                      {t("current_address")}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          if (form.getValues("same_address")) {
                            form.setValue("permanent_address", e.target.value, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }
                        }}
                        data-cy="current-address-input"
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
                                      form.getValues("address"),
                                      { shouldValidate: true },
                                    );
                                  }
                                }}
                                data-cy="same-address-checkbox"
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
                    <FormLabel
                      aria-required={!enableMinimalPatientRegistration}
                    >
                      {t("permanent_address")}
                    </FormLabel>
                    <FormControl>
                      <Textarea {...field} data-cy="permanent-address-input" />
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
                    <FormLabel
                      aria-required={!enableMinimalPatientRegistration}
                    >
                      {t("pincode")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value
                            ? Number(e.target.value)
                            : undefined;
                          field.onChange(value);
                        }}
                        value={field.value || undefined}
                        data-cy="pincode-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel aria-required>{t("nationality")}</FormLabel>
                      <FormControl>
                        <Autocomplete
                          options={countryList.map((c) => ({
                            label: c,
                            value: c,
                          }))}
                          {...field}
                          onChange={(value) =>
                            form.setValue("nationality", value, {
                              shouldDirty: true,
                            })
                          }
                          data-cy="nationality-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {form.watch("nationality") === defaultCountry && (
                  <FormField
                    control={form.control}
                    name="geo_organization"
                    render={({ field }) => (
                      <FormItem className="contents">
                        <FormControl>
                          <GovtOrganizationSelector
                            {...field}
                            required={!enableMinimalPatientRegistration}
                            selected={form.watch("_selected_levels")}
                            value={form.watch("geo_organization")}
                            onChange={(value) =>
                              form.setValue("geo_organization", value, {
                                shouldDirty: true,
                                shouldValidate: form.formState.isSubmitted,
                              })
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

            {/* TODO: Move Patient Identifier edit out to Patient display page */}
            {/* Patient Identifiers */}
            {facility && facility.patient_instance_identifier_configs && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">{t("identifiers")}</h2>
                {facility.patient_instance_identifier_configs.map((c, idx) => {
                  const identifiers = form.watch("identifiers") || [];
                  const identifierValue = identifiers[idx]?.value || "";
                  const isAutogenerated = !!c.config.default_value;
                  const isRequired = c.config.required && !isAutogenerated;
                  return (
                    <FormField
                      key={c.id}
                      control={form.control}
                      name={`identifiers.${idx}.value` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel aria-required={isRequired}>
                            {c.config.display}
                          </FormLabel>
                          <FormDescription>
                            {c.config.description}
                          </FormDescription>
                          <FormControl>
                            <Input
                              {...field}
                              value={identifierValue}
                              onChange={(e) => {
                                const value = e.target.value;
                                const identifiers = [
                                  ...(form.getValues("identifiers") || []),
                                ];
                                identifiers[idx] = {
                                  config: c.id || "",
                                  value,
                                };
                                form.setValue("identifiers", identifiers, {
                                  shouldDirty: true,
                                  shouldValidate: form.formState.isSubmitted,
                                });
                              }}
                              placeholder={
                                isAutogenerated
                                  ? t("identifier_value_autogenerated")
                                  : t("enter_identifier_value")
                              }
                              disabled={isAutogenerated}
                              data-cy={`identifier-input-${c.id || ""}`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  );
                })}
              </div>
            )}

            <div className="flex justify-end gap-4">
              <Button
                variant={"secondary"}
                type="button"
                onClick={() => goBack(`/facility/${facilityId}/patients`)}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={
                  isCreatingPatient ||
                  isUpdatingPatient ||
                  !form.formState.isDirty
                }
              >
                {patientId ? t("save") : t("save_and_continue")}
              </Button>
            </div>
          </form>
        </Form>
      </div>
      {showDuplicate && (
        <DuplicatePatientDialog
          open={showDuplicate}
          patientList={duplicatePatients}
          handleOk={handleDialogClose}
          onOpenChange={(open) => {
            if (!open) {
              handleDialogClose("close");
            }
          }}
        />
      )}
    </Page>
  );
}
