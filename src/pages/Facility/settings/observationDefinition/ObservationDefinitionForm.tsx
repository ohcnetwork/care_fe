import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, X } from "lucide-react";
import { navigate } from "raviger";
import React from "react";
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
import { FormSkeleton } from "@/components/Common/SkeletonLoading";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { generateSlug } from "@/Utils/utils";
import {
  OBSERVATION_DEFINITION_CATEGORY,
  OBSERVATION_DEFINITION_STATUS,
  type ObservationDefinitionCreateSpec,
  type ObservationDefinitionReadSpec,
  ObservationDefinitionUpdateSpec,
  QuestionType,
} from "@/types/emr/observationDefinition/observationDefinition";
import observationDefinitionApi from "@/types/emr/observationDefinition/observationDefinitionApi";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(OBSERVATION_DEFINITION_STATUS),
  category: z.enum(OBSERVATION_DEFINITION_CATEGORY as [string, ...string[]]),
  permitted_data_type: z.nativeEnum(QuestionType),
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
  method: z
    .object({
      code: z.string().min(1, "Code is required"),
      display: z.string().min(1, "Display name is required"),
      system: z.string().min(1, "System is required"),
    })
    .nullable(),
  permitted_unit: z
    .object({
      code: z.string().min(1, "Code is required"),
      display: z.string().min(1, "Display name is required"),
      system: z.string().min(1, "System is required"),
    })
    .nullable(),
  component: z
    .array(
      z.object({
        code: z
          .object({
            code: z.string(),
            display: z.string(),
            system: z.string(),
          })
          .refine((data) => data.code && data.display && data.system, {
            message: "Required",
          }),
        permitted_data_type: z.nativeEnum(QuestionType),
        permitted_unit: z
          .object({
            code: z.string(),
            display: z.string(),
            system: z.string(),
          })
          .refine((data) => data.code && data.display && data.system, {
            message: "Required",
          }),
      }),
    )
    .default([]),
});

export default function ObservationDefinitionForm({
  facilityId,
  observationDefinitionId,
  onSuccess,
}: {
  facilityId: string;
  observationDefinitionId?: string;
  onSuccess?: () => void;
}) {
  const { t } = useTranslation();

  const isEditMode = Boolean(observationDefinitionId);

  const { data: existingData, isFetching } = useQuery({
    queryKey: ["observationDefinitions", observationDefinitionId],
    queryFn: query(observationDefinitionApi.retrieveObservationDefinition, {
      pathParams: {
        observationDefinitionId: observationDefinitionId!,
      },
      queryParams: {
        facility: facilityId,
      },
    }),
    enabled: isEditMode,
  });

  if (isEditMode && isFetching) {
    return (
      <Page title={t("edit_observation_definition")} hideTitleOnPage>
        <div className="container mx-auto max-w-3xl">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("edit_observation_definition")}
            </h1>
          </div>
          <FormSkeleton rows={10} />
        </div>
      </Page>
    );
  }

  return (
    <ObservationDefinitionFormContent
      facilityId={facilityId}
      observationDefinitionId={observationDefinitionId}
      existingData={existingData}
      onSuccess={onSuccess}
    />
  );
}

