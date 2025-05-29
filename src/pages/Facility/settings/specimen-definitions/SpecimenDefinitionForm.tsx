import { zodResolver } from "@hookform/resolvers/zod";
import { t } from "i18next";
import { PlusCircle, XCircle } from "lucide-react";
import { navigate } from "raviger";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import ComboboxQuantityInput from "@/components/Common/ComboboxQuantityInput";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { Code, CodeSchema } from "@/types/base/code/code";
import {
  ContainerSpec,
  Preference,
  RETENTION_TIME_UNITS,
  SPECIMEN_DEFINITION_UNITS_CODES,
  SpecimenDefinitionStatus,
} from "@/types/emr/specimenDefinition/specimenDefinition";
import { SpecimenDefinitionCreate } from "@/types/emr/specimenDefinition/specimenDefinition";

const typeTestedSchema = z.object({
  is_derived: z.boolean(),
  preference: z.nativeEnum(Preference),
  container: z
    .object({
      description: z.string().optional(),
      capacity: z
        .object({
          value: z.number(),
          unit: CodeSchema,
        })
        .nullable()
        .optional(),
      minimum_volume: z
        .object({
          quantity: z
            .object({
              value: z.number(),
              unit: CodeSchema,
            })
            .optional()
            .nullable(),
          string: z.string().optional(),
        })
        .optional(),
      cap: CodeSchema.optional(),
      preparation: z.string().optional(),
    })
    .nullable()
    .optional(),
  requirement: z.string().optional(),
  retention_time: z
    .object({
      value: z.number().int({ message: t("valid_integer_required") }),
      unit: CodeSchema,
    })
    .nullable()
    .optional(),
  single_use: z.boolean().nullable(),
});

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  status: z.nativeEnum(SpecimenDefinitionStatus),
  description: z.string().min(1, t("field_required")),
  derived_from_uri: z
    .string()
    .url({ message: "Please enter a valid URL" })
    .optional(),
  type_collected: CodeSchema,
  patient_preparation: z.array(CodeSchema).min(0),
  collection: CodeSchema.optional(),
  type_tested: typeTestedSchema.optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SpecimenDefinitionFormProps {
  initialData?: SpecimenDefinitionCreate;
  onSubmit: (data: SpecimenDefinitionCreate) => void;
  isLoading?: boolean;
}

