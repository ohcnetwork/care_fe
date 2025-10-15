import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2Icon } from "lucide-react";
import { navigate } from "raviger";
import * as React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import Page from "@/components/Common/Page";
import RequirementsSelector from "@/components/Common/RequirementsSelector";
import { ResourceCategoryPicker } from "@/components/Common/ResourceCategoryPicker";
import { ResourceDefinitionCategoryPicker } from "@/components/Common/ResourceDefinitionCategoryPicker";
import LocationMultiSelect from "@/components/Location/LocationMultiSelect";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { generateSlug } from "@/Utils/utils";
import ObservationDefinitionForm from "@/pages/Facility/settings/observationDefinition/ObservationDefinitionForm";
import { CreateSpecimenDefinition } from "@/pages/Facility/settings/specimen-definitions/CreateSpecimenDefinition";
import { ResourceCategoryResourceType } from "@/types/base/resourceCategory/resourceCategory";
import { ChargeItemDefinitionBase } from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import {
  type ActivityDefinitionCreateSpec,
  type ActivityDefinitionReadSpec,
  type ActivityDefinitionUpdateSpec,
  Classification,
  Kind,
  Status,
} from "@/types/emr/activityDefinition/activityDefinition";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";
import observationDefinitionApi from "@/types/emr/observationDefinition/observationDefinitionApi";
import { SpecimenDefinitionStatus } from "@/types/emr/specimenDefinition/specimenDefinition";
import specimenDefinitionApi from "@/types/emr/specimenDefinition/specimenDefinitionApi";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug_value: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  usage: z.string().min(1, "Usage is required"),
  derived_from_uri: z.string().nullable(),
  status: z.nativeEnum(Status),
  classification: z.nativeEnum(Classification),
  kind: z.nativeEnum(Kind),
  healthcare_service: z.string().nullable(),
  code: z.object({
    code: z.string().min(1, "Code is required"),
    display: z.string().min(1, "Display name is required"),
    system: z.string().min(1, "System is required"),
  }),
  body_site: z
    .object({
      code: z.string().min(1, "Code is required"),
      display: z.string().min(1, "Display name is required"),
      system: z.string().min(1, "System is required"),
    })
    .nullable(),
  diagnostic_report_codes: z
    .array(
      z.object({
        code: z.string().min(1, "Code is required"),
        display: z.string().min(1, "Display name is required"),
        system: z.string().min(1, "System is required"),
      }),
    )
    .default([]),
  specimen_requirements: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
        details: z.array(
          z
            .object({
              label: z.string(),
              value: z
                .string()
                .optional()
                .transform((v) => v ?? undefined),
            })
            .transform((obj) => ({
              ...obj,
              value: obj.value ?? undefined,
            })),
        ),
      }),
    )
    .default([]),
  observation_result_requirements: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
        details: z.array(
          z
            .object({
              label: z.string(),
              value: z
                .string()
                .optional()
                .transform((v) => v ?? undefined),
            })
            .transform((obj) => ({
              ...obj,
              value: obj.value ?? undefined,
            })),
        ),
      }),
    )
    .default([]),
  charge_item_definitions: z
    .array(z.custom<ChargeItemDefinitionBase>())
    .default([]),
  locations: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
      }),
    )
    .default([]),
  category: z.string(),
});

export default function ActivityDefinitionForm({
  facilityId,
  activityDefinitionSlug,
  categorySlug,
}: {
  facilityId: string;
  activityDefinitionSlug?: string;
  categorySlug?: string;
}) {
  const { t } = useTranslation();

  const isEditMode = Boolean(activityDefinitionSlug);

  const { data: existingData, isFetching } = useQuery({
    queryKey: ["activityDefinition", activityDefinitionSlug],
    queryFn: query(activityDefinitionApi.retrieveActivityDefinition, {
      pathParams: {
        activityDefinitionSlug: activityDefinitionSlug!,
        facilityId,
      },
    }),
    enabled: isEditMode,
  });

  if (isEditMode && isFetching) {
    return (
      <Page title={t("edit_activity_definition")} hideTitleOnPage>
        <div className="container mx-auto max-w-3xl">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("edit_activity_definition")}
            </h1>
          </div>
          <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-8">
            <div className="text-center">
              <div className="mb-2 text-sm text-gray-500">{t("loading")}</div>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <ActivityDefinitionFormContent
      facilityId={facilityId}
      activityDefinitionSlug={activityDefinitionSlug}
      existingData={existingData}
      categorySlug={categorySlug}
    />
  );
}