function ObservationDefinitionFormContent({
  facilityId,
  observationDefinitionId,
  existingData,
  onSuccess = () =>
    navigate(`/facility/${facilityId}/settings/observation_definitions`),
}: {
  facilityId: string;
  observationDefinitionId?: string;
  existingData?: ObservationDefinitionReadSpec;
  onSuccess?: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(observationDefinitionId);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues:
      isEditMode && existingData
        ? {
            title: existingData.title,
            slug: existingData.slug,
            description: existingData.description,
            status: existingData.status,
            category: existingData.category,
            permitted_data_type: existingData.permitted_data_type,
            code: existingData.code,
            body_site: existingData.body_site || null,
            method: existingData.method || null,
            permitted_unit: existingData.permitted_unit || null,
            component: existingData.component || [],
          }
        : {
            status: "active",
            component: [],
            body_site: null,
            method: null,
            permitted_unit: null,
          },
  });

  React.useEffect(() => {
    if (isEditMode) return;

    const subscription = form.watch((value, { name }) => {
      if (name === "title") {
        form.setValue("slug", generateSlug(value.title || ""), {
          shouldValidate: true,
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [form, isEditMode]);

  const { mutate: createObservationDefinition, isPending: isCreating } =
    useMutation({
      mutationFn: mutate(observationDefinitionApi.createObservationDefinition),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["observationDefinitions"] });
        toast.success(t("observation_definition_created"));
        onSuccess();
      },
    });

  const { mutate: updateObservationDefinition, isPending: isUpdating } =
    useMutation({
      mutationFn: mutate(observationDefinitionApi.updateObservationDefinition, {
        pathParams: { observationDefinitionId: observationDefinitionId || "" },
      }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["observationDefinitions"] });
        toast.success(t("observation_definition_updated"));
        navigate(
          `/facility/${facilityId}/settings/observation_definitions/${observationDefinitionId}`,
        );
      },
    });

  const isPending = isCreating || isUpdating;

  function onSubmit(data: z.infer<typeof formSchema>) {
    if (isEditMode && observationDefinitionId) {
      updateObservationDefinition(data as ObservationDefinitionUpdateSpec);
    } else {
      const payload: ObservationDefinitionCreateSpec = {
        ...data,
        facility: facilityId,
      };
      createObservationDefinition(payload);
    }
  }

  return (
    <Page
      title={
        isEditMode
          ? t("edit_observation_definition")
          : t("create_observation_definition")
      }
      hideTitleOnPage
    >
      <div className="container mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">
            {isEditMode
              ? t("edit_observation_definition")
              : t("create_observation_definition")}
          </h1>
        </div>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit(onSubmit)();
            }}
            className="space-y-4"
          >
            {/* Basic Information Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-medium text-gray-900">
                    {t("basic_information")}
                  </h2>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {t("observation_basic_information")}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 items-start">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel aria-required>{t("title")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel aria-required>{t("slug")}</FormLabel>
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
                        <FormDescription>
                          {t("slug_format_message")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel aria-required>{t("description")}</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="min-h-[60px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2 items-start">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("status")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger ref={field.ref}>
                              <SelectValue placeholder={t("select_status")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {OBSERVATION_DEFINITION_STATUS.map((status) => (
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
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel aria-required>{t("category")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger ref={field.ref}>
                              <SelectValue placeholder={t("select_category")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {OBSERVATION_DEFINITION_CATEGORY.map((category) => (
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
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="permitted_data_type"
                    render={({ field }) => {
                      return (
                        <FormItem className="flex flex-col">
                          <FormLabel aria-required>{t("data_type")}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger ref={field.ref}>
                                <SelectValue
                                  placeholder={t("select_data_type")}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.keys(QuestionType).map((type) => (
                                <SelectItem key={type} value={type}>
                                  {t(type)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormItem className="flex flex-col">
                    <FormLabel aria-required>{t("loinc_code")}</FormLabel>
                    <div>
                      <ValueSetSelect
                        system="system-observation"
                        value={form.watch("code")}
                        placeholder={t("search_for_observation_codes")}
                        onSelect={(code) => {
                          form.setValue("code", {
                            code: code.code,
                            display: code.display,
                            system: code.system,
                          });
                          form.clearErrors("code");
                        }}
                        showCode={true}
                      />
                      <FormMessage className="mt-2">
                        {form.formState.errors.code?.message}
                      </FormMessage>
                    </div>
                  </FormItem>
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
                  <p className="mt-0.5 text-sm text-gray-500">
                    {t("observation_additional_details")}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("body_site")}</FormLabel>
                    <ValueSetSelect
                      system="system-body-site"
                      value={form.watch("body_site")}
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
                  </FormItem>

                  <FormItem className="flex flex-col">
                    <FormLabel>{t("method")}</FormLabel>
                    <ValueSetSelect
                      system="system-collection-method"
                      value={form.watch("method")}
                      placeholder={t("method_placeholder")}
                      onSelect={(code) => {
                        form.setValue("method", {
                          code: code.code,
                          display: code.display,
                          system: code.system,
                        });
                      }}
                      showCode={true}
                    />
                  </FormItem>

                  <FormItem className="flex flex-col">
                    <FormLabel>{t("unit")}</FormLabel>
                    <ValueSetSelect
                      system="system-ucum-units"
                      value={form.watch("permitted_unit")}
                      placeholder={t("unit_placeholder")}
                      onSelect={(code) => {
                        form.setValue("permitted_unit", {
                          code: code.code,
                          display: code.display,
                          system: code.system,
                        });
                      }}
                      showCode={true}
                    />
                  </FormItem>
                </div>
              </div>
            </div>

            {/* Components Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-medium text-gray-900">
                      {t("components")}{" "}
                      <span className="text-sm font-normal text-gray-500">
                        {t("optional")}
                      </span>
                    </h2>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {t("observation_components_description")}
                    </p>
                  </div>
                  {(form.watch("component") ?? [])?.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentComponents =
                          form.getValues("component") || [];
                        form.setValue("component", [
                          ...currentComponents,
                          {
                            code: { code: "", display: "", system: "" },
                            permitted_data_type: QuestionType.quantity,
                            permitted_unit: {
                              code: "",
                              display: "",
                              system: "",
                            },
                          },
                        ]);
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      {t("add_component")}
                    </Button>
                  )}
                </div>

                {(form.watch("component") ?? [])?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4">
                    <p className="mb-2 text-sm text-gray-500">
                      {t("observation_components_description")}
                    </p>
                    <ul className="mb-4 text-sm text-gray-600">
                      <li>• {t("blood_pressure_systolic_diastolic")}</li>
                      <li>• {t("complete_blood_count_rbc_wbc_platelets")}</li>
                    </ul>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const currentComponents =
                          form.getValues("component") || [];
                        form.setValue("component", [
                          ...currentComponents,
                          {
                            code: { code: "", display: "", system: "" },
                            permitted_data_type: QuestionType.quantity,
                            permitted_unit: {
                              code: "",
                              display: "",
                              system: "",
                            },
                          },
                        ]);
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      {t("add_your_first_component")}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(form.watch("component") ?? []).map((_, index) => (
                      <div
                        key={index}
                        className="relative rounded-lg border border-gray-200 bg-white p-4"
                      >
                        <div className="absolute right-3 top-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full hover:bg-gray-100"
                            onClick={() => {
                              const currentComponents =
                                form.getValues("component") || [];
                              form.setValue(
                                "component",
                                currentComponents.filter((_, i) => i !== index),
                              );
                            }}
                          >
                            <X className="h-4 w-4 text-gray-500" />
                          </Button>
                        </div>

                        <div className="mb-2 text-sm font-medium text-gray-700">
                          {t("component_with_index", { index: index + 1 })}
                        </div>

                        <div className="grid gap-4">
                          <FormField
                            control={form.control}
                            name={`component.${index}.code`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel aria-required>{t("code")}</FormLabel>
                                <FormControl>
                                  <ValueSetSelect
                                    system="system-observation"
                                    placeholder={t(
                                      "search_for_observation_codes",
                                    )}
                                    value={field.value}
                                    showCode={true}
                                    onSelect={(code) => {
                                      field.onChange({
                                        code: code.code,
                                        display: code.display,
                                        system: code.system,
                                      });
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name={`component.${index}.permitted_data_type`}
                              render={({ field }) => (
                                <FormItem className="flex flex-col gap-1">
                                  <FormLabel>{t("data_type")}</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger ref={field.ref}>
                                        <SelectValue
                                          placeholder={t("select_data_type")}
                                        />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {Object.keys(QuestionType).map((type) => (
                                        <SelectItem key={type} value={type}>
                                          {t(type)}
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
                              name={`component.${index}.permitted_unit`}
                              render={({ field }) => (
                                <FormItem className="flex flex-col gap-1">
                                  <FormLabel aria-required>
                                    {t("unit")}
                                  </FormLabel>
                                  <FormControl>
                                    <ValueSetSelect
                                      system="system-ucum-units"
                                      placeholder={t("search_for_units")}
                                      value={field.value}
                                      showCode={true}
                                      onSelect={(code) => {
                                        field.onChange({
                                          code: code.code,
                                          display: code.display,
                                          system: code.system,
                                        });
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  navigate(
                    `/facility/${facilityId}/settings/observation_definitions`,
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
