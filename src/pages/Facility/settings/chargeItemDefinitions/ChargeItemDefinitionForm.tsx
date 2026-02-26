import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, Loader2 } from "lucide-react";
import { navigate } from "raviger";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "@/components/ui/monetary-display";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { MonetaryComponentSelector } from "@/components/Billing/MonetaryComponentSelector";
import Loading from "@/components/Common/Loading";
import { ResourceCategoryPicker } from "@/components/Common/ResourceCategoryPicker";

import { cn } from "@/lib/utils";

import { CodeSchema } from "@/types/base/code/code";
import {
  ConditionForm,
  conditionSchema,
  getConditionDiscriminatorValue,
} from "@/types/base/condition/condition";
import {
  isSameComponentCode,
  MonetaryComponent,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";
import { ResourceCategoryResourceType } from "@/types/base/resourceCategory/resourceCategory";
import {
  MRP_CODE,
  PURCHASE_PRICE_CODE,
} from "@/types/billing/chargeItem/chargeItem";
import {
  ChargeItemDefinitionCreate,
  ChargeItemDefinitionRead,
  ChargeItemDefinitionStatus,
} from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";
import facilityApi from "@/types/facility/facilityApi";
import { round, zodDecimal } from "@/Utils/decimal";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { generateSlug } from "@/Utils/utils";

interface ChargeItemDefinitionFormProps {
  facilityId: string;
  initialData?: ChargeItemDefinitionRead;
  categorySlug?: string;
  minimal?: boolean;
  isUpdate?: boolean;
  onSuccess?: (chargeItemDefinition: ChargeItemDefinitionRead) => void;
  onCancel?: () => void;
}

export function ChargeItemDefinitionForm({
  facilityId,
  initialData,
  minimal = false,
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
    if (categorySlug) {
      navigate(
        `/facility/${facilityId}/settings/charge_item_definitions/categories/${categorySlug}`,
      );
    } else {
      navigate(`/facility/${facilityId}/settings/charge_item_definitions`);
    }
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

  // Fetch available metrics for conditions
  const { data: availableMetrics = [] } = useQuery({
    queryKey: ["metrics"],
    queryFn: query(chargeItemDefinitionApi.listMetrics),
  });

  const createFormSchema = (
    t: (key: string, options?: Record<string, unknown>) => string,
  ) =>
    z.object({
      title: z.string().min(1, { message: t("title_is_required") }),
      slug_value: z
        .string()
        .trim()
        .min(5, {
          message: t("character_count_validation", { min: 5, max: 25 }),
        })
        .max(25, {
          message: t("character_count_validation", { min: 5, max: 25 }),
        })
        .regex(/^[a-z0-9_-]+$/, {
          message: t("slug_format_message"),
        }),
      category: z.string().min(1, { message: t("field_required") }),
      _categoryName: z.string().optional(),
      status: z.nativeEnum(ChargeItemDefinitionStatus),
      description: z.string().optional(),
      purpose: z.string().optional(),
      derived_from_uri: z
        .string()
        .optional()
        .refine(
          (val) => {
            return !val || /^https?:\/\/.+/.test(val);
          },
          { message: t("invalid_url") },
        ),
      base_price: zodDecimal({ message: t("base_price_is_required") }),
      mrp: zodDecimal({ min: 0 }).optional().nullable(),
      purchase_price: zodDecimal({ min: 0 }).optional().nullable(),
      can_edit_charge_item: z.boolean(),
      price_components: z.array(
        z.object({
          monetary_component_type: z.nativeEnum(MonetaryComponentType),
          code: CodeSchema.optional(),
          factor: zodDecimal({ min: 0, max: 100 }).optional().nullable(),
          amount: zodDecimal({ min: 0 }).optional().nullable(),
          conditions: z.array(conditionSchema),
          global_component: z.boolean().optional(),
        }),
      ),
    });

  const formSchema = createFormSchema(t);

  // Helper function to get default values
  const getDefaultValues = () => {
    const mrpComponent = initialData?.price_components.find(
      (c) =>
        c.code?.code === MRP_CODE &&
        c.monetary_component_type === MonetaryComponentType.informational,
    );
    const purchasePriceComponent = initialData?.price_components.find(
      (c) =>
        c.code?.code === PURCHASE_PRICE_CODE &&
        c.monetary_component_type === MonetaryComponentType.informational,
    );

    const initialDataBasePrice = initialData?.price_components.find(
      (c) => c.monetary_component_type === MonetaryComponentType.base,
    )?.amount;

    return {
      // Basic information fields
      title: initialData?.title || "",
      slug_value: initialData?.slug_config.slug_value || "",
      category: isUpdate
        ? initialData?.category.slug || ""
        : initialData?.category.slug || categorySlug || "",
      _categoryName: isUpdate
        ? initialData?.category.title || ""
        : initialData?.category.title || "",
      status: initialData?.status || ChargeItemDefinitionStatus.active,

      // Additional details
      description: initialData?.description || "",
      purpose: initialData?.purpose || "",
      derived_from_uri: initialData?.derived_from_uri || undefined,

      // Base price
      base_price: initialDataBasePrice ? round(initialDataBasePrice) : "",

      // MRP and Purchase Price
      mrp: mrpComponent?.amount ? round(mrpComponent.amount) : null,
      purchase_price: purchasePriceComponent?.amount
        ? round(purchasePriceComponent.amount)
        : null,
      // Can edit charge item
      can_edit_charge_item: initialData?.can_edit_charge_item ?? true,
      // Price components (excluding base price, MRP, and Purchase Price components)
      price_components:
        initialData?.price_components
          .filter(
            (c) =>
              c.monetary_component_type !== MonetaryComponentType.base &&
              c.code?.code !== MRP_CODE &&
              c.code?.code !== PURCHASE_PRICE_CODE,
          )
          .map((component) => ({
            ...component,
            amount: component.amount
              ? round(component.amount)
              : component.amount,
            factor: component.factor
              ? round(component.factor)
              : component.factor,
            conditions:
              component.conditions?.map((condition) => ({
                ...condition,
                _conditionType: getConditionDiscriminatorValue(
                  condition.metric,
                  condition.operation,
                ),
              })) || [],
          })) || [],
    };
  };

  // Initialize form (with basic information fields)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
    mode: "onChange",
    reValidateMode: "onChange",
  });

  // Reset form when initialData changes (for update mode)
  useEffect(() => {
    if (isUpdate && initialData) {
      form.reset(getDefaultValues());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.slug, isUpdate]);

  useEffect(() => {
    if (isUpdate) return;

    const subscription = form.watch((value, { name }) => {
      if (name === "title") {
        form.setValue("slug_value", generateSlug(value.title || "", 25), {
          shouldValidate: true,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [form, isUpdate]);

  // Get current form values
  const priceComponents = form.watch("price_components");
  const basePrice = form.watch("base_price") || "0";

  const { isDirty } = form.formState;

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
      toast.success(
        isUpdate
          ? t("charge_item_definition_updated_successfully")
          : t("charge_item_definition_created_successfully"),
      );
    },
    onError: (error) => {
      console.error("Mutation failed:", error);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Build price components array
    const priceComponents: MonetaryComponent[] = [
      // Base price component (always first)
      {
        monetary_component_type: MonetaryComponentType.base,
        amount: values.base_price,
        conditions: [],
      },
    ];

    // Add MRP if provided
    if (values.mrp && values.mrp !== "") {
      priceComponents.push({
        monetary_component_type: MonetaryComponentType.informational,
        amount: values.mrp,
        code: mrpCode,
        conditions: [],
      });
    }

    // Add Purchase Price if provided
    if (values.purchase_price && values.purchase_price !== "") {
      priceComponents.push({
        monetary_component_type: MonetaryComponentType.informational,
        amount: values.purchase_price,
        code: purchasePriceCode,
        conditions: [],
      });
    }

    // Add other components (taxes, discounts, etc.)
    priceComponents.push(
      ...values.price_components.map((component) => ({
        ...component,
        conditions: component.conditions,
      })),
    );

    // For minimal mode, ensure status is active
    const submissionData = {
      ...values,
      // Override status if in minimal mode
      status: minimal ? ChargeItemDefinitionStatus.active : values.status,
      price_components: priceComponents,
    };

    // Remove mrp and purchase_price from submission (they're in price_components now)
    const {
      mrp: _mrp,
      purchase_price: _purchase_price,
      ...finalData
    } = submissionData;

    upsert(finalData as ChargeItemDefinitionCreate);
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
  ) || {
    code: MRP_CODE,
    system: "care",
    display: t("mrp"),
  };

  const purchasePriceCode = facilityData.instance_informational_codes.find(
    (c) => c.code === PURCHASE_PRICE_CODE,
  ) || {
    code: PURCHASE_PRICE_CODE,
    system: "care",
    display: t("purchase_price"),
  };

  // Get currently selected components by type
  const getSelectedComponents = (type: MonetaryComponentType) =>
    priceComponents.filter((c) => c.monetary_component_type === type);

  // Handle selection change from MonetaryComponentSelector
  const handleSelectionChange = (
    selectedComponents: MonetaryComponent[],
    type: MonetaryComponentType,
  ) => {
    const currentComponents = form.getValues("price_components");

    // Remove all components of this type
    const otherComponents = currentComponents.filter(
      (c) => c.monetary_component_type !== type,
    );

    // Add all newly selected components
    const newSelectedComponents = selectedComponents.map((component) => ({
      ...component,
      monetary_component_type: type,
      conditions:
        component.conditions?.map((condition) => ({
          ...condition,
          _conditionType: getConditionDiscriminatorValue(
            condition.metric,
            condition.operation,
          ),
        })) || [],
    }));

    const newComponents = [...otherComponents, ...newSelectedComponents];

    form.setValue("price_components", newComponents, {
      shouldValidate: true,
      shouldDirty: true,
    });
    form.trigger("price_components");
  };

  // Handle component conditions change
  const handleComponentConditionsChange = (
    component: MonetaryComponent,
    conditions: ConditionForm[],
  ) => {
    const currentComponents = form.getValues("price_components");
    const componentIndex = currentComponents.findIndex((c) =>
      isSameComponentCode(c, component),
    );

    if (componentIndex === -1) return;

    const newComponents = [...currentComponents];
    newComponents[componentIndex] = {
      ...newComponents[componentIndex],
      conditions: conditions?.map((condition) => ({
        ...condition,
        _conditionType: getConditionDiscriminatorValue(
          condition.metric,
          condition.operation,
        ),
      })),
    };

    form.setValue("price_components", newComponents, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit(onSubmit)(e);
        }}
        className="space-y-6"
      >
        {/* Basic Information */}
        <div
          className={cn(
            "grid grid-cols-1 md:grid-cols-3 gap-2 mb-4 sm:mb-2 items-start",
            !minimal && "md:grid-cols-2 mb-2",
          )}
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("title")} <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t("title")} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("slug")} <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("slug_input_placeholder")}
                    onChange={(e) => {
                      const sanitizedValue = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_-]/g, "");
                      form.setValue("slug_value", sanitizedValue, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("category")} <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <ResourceCategoryPicker
                    facilityId={facilityId}
                    resourceType={
                      ResourceCategoryResourceType.charge_item_definition
                    }
                    value={field.value}
                    onValueChange={(category) => {
                      field.onChange(category?.slug || "");
                      form.setValue("_categoryName", category?.title || "");
                    }}
                    placeholder={t("select_category")}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!minimal && (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("status")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
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

        {/* Additional Details */}
        {!minimal && (
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
                        onChange={(e) =>
                          field.onChange(e.target.value || undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="can_edit_charge_item"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{t("can_edit_charge_item")}</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Pricing Components */}
        <Card className="bg-gray-50">
          <CardHeader className={minimal ? "pb-3" : ""}>
            <CardTitle className={minimal ? "text-lg" : ""}>
              {t("pricing_components")}
            </CardTitle>
          </CardHeader>
          <CardContent className={minimal ? "space-y-4 pt-0" : "space-y-6"}>
            {/* Base Price */}
            <div className={"flex md:flex-row flex-col gap-4"}>
              <div className="w-full">
                <FormItem className="flex flex-col">
                  <div className="flex flex-col w-full gap-2">
                    <FormField
                      control={form.control}
                      name="base_price"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel className="font-medium text-gray-900 text-base">
                            {t("base_price")}
                          </FormLabel>
                          <FormControl>
                            <MonetaryAmountInput
                              {...field}
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(e.target.value || "")
                              }
                              placeholder="0.00"
                              allowNegative
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            {t("negative_price_for_discount_hint")}
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </FormItem>
              </div>
              {/* MRP */}
              <div className="w-full">
                <FormField
                  control={form.control}
                  name="mrp"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel className="font-medium text-gray-900 text-base">
                        {t("mrp")}
                      </FormLabel>
                      <FormControl>
                        <MonetaryAmountInput
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(e.target.value || null)
                          }
                          placeholder="0.00"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* Purchase Price */}
              <div className="w-full">
                <FormField
                  control={form.control}
                  name="purchase_price"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel className="font-medium text-gray-900 text-base">
                        {t("purchase_price")}
                      </FormLabel>
                      <FormControl>
                        <MonetaryAmountInput
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(e.target.value || null)
                          }
                          placeholder="0.00"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <MonetaryComponentSelector
              title={t("taxes")}
              components={availableTaxes}
              selectedComponents={getSelectedComponents(
                MonetaryComponentType.tax,
              )}
              onSelectionChange={(components) =>
                handleSelectionChange(components, MonetaryComponentType.tax)
              }
              type={MonetaryComponentType.tax}
              className={minimal ? "w-full" : ""}
            />

            <MonetaryComponentSelector
              title={t("discounts")}
              components={availableDiscounts}
              selectedComponents={getSelectedComponents(
                MonetaryComponentType.discount,
              )}
              onSelectionChange={(components) =>
                handleSelectionChange(
                  components,
                  MonetaryComponentType.discount,
                )
              }
              onConditionsChange={handleComponentConditionsChange}
              type={MonetaryComponentType.discount}
              showConditionsEditor
              availableMetrics={availableMetrics}
              className={minimal ? "w-full" : ""}
            />

            {/* Price Summary */}
            {!minimal && (
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
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div
          className={`flex justify-end ${minimal ? "space-x-1" : "space-x-2"}`}
        >
          <Button
            type="button"
            variant="outline"
            size={minimal ? "sm" : "default"}
            disabled={isPending}
            onClick={onCancel}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            size={minimal ? "sm" : "default"}
            disabled={isPending || (isUpdate && !isDirty)}
          >
            {isPending ? (
              <>
                <Loader2
                  className={`${minimal ? "mr-1" : "mr-2"} size-4 animate-spin`}
                />
                {t("saving")}
              </>
            ) : (
              <>
                <CheckIcon className={`${minimal ? "mr-1" : "mr-2"} size-4`} />
                {isUpdate ? t("update") : t("create")}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