function ActivityDefinitionFormContent({
  facilityId,
  activityDefinitionSlug,
  existingData,
  categorySlug,
}: {
  facilityId: string;
  activityDefinitionSlug?: string;
  existingData?: ActivityDefinitionReadSpec;
  categorySlug?: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(activityDefinitionSlug);
  const [specimenSearch, setSpecimenSearch] = React.useState("");
  const [observationSearch, setObservationSearch] = React.useState("");
  const { data: specimenDefinitions, isLoading: isLoadingSpecimens } = useQuery(
    {
      queryKey: ["specimenDefinitions", facilityId, specimenSearch],
      queryFn: query.debounced(specimenDefinitionApi.listSpecimenDefinitions, {
        pathParams: { facilityId },
        queryParams: {
          limit: 100,
          title: specimenSearch,
          status: SpecimenDefinitionStatus.active,
        },
      }),
    },
  );

  const { data: observationDefinitions, isLoading: isLoadingObservations } =
    useQuery({
      queryKey: ["observationDefinitions", facilityId, observationSearch],
      queryFn: query.debounced(
        observationDefinitionApi.listObservationDefinition,
        {
          queryParams: {
            facility: facilityId,
            limit: 100,
            title: observationSearch,
          },
        },
      ),
    });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues:
      isEditMode && existingData
        ? {
            title: existingData.title,
            slug_value: existingData.slug_config.slug_value,
            description: existingData.description,
            usage: existingData.usage,
            derived_from_uri: existingData.derived_from_uri,
            status: existingData.status,
            classification: existingData.classification,
            kind: existingData.kind,
            code: existingData.code,
            body_site: existingData.body_site,
            diagnostic_report_codes: existingData.diagnostic_report_codes || [],
            healthcare_service: existingData.healthcare_service?.id || null,
            specimen_requirements:
              existingData.specimen_requirements?.map((s) => ({
                value: s.slug,
                label: s.title,
                details: [
                  {
                    label: t("type"),
                    value: s.type_collected?.display || undefined,
                  },
                  {
                    label: t("container"),
                    value: s.type_tested?.container?.description || undefined,
                  },
                  {
                    label: t("minimum_volume"),
                    value:
                      s.type_tested?.container?.minimum_volume?.string ||
                      (s.type_tested?.container?.minimum_volume?.quantity
                        ? `${s.type_tested.container.minimum_volume.quantity.value} ${s.type_tested.container.minimum_volume.quantity.unit.display}`
                        : undefined),
                  },
                  {
                    label: t("cap"),
                    value: s.type_tested?.container?.cap?.display || undefined,
                  },
                ],
              })) || [],
            observation_result_requirements:
              existingData.observation_result_requirements?.map((obs) => ({
                value: obs.slug,
                label: obs.title,
                details: [
                  {
                    label: t("category"),
                    value: t(obs.category) || undefined,
                  },
                  {
                    label: t("data_type"),
                    value: t(obs.permitted_data_type) || undefined,
                  },
                  {
                    label: t("unit"),
                    value: obs.permitted_unit?.display || undefined,
                  },
                  {
                    label: t("method"),
                    value: obs.method?.display || undefined,
                  },
                  {
                    label: t("components"),
                    value:
                      obs.component?.map((c) => c.code?.display).join(", ") ||
                      undefined,
                  },
                ],
              })) || [],
            locations:
              existingData.locations?.map((l) => ({
                id: l.id,
                name: l.name,
              })) || [],
            charge_item_definitions: existingData.charge_item_definitions || [],
            category: existingData.category?.slug || "",
          }
        : {
            status: Status.active,
            kind: Kind.service_request,
            specimen_requirements: [],
            observation_result_requirements: [],
            locations: [],
            derived_from_uri: null,
            body_site: null,
            diagnostic_report_codes: [],
            healthcare_service: null,
            category: categorySlug || "",
          },
  });

  // Watch title changes and update slug only when creating new activity definition
  React.useEffect(() => {
    if (isEditMode) return; // Skip if editing existing data

    const subscription = form.watch((value, { name }) => {
      if (name === "title") {
        form.setValue("slug_value", generateSlug(value.title || ""), {
          shouldValidate: true,
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [form, isEditMode]);

  const { mutate: createActivityDefinition, isPending: isCreating } =
    useMutation({
      mutationFn: mutate(activityDefinitionApi.createActivityDefinition, {
        pathParams: {
          facilityId,
        },
      }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["activityDefinitions"] });
        queryClient.invalidateQueries({
          queryKey: ["activityDefinition", activityDefinitionSlug],
        });
        toast.success(t("activity_definition_created_successfully"));
        navigate(`/facility/${facilityId}/settings/activity_definitions`);
      },
    });

  const { mutate: updateActivityDefinition, isPending: isUpdating } =
    useMutation({
      mutationFn: mutate(activityDefinitionApi.updateActivityDefinition, {
        pathParams: {
          activityDefinitionSlug: activityDefinitionSlug || "",
          facilityId,
        },
      }),
      onSuccess: (activityDefinition: ActivityDefinitionReadSpec) => {
        queryClient.invalidateQueries({
          queryKey: [
            ["activityDefinition", activityDefinitionSlug],
            ["activityDefinitions"],
          ],
        });
        toast.success(t("activity_definition_updated_successfully"));
        navigate(
          `/facility/${facilityId}/settings/activity_definitions/${activityDefinition.slug}`,
        );
      },
    });

  const isPending = isCreating || isUpdating;

  function onSubmit(data: z.infer<typeof formSchema>) {
    const transformedData = {
      ...data,
      specimen_requirements: data.specimen_requirements.map(
        (item) => item.value,
      ),
      observation_result_requirements: data.observation_result_requirements.map(
        (item) => item.value,
      ),
      charge_item_definitions: data.charge_item_definitions.map(
        (item) => item.slug,
      ),
      locations: data.locations.map((loc) => loc.id),
    };

    if (isEditMode && activityDefinitionSlug) {
      updateActivityDefinition(
        transformedData as unknown as ActivityDefinitionUpdateSpec,
      );
    } else {
      createActivityDefinition(
        transformedData as unknown as ActivityDefinitionCreateSpec,
      );
    }
  }

  return (
    <Page
      title={
        isEditMode
          ? t("edit_activity_definition")
          : t("create_activity_definition")
      }
      hideTitleOnPage
    >
      <div className="container mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">
            {isEditMode
              ? t("edit_activity_definition")
              : t("create_activity_definition")}
          </h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Basic Information Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-medium text-gray-900">
                    {t("basic_information")}
                  </h2>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {t("basic_details_of_the_activity")}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>
                          {t("title")} <span className="text-red-500">*</span>
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
                    name="slug_value"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>
                          {t("slug")} <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(e) => {
                              const sanitizedValue = e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9_-]/g, "");
                              field.onChange(sanitizedValue);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                        <FormDescription>
                          {t("slug_format_message")}
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        {t("description")}{" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea {...field} className="min-h-[60px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="usage"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        {t("usage")} <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea {...field} className="min-h-[60px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t("status")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select_status")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(Status).map((status) => (
                              <SelectItem key={status} value={status}>
                                {t(status)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="classification"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>
                          {t("category")}{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select_category")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(Classification).map((category) => (
                              <SelectItem key={category} value={category}>
                                {t(category)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>
                          {t("resource_category")}{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <ResourceCategoryPicker
                            facilityId={facilityId}
                            resourceType={
                              ResourceCategoryResourceType.activity_definition
                            }
                            value={field.value}
                            onValueChange={(category) =>
                              field.onChange(category?.slug || "")
                            }
                            placeholder={t("select_resource_category")}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="kind"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t("kind")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select_kind")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(Kind).map((kind) => (
                              <SelectItem key={kind} value={kind}>
                                {t(kind)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="derived_from_uri"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t("derived_from_uri")}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel aria-required>{t("code")}</FormLabel>
                        <FormControl>
                          <ValueSetSelect
                            {...field}
                            system="activity-definition-procedure-code"
                            placeholder={t("search_for_activity_codes")}
                            onSelect={(code) => {
                              field.onChange({
                                code: code.code,
                                display: code.display,
                                system: code.system,
                              });
                            }}
                            showCode={true}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Additional Details Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-medium text-gray-900">
                    {t("additional_details")}{" "}
                    <span className="text-sm font-normal text-gray-500">
                      ({t("optional")})
                    </span>
                  </h2>
                </div>

                <FormField
                  control={form.control}
                  name="body_site"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("body_site")}</FormLabel>
                      <FormControl>
                        <ValueSetSelect
                          {...field}
                          system="system-body-site"
                          placeholder={t("select_body_site")}
                          onSelect={(code) => {
                            form.setValue("body_site", {
                              code: code.code,
                              display: code.display,
                              system: code.system,
                            });
                          }}
                          showCode={true}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Requirements Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-medium text-gray-900">
                    {t("requirements")}
                  </h2>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {t("Specify the requirements for this activity")}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-200 shadow-sm p-4">
                    <FormLabel>{t("specimen_requirements")}</FormLabel>
                    <div className="mt-2">
                      <RequirementsSelector
                        title={t("select_specimen_requirements")}
                        description={t(
                          "select_or_create_specimen_requirements",
                        )}
                        allowDuplicate={true}
                        value={form.watch("specimen_requirements") || []}
                        onChange={(values) =>
                          form.setValue("specimen_requirements", values)
                        }
                        options={
                          specimenDefinitions?.results.map((spec) => ({
                            label: spec.title,
                            value: spec.slug,
                            details: [
                              {
                                label: t("type"),
                                value:
                                  spec.type_collected?.display ?? undefined,
                              },
                              {
                                label: t("container"),
                                value:
                                  spec.type_tested?.container?.description ??
                                  undefined,
                              },
                              {
                                label: t("minimum_volume"),
                                value:
                                  spec.type_tested?.container?.minimum_volume
                                    ?.string ??
                                  (spec.type_tested?.container?.minimum_volume
                                    ?.quantity
                                    ? `${spec.type_tested.container.minimum_volume.quantity.value} ${spec.type_tested.container.minimum_volume.quantity.unit.display}`
                                    : undefined),
                              },
                              {
                                label: t("cap"),
                                value:
                                  spec.type_tested?.container?.cap?.display ??
                                  undefined,
                              },
                            ],
                          })) || []
                        }
                        isLoading={isLoadingSpecimens}
                        placeholder={t("select_specimen_requirements")}
                        onSearch={setSpecimenSearch}
                        canCreate={true}
                        createForm={(onSuccess) => (
                          <CreateSpecimenDefinition
                            facilityId={facilityId}
                            onSuccess={onSuccess}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 shadow-sm p-4">
                    <FormLabel>{t("observation_requirements")}</FormLabel>
                    <div className="mt-2">
                      <RequirementsSelector
                        title={t("select_observation_requirements")}
                        description={t(
                          "select_or_create_observation_requirements",
                        )}
                        value={
                          form.watch("observation_result_requirements") || []
                        }
                        onChange={(values) =>
                          form.setValue(
                            "observation_result_requirements",
                            values,
                          )
                        }
                        options={
                          observationDefinitions?.results.map((obs) => ({
                            label: obs.title,
                            value: obs.slug,
                            details: [
                              {
                                label: t("category"),
                                value: t(obs.category) ?? undefined,
                              },
                              {
                                label: t("data_type"),
                                value: t(obs.permitted_data_type) ?? undefined,
                              },
                              {
                                label: t("unit"),
                                value: obs.permitted_unit?.display ?? undefined,
                              },
                              {
                                label: t("method"),
                                value: obs.method?.display ?? undefined,
                              },
                              {
                                label: t("components"),
                                value:
                                  obs.component
                                    ?.map((c) => c.code?.display)
                                    .join(", ") ?? undefined,
                              },
                            ],
                          })) || []
                        }
                        isLoading={isLoadingObservations}
                        placeholder={t("select_observation_requirements")}
                        onSearch={setObservationSearch}
                        canCreate={true}
                        createForm={(onSuccess) => (
                          <div className="py-2">
                            <ObservationDefinitionForm
                              facilityId={facilityId}
                              onSuccess={onSuccess}
                            />
                          </div>
                        )}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 shadow-sm p-4">
                    <FormLabel>{t("charge_item_definitions")}</FormLabel>
                    <div className="mt-2">
                      <ResourceDefinitionCategoryPicker<ChargeItemDefinitionBase>
                        facilityId={facilityId}
                        value={form.watch("charge_item_definitions") || []}
                        onValueChange={(selectedDef) => {
                          if (!selectedDef) {
                            form.setValue("charge_item_definitions", []);
                            return;
                          }
                          const defs = Array.isArray(selectedDef)
                            ? selectedDef
                            : [selectedDef];
                          form.setValue("charge_item_definitions", defs);
                        }}
                        allowMultiple
                        placeholder={t("select_charge_item_definitions")}
                        className="w-full"
                        resourceType={
                          ResourceCategoryResourceType.charge_item_definition
                        }
                        listDefinitions={{
                          queryFn:
                            chargeItemDefinitionApi.listChargeItemDefinition,
                          pathParams: { facilityId },
                        }}
                        translations={{
                          searchPlaceholder: "search_charge_item_definitions",
                          selectPlaceholder: "select_charge_item_definition",
                          noResultsFound:
                            "no_charge_item_definitions_found_for",
                          noItemsFound: "no_charge_item_definitions_found",
                        }}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 shadow-sm p-4">
                    <FormLabel>{t("locations")}</FormLabel>
                    <div className="mt-2">
                      <RequirementsSelector
                        title={t("location_requirements")}
                        description={t("location_requirements_description")}
                        value={(form.watch("locations") || []).map((loc) => ({
                          value: loc.id,
                          label: loc.name,
                          details: [],
                        }))}
                        onChange={(values) =>
                          form.setValue(
                            "locations",
                            values.map((v) => ({
                              id: v.value,
                              name: v.label,
                            })),
                          )
                        }
                        options={[]}
                        isLoading={false}
                        placeholder={t("select_locations")}
                        customSelector={
                          <FormField
                            control={form.control}
                            name="locations"
                            render={({ field }) => (
                              <LocationMultiSelect
                                facilityId={facilityId}
                                value={field.value || []}
                                onChange={field.onChange}
                              />
                            )}
                          />
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnostic Report Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-medium text-gray-900">
                    {t("diagnostic_report")}
                  </h2>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {t("specify_diagnostic_report_codes")}
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="diagnostic_report_codes"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("diagnostic_report_codes")}</FormLabel>
                      <div className="space-y-3">
                        {(field.value || []).length > 0 && (
                          <div className="grid gap-2">
                            {(field.value || []).map((code, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                              >
                                <div className="flex-1">
                                  <span className="font-medium">
                                    {code.display}
                                  </span>
                                  <span className="ml-2 text-gray-500">
                                    ({code.code})
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-auto p-1 hover:bg-gray-100"
                                  onClick={() => {
                                    const newCodes = (field.value || []).filter(
                                      (_, i) => i !== index,
                                    );
                                    form.setValue(
                                      "diagnostic_report_codes",
                                      newCodes,
                                    );
                                  }}
                                >
                                  <Trash2Icon className="h-4 w-4" />
                                  <span className="sr-only">{t("remove")}</span>
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        <ValueSetSelect
                          system="system-observation"
                          value={null}
                          placeholder={t("search_for_diagnostic_codes")}
                          onSelect={(selectedCode) => {
                            const currentCodes = field.value || [];
                            if (
                              !currentCodes.some(
                                (code) => code.code === selectedCode.code,
                              )
                            ) {
                              form.setValue("diagnostic_report_codes", [
                                ...currentCodes,
                                {
                                  code: selectedCode.code,
                                  display: selectedCode.display,
                                  system: selectedCode.system,
                                },
                              ]);
                            }
                          }}
                          showCode={true}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  navigate(
                    `/facility/${facilityId}/settings/activity_definitions`,
                  )
                }
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isEditMode
                    ? t("saving")
                    : t("creating")
                  : isEditMode
                    ? t("save")
                    : t("create")}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Page>
  );
}