export function SpecimenDefinitionForm({
  initialData,
  onSubmit,
  isLoading,
}: SpecimenDefinitionFormProps) {
  const { t } = useTranslation();

  const { facilityId } = useCurrentFacility();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title,
      slug: initialData?.slug,
      status: initialData?.status ?? SpecimenDefinitionStatus.active,
      description: initialData?.description,
      derived_from_uri: initialData?.derived_from_uri ?? undefined,
      type_collected: initialData?.type_collected,
      patient_preparation: initialData?.patient_preparation ?? [],
      collection: initialData?.collection ?? undefined,
      type_tested: initialData?.type_tested ?? {
        is_derived: false,
        preference: Preference.preferred,
        container: {
          description: initialData?.type_tested?.container?.description,
          capacity: initialData?.type_tested?.container?.capacity,
          minimum_volume: initialData?.type_tested?.container?.minimum_volume,
          cap: initialData?.type_tested?.container?.cap,
          preparation: initialData?.type_tested?.container?.preparation,
        },
        requirement: initialData?.type_tested?.requirement,
        retention_time: initialData?.type_tested?.retention_time,
        single_use: false,
      },
    },
  });

  const handleTypeCollectedSelect = (code: Code) => {
    form.setValue("type_collected", code);
  };

  const handleCollectionMethodSelect = (code: Code) => {
    form.setValue("collection", code);
  };

  const handleCapTypeSelect = (code: Code) => {
    form.setValue("type_tested.container.cap", code);
  };

  const handlePatientPreparationSelect = (code: Code, index: number) => {
    const currentPreparations = form.getValues("patient_preparation");
    const newPreparations = [...currentPreparations];
    newPreparations[index] = code;
    form.setValue("patient_preparation", newPreparations);
  };

  const addPatientPreparation = () => {
    const currentPreparations = form.getValues("patient_preparation");
    form.setValue("patient_preparation", [
      ...currentPreparations,
      { code: "", system: "", display: "" },
    ]);
  };

  const removePatientPreparation = (index: number) => {
    const currentPreparations = form.getValues("patient_preparation");
    const newPreparations = currentPreparations.filter((_, i) => i !== index);
    form.setValue("patient_preparation", newPreparations);
  };

  const cleanContainerData = (container: ContainerSpec | null | undefined) => {
    if (!container) return undefined;

    const hasContent =
      container.description ||
      container.preparation ||
      container.capacity ||
      container.cap ||
      container.minimum_volume?.quantity ||
      container.minimum_volume?.string;

    if (!hasContent) return undefined;

    const cleanedContainer = { ...container };
    if (
      container.minimum_volume &&
      !container.minimum_volume.quantity &&
      !container.minimum_volume.string
    ) {
      delete cleanedContainer.minimum_volume;
    }

    return cleanedContainer;
  };

  const handleSubmit = (data: SpecimenDefinitionCreate) => {
    onSubmit({
      ...data,
      patient_preparation:
        data.patient_preparation?.filter((item) => item && item.code) || [],
      type_tested: data.type_tested
        ? {
            ...data.type_tested,
            container: cleanContainerData(data.type_tested.container),
          }
        : undefined,
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit(handleSubmit, (errors) => {
            console.log("Form submission failed with errors:", errors);
          })();
        }}
        className="space-y-4"
      >
        <Card>
          <CardHeader>
            <CardTitle>{t("specimen_definition")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t("basic_information")}</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        {t("title")} <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder={t("title")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        {t("slug")} <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("unique_identifier")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        {t("status")} <span className="text-red-500">*</span>
                      </FormLabel>
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
                          {Object.values(SpecimenDefinitionStatus).map(
                            (status) => (
                              <SelectItem key={status} value={status}>
                                {t(status)}
                              </SelectItem>
                            ),
                          )}
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
                        <Input placeholder={t("uri")} {...field} />
                      </FormControl>
                      <FormMessage />
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
                      {t("description")} <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea placeholder={t("description")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Specimen Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t("specimen_details")}</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="type_collected"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        {t("type_collected")}{" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <ValueSetSelect
                          system="system-specimen_type-code"
                          placeholder={t("select_type_collected")}
                          onSelect={handleTypeCollectedSelect}
                          value={field.value}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="collection"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("collection")}</FormLabel>
                      <FormControl>
                        <ValueSetSelect
                          system="system-specimen_collection_code"
                          placeholder={t("select_collection")}
                          onSelect={handleCollectionMethodSelect}
                          value={field.value}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="patient_preparation"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("patient_preparation")}</FormLabel>
                    <div className="space-y-2">
                      {field.value.map(
                        (preparation: Code | null, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <FormControl>
                              <ValueSetSelect
                                system="system-prepare_patient_prior_specimen_code"
                                placeholder={t("select_patient_preparation")}
                                onSelect={(code) =>
                                  handlePatientPreparationSelect(code, index)
                                }
                                value={preparation}
                                disabled={isLoading}
                              />
                            </FormControl>
                            {field.value.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removePatientPreparation(index)}
                                className="h-10 w-10"
                              >
                                <XCircle className="h-5 w-5" />
                              </Button>
                            )}
                          </div>
                        ),
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addPatientPreparation}
                        className="w-full"
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t("add")}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Type Tested Information */}
            <div className="space-y-4 rounded-md border bg-gray-50 px-2 py-4">
              <h3 className="text-base font-medium">
                {t("type_tested_information")}
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="type_tested.is_derived"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between border p-2 rounded-md">
                      <div className="space-y-0.5">
                        <FormLabel>{t("is_derived")}</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type_tested.single_use"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between border p-2 rounded-md">
                      <div className="space-y-0.5">
                        <FormLabel>{t("single_use")}</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type_tested.preference"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("preference")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("select_preference")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="preferred">
                            {t("preferred")}
                          </SelectItem>
                          <SelectItem value="alternate">
                            {t("alternate")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div>
                  <FormField
                    control={form.control}
                    name="type_tested.retention_time"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t("retention_time")}</FormLabel>
                        <FormControl>
                          <ComboboxQuantityInput
                            quantity={
                              field.value
                                ? {
                                    value: field.value.value,
                                    unit: field.value.unit,
                                  }
                                : null
                            }
                            onChange={field.onChange}
                            disabled={isLoading}
                            placeholder={t("enter_retention_time")}
                            units={RETENTION_TIME_UNITS}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormMessage>
                    {
                      form.formState.errors.type_tested?.retention_time?.value
                        ?.message
                    }
                  </FormMessage>
                </div>

                <FormField
                  control={form.control}
                  name="type_tested.requirement"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("requirement")}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t("requirement")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 rounded-md border bg-gray-50 shadow-sm p-2">
                <h4 className="text-sm font-medium">
                  {t("container_information")}
                </h4>
                <FormField
                  control={form.control}
                  name="type_tested.container.description"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("description")}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t("description")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="type_tested.container.cap"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>{t("cap")}</FormLabel>
                          <FormControl>
                            <ValueSetSelect
                              system="system-container_cap-code"
                              placeholder={t("select_cap")}
                              onSelect={handleCapTypeSelect}
                              value={field.value}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="type_tested.container.capacity"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>{t("capacity")}</FormLabel>
                          <FormControl>
                            <ComboboxQuantityInput
                              quantity={
                                field.value
                                  ? {
                                      value: field.value.value,
                                      unit: field.value.unit,
                                    }
                                  : undefined
                              }
                              onChange={field.onChange}
                              disabled={isLoading}
                              placeholder={t("enter_capacity")}
                              units={SPECIMEN_DEFINITION_UNITS_CODES}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <FormLabel>{t("minimum_volume")}</FormLabel>
                    <Tabs
                      className="w-full"
                      defaultValue={
                        form.watch(
                          "type_tested.container.minimum_volume.quantity",
                        )
                          ? "quantity"
                          : "text"
                      }
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="quantity">
                          {t("quantity")}
                        </TabsTrigger>
                        <TabsTrigger value="text">{t("text")}</TabsTrigger>
                      </TabsList>
                      <TabsContent value="quantity">
                        <FormField
                          control={form.control}
                          name="type_tested.container.minimum_volume.quantity"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormControl>
                                <ComboboxQuantityInput
                                  quantity={
                                    field.value
                                      ? {
                                          value: field.value.value,
                                          unit: field.value.unit,
                                        }
                                      : undefined
                                  }
                                  onChange={(value) => {
                                    field.onChange(value);
                                    form.setValue(
                                      "type_tested.container.minimum_volume.string",
                                      undefined,
                                    );
                                  }}
                                  disabled={isLoading}
                                  placeholder={t("enter_minimum_volume")}
                                  units={SPECIMEN_DEFINITION_UNITS_CODES}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                      <TabsContent value="text">
                        <FormField
                          control={form.control}
                          name="type_tested.container.minimum_volume.string"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormControl>
                                <Input
                                  placeholder={t("enter_minimum_volume")}
                                  {...field}
                                  disabled={isLoading}
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                    form.setValue(
                                      "type_tested.container.minimum_volume.quantity",
                                      undefined,
                                    );
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="type_tested.container.preparation"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("preparation")}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t("preparation")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              navigate(`/facility/${facilityId}/settings/specimen_definitions`)
            }
          >
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {t("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
