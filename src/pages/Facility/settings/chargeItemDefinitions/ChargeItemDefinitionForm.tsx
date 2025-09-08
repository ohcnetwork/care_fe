import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, Loader2 } from "lucide-react";
import { navigate } from "raviger";
import { useEffect } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";

import Autocomplete from "@/components/ui/autocomplete";
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
  MonetaryAmountInput,
  MonetaryDisplay,
  mapPriceComponent,
} from "@/components/ui/monetary-display";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import Loading from "@/components/Common/Loading";
import { ResourceCategoryPicker } from "@/components/Common/ResourceCategoryPicker";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { generateSlug } from "@/Utils/utils";
import {
  MonetaryComponent,
  MonetaryComponentRead,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";
import { ResourceCategoryResourceType } from "@/types/base/resourceCategory/resourceCategory";
import { MRP_CODE } from "@/types/billing/chargeItem/chargeItem";
import {
  ChargeItemDefinitionCreate,
  ChargeItemDefinitionRead,
  ChargeItemDefinitionStatus,
} from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";
import facilityApi from "@/types/facility/facilityApi";

// Schema for a single price component
const priceComponentSchema = z.object({
  monetary_component_type: z.nativeEnum(MonetaryComponentType),
  code: z
    .object({
      code: z.string(),
      system: z.string(),
      display: z.string(),
    })
    .optional(),
  factor: z.number().gt(0).max(100).optional(),
  amount: z
    .string()
    .refine((val) => !val || Number(val) > 0, {
      message: "Amount must be greater than 0",
    })
    .optional(),
});

interface ChargeItemDefinitionFormProps {
  facilityId: string;
  initialData?: ChargeItemDefinitionRead;
  categorySlug?: string;
  isUpdate?: boolean;
  onSuccess?: (chargeItemDefinition: ChargeItemDefinitionRead) => void;
  onCancel?: () => void;
}

const monetaryComponentIsEqual = <T extends MonetaryComponent>(a: T, b: T) => {
  return (
    a.monetary_component_type === b.monetary_component_type &&
    a.code?.code === b.code?.code &&
    a.code?.system === b.code?.system &&
    a.code?.display === b.code?.display
  );
};

// Component for monetary component selection with autocomplete
function MonetaryComponentSelectionSection({
  title,
  description,
  components,
  selectedComponents,
  onComponentToggle,
  onValueChange,
  type,
  errors,
}: {
  title: string;
  description: string;
  components: MonetaryComponentRead[];
  selectedComponents: MonetaryComponent[];
  onComponentToggle: (component: MonetaryComponent, selected: boolean) => void;
  onValueChange: (component: MonetaryComponent, value: number) => void;
  type: MonetaryComponentType;
  errors: FieldErrors<z.infer<typeof priceComponentSchema>>[];
}) {
  const { t } = useTranslation();

  const isComponentSelected = (component: MonetaryComponentRead) =>
    selectedComponents.some(
      (c) =>
        monetaryComponentIsEqual(c, component) ||
        (component.code && c.code && component.code.code === c.code.code),
    );

  const getComponentValue = (component: MonetaryComponent) => {
    return component.factor ?? component.amount ?? 0;
  };

  // Convert components to autocomplete options
  const availableOptions = components
    .filter((c) => !isComponentSelected(c))
    .map((c) => ({ label: c.title, value: c.title }));

  // Function to handle selection from autocomplete
  const handleAutocompleteChange = (value: string) => {
    if (!value) return;
    const component = components.find((c) => c.title === value);
    if (component) {
      onComponentToggle(component, true);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>

      {/* Selected Components */}
      <div className="space-y-3">
        {selectedComponents.map((component, idx) => {
          const componentRead = components.find((c) =>
            monetaryComponentIsEqual(c, component),
          );

          return (
            <div
              key={idx}
              className="p-3 rounded-lg bg-white border border-gray-200 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{componentRead?.title}</div>
                  <div className="text-sm text-gray-500">
                    {componentRead?.code?.code}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onComponentToggle(component, false)}
                >
                  {t("remove")}
                </Button>
              </div>

              <div className="mt-3 flex items-center space-x-2">
                <Input
                  type="number"
                  min="0"
                  step="any"
                  max={component.factor != null ? 100 : undefined}
                  value={getComponentValue(component)}
                  onChange={(e) =>
                    onValueChange(
                      { ...component, monetary_component_type: type },
                      parseFloat(e.target.value),
                    )
                  }
                  className="text-right"
                />
                <span className="text-gray-500">
                  {component.factor != null ? "%" : "₹"}
                </span>
              </div>
              {errors && errors[idx] && (
                <p className="text-red-500">
                  {errors[idx].amount?.message || errors[idx].factor?.message}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Add New Component */}
      <div className="mt-4">
        <Autocomplete
          options={availableOptions}
          value=""
          onChange={handleAutocompleteChange}
          placeholder={t(
            type === MonetaryComponentType.tax ? "add_tax" : "add_discount",
          )}
          className="border-gray-200"
        />
      </div>
    </div>
  );
}

export function ChargeItemDefinitionForm({
  facilityId,
  initialData,
  isUpdate = false,
  categorySlug,
  onSuccess = () => {
    if (categorySlug) {
      navigate(
        `/facility/${facilityId}/settings/charge_item_definitions/categories/${categorySlug}`,
      );
    } else {
      navigate(`/facility/${facilityId}/settings/charge_item_definitions`);
    }
  },
  onCancel = () => {
    navigate(`/facility/${facilityId}/settings/charge_item_definitions`);
  },
}: ChargeItemDefinitionFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Fetch facility data for available components
  const { data: facilityData, isLoading } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(facilityApi.get, {
      pathParams: { facilityId },
    }),
  });

  // Main form schema
  const formSchema = z.object({
    title: z.string().min(1, { message: t("field_required") }),
    slug: z
      .string()
      .min(1, { message: t("field_required") })
      .regex(/^[a-z0-9-]+$/, {
        message: t("slug_format_message"),
      }),
    status: z.nativeEnum(ChargeItemDefinitionStatus),
    description: z.string().optional(),
    purpose: z.string().optional(),
    derived_from_uri: z.string().url().optional(),
    category: z.string(),
    price_components: z.array(priceComponentSchema).refine(
      (components) => {
        // Ensure there is exactly one base price component and it's the first one
        return (
          components.length > 0 &&
          components[0].monetary_component_type ===
            MonetaryComponentType.base &&
          components.filter(
            (c) => c.monetary_component_type === MonetaryComponentType.base,
          ).length === 1 &&
          components[0].amount !== undefined &&
          components[0].amount !== null &&
          components[0].amount !== "0"
        );
      },
      {
        message:
          "Exactly one base price component is required as the first component",
        path: ["price_components", "0", "amount"],
      },
    ),
  });

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      slug: initialData?.slug || "",
      status: initialData?.status || ChargeItemDefinitionStatus.active,
      description: initialData?.description,
      purpose: initialData?.purpose,
      derived_from_uri: initialData?.derived_from_uri,
      category: categorySlug,
      price_components: initialData?.price_components.map(
        mapPriceComponent,
      ) || [
        {
          monetary_component_type: MonetaryComponentType.base,
          amount: "0",
        },
      ],
    },
  });

  useEffect(() => {
    if (isUpdate) return;

    const subscription = form.watch((value, { name }) => {
      if (name === "title") {
        form.setValue("slug", generateSlug(value.title || ""), {
          shouldValidate: true,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [form, isUpdate]);

  // Get current form values
  const priceComponents = form.watch("price_components");
  const basePrice = form.watch("price_components.0.amount")?.toString() || "0";
  const mrp = priceComponents.find(
    (c) => c.monetary_component_type === MonetaryComponentType.informational,
  )?.amount;

  // Handle form submission
  const { mutate: upsert, isPending } = useMutation({
    mutationFn: isUpdate
      ? mutate(chargeItemDefinitionApi.updateChargeItemDefinition, {
          pathParams: { facilityId, slug: initialData!.slug },
        })
      : mutate(chargeItemDefinitionApi.createChargeItemDefinition, {
          pathParams: { facilityId },
        }),
    onSuccess: (chargeItemDefinition: ChargeItemDefinitionRead) => {
      queryClient.invalidateQueries({ queryKey: ["chargeItemDefinitions"] });
      onSuccess?.(chargeItemDefinition);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const submissionData: ChargeItemDefinitionCreate = {
      ...values,
      category: values.category,
    };
    upsert(submissionData);
  };

  if (isLoading || !facilityData) {
    return <Loading />;
  }

  // Get all available components
  const availableDiscounts = [
    ...facilityData.discount_monetary_components,
    ...facilityData.instance_discount_monetary_components,
  ];
  const availableTaxes = [...facilityData.instance_tax_monetary_components];

  const mrpCode = facilityData.instance_informational_codes.find(
    (c) => c.code === MRP_CODE,
  );

  // Get currently selected components by type
  const getSelectedComponents = (type: MonetaryComponentType) =>
    priceComponents.filter((c) => c.monetary_component_type === type);

  const getSelectedComponentError = (type: MonetaryComponentType) => {
    const priceComponentsErrors = form.formState.errors.price_components;
    if (!priceComponentsErrors || !Array.isArray(priceComponentsErrors))
      return [];
    const indices = priceComponents
      .map((c, index) => (c.monetary_component_type === type ? index : -1))
      .filter((index) => index !== -1);
    return indices.map((index) => priceComponentsErrors[index]);
  };

  // Handle component selection
  const handleComponentToggle = (
    component: MonetaryComponent,
    selected: boolean,
    type: MonetaryComponentType = MonetaryComponentType.tax,
  ) => {
    const currentComponents = form.getValues("price_components");
    let newComponents: MonetaryComponent[];

    if (selected) {
      newComponents = [
        ...currentComponents,
        {
          ...component,
          monetary_component_type: type,
          factor: component.factor != null ? component.factor : undefined,
          amount:
            component.factor != null ? undefined : String(component.amount),
        },
      ];
    } else {
      newComponents = currentComponents.filter(
        (c) => !monetaryComponentIsEqual(c, component),
      );
    }

    form.setValue("price_components", newComponents, { shouldValidate: true });
    form.trigger("price_components");
  };

  // Handle component value change
  const handleComponentValueChange = (
    component: MonetaryComponent,
    value: number,
  ) => {
    const currentComponents = form.getValues("price_components");
    const componentIndex = currentComponents.findIndex((c) =>
      monetaryComponentIsEqual(c, component),
    );

    if (componentIndex === -1) return;

    const newComponents = [...currentComponents];
    newComponents[componentIndex] = {
      ...component,
      factor: component.factor != null ? value : undefined,
      amount: component.factor != null ? undefined : String(value),
    };

    form.setValue("price_components", newComponents, { shouldValidate: true });
  };

  const handleMrpChange = (value: string) => {
    const currentComponents = form.getValues("price_components");
    const mrpIndex = currentComponents.findIndex(
      (c) => c.monetary_component_type === MonetaryComponentType.informational,
    );

    if (mrpIndex >= 0) {
      const updatedComponents = [...currentComponents];
      updatedComponents[mrpIndex] = {
        ...updatedComponents[mrpIndex],
        amount: value,
        code: mrpCode,
      };
      form.setValue("price_components", updatedComponents);
    } else {
      const newComponent = {
        monetary_component_type: MonetaryComponentType.informational,
        amount: value,
        code: mrpCode,
      };
      form.setValue("price_components", [...currentComponents, newComponent]);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit(onSubmit)();
        }}
        className="space-y-6"
      >
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t("basic_information")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel aria-required>{t("title")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("title")} />
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
                        placeholder={t("slug_input_placeholder")}
                        onChange={(e) => {
                          // Only allow lowercase letters, numbers, and hyphens
                          const sanitizedValue = e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9_-]/g, "");
                          field.onChange(sanitizedValue);
                        }}
                      />
                    </FormControl>
                    <p className="text-sm text-gray-500 mt-1">
                      {t("slug_format_message")}
                    </p>
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
                    <FormControl>
                      <ResourceCategoryPicker
                        facilityId={facilityId}
                        resourceType={
                          ResourceCategoryResourceType.charge_item_definition
                        }
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder={t("select_category")}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isUpdate && (
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
                          <SelectTrigger>
                            <SelectValue placeholder={t("select_status")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ChargeItemDefinitionStatus).map(
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
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle>{t("additional_details")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("purpose")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="derived_from_uri"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("derived_from_uri")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Pricing Components */}
        <Card>
          <CardHeader>
            <CardTitle>{t("pricing_components")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Base Price */}
            <div className="rounded-lg border p-4 bg-gray-50 space-y-2">
              <div>
                <h4 className="text-lg font-medium text-gray-900">
                  {t("base_price")}
                </h4>
                <p className="text-sm text-gray-600">
                  {t("base_price_explanation")}
                </p>
              </div>

              <FormField
                control={form.control}
                name="price_components.0.amount"
                render={({ field }) => (
                  <FormItem className="w-full space-y-1">
                    <FormControl>
                      <MonetaryAmountInput
                        {...field}
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(String(e.target.value))}
                        placeholder="0.00"
                      />
                    </FormControl>
                    <FormMessage>
                      {
                        form.formState.errors.price_components?.[0]?.amount
                          ?.message
                      }
                    </FormMessage>
                  </FormItem>
                )}
              />
            </div>
            {/* Discounts */}
            <MonetaryComponentSelectionSection
              title={t("discounts")}
              description={t("select_applicable_discounts")}
              components={availableDiscounts}
              selectedComponents={getSelectedComponents(
                MonetaryComponentType.discount,
              )}
              onComponentToggle={(component, selected) =>
                handleComponentToggle(
                  component,
                  selected,
                  MonetaryComponentType.discount,
                )
              }
              onValueChange={handleComponentValueChange}
              type={MonetaryComponentType.discount}
              errors={getSelectedComponentError(MonetaryComponentType.discount)}
            />

            {/* Taxes */}
            <MonetaryComponentSelectionSection
              title={t("taxes")}
              description={t("select_applicable_taxes")}
              components={availableTaxes}
              selectedComponents={getSelectedComponents(
                MonetaryComponentType.tax,
              )}
              onComponentToggle={(component, selected) =>
                handleComponentToggle(
                  component,
                  selected,
                  MonetaryComponentType.tax,
                )
              }
              onValueChange={handleComponentValueChange}
              type={MonetaryComponentType.tax}
              errors={getSelectedComponentError(MonetaryComponentType.tax)}
            />

            {/* MRP */}
            <div className="p-4 bg-gray-50 rounded-lg border">
              <FormItem className="flex items-center justify-between gap-2">
                <FormLabel className="font-medium text-gray-900 text-xl">
                  {t("mrp")}
                </FormLabel>
                <div className="flex flex-col items-end gap-2">
                  <FormControl className="w-48">
                    <MonetaryAmountInput
                      value={mrp ?? 0}
                      onChange={(e) => handleMrpChange(e.target.value)}
                      placeholder="0.00"
                    />
                  </FormControl>
                  <FormMessage>
                    {
                      form.formState.errors.price_components?.[0]?.amount
                        ?.message
                    }
                  </FormMessage>
                </div>
              </FormItem>
            </div>

            {/* Price Summary */}
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-100">
              <h4 className="font-medium text-green-900 mb-3">
                {t("price_summary")}
              </h4>
              <div className="space-y-2 divide-y divide-green-200">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">{t("base_price")}</span>
                  <MonetaryDisplay
                    className="font-medium text-gray-900"
                    amount={basePrice}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onCancel}
          >
            {t("cancel")}
          </Button>
          <Button disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("saving")}
              </>
            ) : (
              <>
                <CheckIcon className="mr-2 h-4 w-4" />
                {isUpdate ? t("update") : t("create")}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
