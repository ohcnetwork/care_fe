import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, Loader2 } from "lucide-react";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
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
  mapPriceComponent,
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

import { CompactConditionEditor } from "@/components/Billing/CompactConditionEditor";
import Loading from "@/components/Common/Loading";
import { ResourceCategoryPicker } from "@/components/Common/ResourceCategoryPicker";

import { cn } from "@/lib/utils";
import {
  Condition,
  conditionSchema,
  Metrics,
} from "@/types/base/condition/condition";
import {
  MonetaryComponent,
  MonetaryComponentRead,
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
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { Check, ChevronDown, Component, Search, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import RadioInput from "@/components/ui/RadioInput";
import { generateSlug } from "@/Utils/utils";

interface MonetaryComponentSelectorProps {
  title: string;
  components: MonetaryComponentRead[];
  selectedComponents: MonetaryComponent[];
  onComponentToggle: (
    component: MonetaryComponent,
    selected: boolean,
    type: MonetaryComponentType,
  ) => void;
  onConditionsChange: (
    component: MonetaryComponent,
    conditions: Condition[],
  ) => void;
  type: MonetaryComponentType;
  availableMetrics: Metrics[];
  className?: string;
}

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
  conditions: z.array(conditionSchema),
});

interface ChargeItemDefinitionFormProps {
  facilityId: string;
  initialData?: ChargeItemDefinitionRead;
  categorySlug?: string;
  minimal?: boolean;
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
export function MonetaryComponentSelector({
  title,
  components,
  selectedComponents,
  onComponentToggle,
  onConditionsChange,
  type,
  availableMetrics,
  className = "",
}: MonetaryComponentSelectorProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSelectedComponents, setTempSelectedComponents] = useState<
    MonetaryComponent[]
  >([]);

  // Initialize temp selections when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTempSelectedComponents(selectedComponents);
    }
  }, [isOpen, selectedComponents]);

  const getComponentValue = (component: MonetaryComponent) => {
    return component.factor ?? component.amount ?? 0;
  };

  const isSameAmountOrFactor = (
    component: MonetaryComponent,
    otherComponent: MonetaryComponent,
  ) => {
    return (
      (component.factor != null &&
        component.factor === otherComponent.factor) ||
      (component.amount != null && component.amount === otherComponent.amount)
    );
  };

  const isComponentSelected = (
    component: MonetaryComponentRead,
    selectedComponents: MonetaryComponent[],
  ) =>
    selectedComponents.some(
      (c) =>
        monetaryComponentIsEqual(c, component) &&
        isSameAmountOrFactor(c, component),
    );

  // Group components by code
  const groupedComponents = components.reduce<
    Record<string, MonetaryComponentRead[]>
  >((acc, component) => {
    const key = component.code?.code;
    if (key) {
      (acc[key] ||= []).push(component);
    }
    return acc;
  }, {});

  const groupComponents: Record<string, MonetaryComponentRead[]> = {};
  const nonGroupComponents: MonetaryComponentRead[] = [];

  Object.entries(groupedComponents).forEach(([key, comps]) => {
    if (comps.length > 1) {
      groupComponents[key] = comps;
    } else {
      nonGroupComponents.push(comps[0]);
    }
  });

  const filteredGroupComponents = Object.entries(groupComponents).reduce<
    Record<string, MonetaryComponentRead[]>
  >((acc, [key, comps]) => {
    const filteredComps = comps.filter(
      (component) =>
        component.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        component.code?.code?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    if (filteredComps.length > 0) {
      acc[key] = filteredComps;
    }

    return acc;
  }, {});

  const filteredNonGroupComponents = nonGroupComponents.filter(
    (component) =>
      component.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      component.code?.code?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleTempToggle = (
    component: MonetaryComponentRead,
    checked: boolean,
  ) => {
    if (checked) {
      const newComponent: MonetaryComponent = {
        ...component,
        monetary_component_type: type,
        factor: component.factor != null ? component.factor : undefined,
        amount:
          component.factor != null ? undefined : String(component.amount || 0),
        conditions: [],
      };
      setTempSelectedComponents((prev) => [...prev, newComponent]);
    } else {
      setTempSelectedComponents((prev) =>
        prev.filter((c) => !monetaryComponentIsEqual(c, component)),
      );
    }
  };

  const handleDone = () => {
    // Remove all current selections first
    selectedComponents.forEach((component) => {
      onComponentToggle(component, false, type);
    });

    // Add all temp selections
    tempSelectedComponents.forEach((component) => {
      onComponentToggle(component, true, type);
    });

    setIsOpen(false);
    setSearchQuery("");
  };

  const handleCancel = () => {
    setIsOpen(false);
    setSearchQuery("");
    setTempSelectedComponents([]);
  };

  const handleRadioButtonChange = (groupKey: string, selected: string) => {
    // If selected is empty, it means the user deselected the radio button
    if (!selected) {
      // Remove any component from this group
      setTempSelectedComponents((prev) =>
        prev.filter((c) => c.code?.code !== groupKey),
      );
      return;
    }

    const group = groupComponents[groupKey];
    if (!group) return;

    // Find the component with the matching value
    const selectedComponent = group.find(
      (component) => getComponentValue(component).toString() === selected,
    );

    if (!selectedComponent) return;

    // Remove any existing selection from this group and add the new one
    setTempSelectedComponents((prev) => {
      // Remove any component from the same group (by code)
      const filtered = prev.filter((c) => c.code?.code !== groupKey);
      return [...filtered, selectedComponent];
    });
  };

  const renderGroupCheckList = (
    groupComponents: Record<string, MonetaryComponentRead[]>,
  ) => {
    if (Object.keys(groupComponents).length === 0) {
      return <></>;
    }
    return (
      <div className="flex flex-col gap-2">
        {Object.entries(groupComponents).map(([key, components]) => {
          const selectedInGroup = components.find((component) =>
            isComponentSelected(component, tempSelectedComponents),
          );
          const selectedValue = selectedInGroup
            ? `${getComponentValue(selectedInGroup)}`
            : "";

          const radioOptions = components.map((component) => ({
            label: `${getComponentValue(component)} ${component.factor != null ? "%" : "₹"}`,
            value: `${getComponentValue(component)}`,
          }));

          return (
            <div key={`${key}`} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 p-2">
                <Component
                  className="h-4 w-4 text-black/80"
                  strokeWidth={1.25}
                />
                <div className="text-sm font-semibold text-gray-900 uppercase">
                  {key}
                </div>
              </div>
              <RadioInput
                value={selectedValue}
                onValueChange={(value: string) =>
                  handleRadioButtonChange(key, value)
                }
                options={radioOptions}
                className="flex flex-row gap-1 justify-end mr-2"
              />
            </div>
          );
        })}
      </div>
    );
  };

  const renderCheckList = (
    listComponents: MonetaryComponentRead[],
    isGroup = false,
  ) => {
    if (listComponents.length === 0) {
      return <></>;
    }
    return listComponents.map((component, idx) => {
      return (
        <div
          key={`${component.title}-${component.code?.code || idx}`}
          className={cn(
            "flex items-center space-x-3 p-2 hover:bg-gray-50 rounded",
          )}
        >
          <Checkbox
            checked={isComponentSelected(component, tempSelectedComponents)}
            onCheckedChange={(checked) =>
              handleTempToggle(component, checked as boolean)
            }
            className={cn(isGroup && "aria-hidden")}
          />
          <div className="flex flex-row justify-between items-center flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900">
              {component.code?.display}
            </div>
            <div className="flex flex-row items-center gap-2 h-10">
              {getComponentValue(component)}
              <span className="text-gray-500">
                {component.factor != null ? "%" : "₹"}
              </span>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className={cn("space-y-1", className)}>
      {/* Selected Components Section - Only for Discounts */}
      {type === MonetaryComponentType.discount &&
        selectedComponents.length > 0 && (
          <div className="space-y-1 mb-2">
            <p className="text-sm font-medium text-gray-700">
              {t("selected")} {title.toLowerCase()}
            </p>

            {selectedComponents.map((component, idx) => {
              const componentRead = components.find((c) =>
                monetaryComponentIsEqual(c, component),
              );

              return (
                <div
                  key={`selected-${componentRead?.title}-${componentRead?.code?.code || idx}`}
                  className="p-3 rounded-lg bg-white border border-gray-200 transition-colors"
                >
                  <div className="flex items-center justify-between border-b pb-2">
                    <div>
                      <div className="font-medium text-md">
                        {idx + 1}. {componentRead?.code?.display} -{" "}
                        {getComponentValue(component)}
                        {component.factor != null ? "%" : "₹"}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onComponentToggle(component, false, type)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Condition editor for discount components */}
                  <CompactConditionEditor
                    conditions={component.conditions || []}
                    availableMetrics={availableMetrics}
                    onChange={(conditions) =>
                      onConditionsChange(
                        { ...component, monetary_component_type: type },
                        conditions,
                      )
                    }
                    className="mt-3"
                  />
                </div>
              );
            })}
          </div>
        )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-900">{title}</p>
        </div>
      </div>

      {/* Trigger Area */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="bg-white border rounded-md p-3 cursor-pointer hover:border-gray-400 transition-colors min-h-[44px] flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {selectedComponents.length === 0 ? (
                <span className="text-gray-500 text-sm">
                  {t(
                    type === MonetaryComponentType.tax
                      ? "add_tax"
                      : "add_discount",
                  )}
                </span>
              ) : type === MonetaryComponentType.tax ? (
                // For taxes, show badges in trigger
                <>
                  {selectedComponents.slice(0, 3).map((component, idx) => {
                    const value = getComponentValue(component);
                    const suffix = component.factor != null ? "%" : "₹";
                    const display = component.code?.display;
                    return (
                      <Badge
                        key={`${component.code?.code}-${idx}`}
                        variant="secondary"
                        className="text-xs p-1 rounded-sm"
                      >
                        {display} @ {value}
                        {suffix}
                      </Badge>
                    );
                  })}
                  {selectedComponents.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{selectedComponents.length - 3} {t("more")}
                    </Badge>
                  )}
                </>
              ) : (
                // For discounts, just show count
                <span className="text-gray-700 text-sm">
                  {selectedComponents.length} {t("selected")}
                </span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </PopoverTrigger>

        <PopoverContent className="w-68 p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(
                  type === MonetaryComponentType.tax
                    ? "search_for_tax_code"
                    : "search_for_discount_code",
                )}
                className="pl-10"
              />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto p-2">
            {renderGroupCheckList(filteredGroupComponents)}
            {renderCheckList(filteredNonGroupComponents)}
          </div>

          <div className="p-3 border-t flex gap-2">
            <Button
              onClick={handleCancel}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleDone}
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-1" />
              {t("done")}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
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

  // Fetch available metrics for conditions
  const { data: availableMetrics = [] } = useQuery({
    queryKey: ["metrics"],
    queryFn: query(chargeItemDefinitionApi.listMetrics),
  });

  // Main form schema (including basic information fields)
  const formSchema = z.object({
    title: z.string().min(1, { message: "field_required" }),
    slug_value: z
      .string()
      .trim()
      .min(5, t("character_count_validation", { min: 5, max: 25 }))
      .max(25, t("character_count_validation", { min: 5, max: 25 }))
      .regex(/^[a-z0-9-]+$/, {
        message: "slug_format_message",
      }),
    category: z.string().min(1, { message: "field_required" }),
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
        { message: "Please enter a valid URL" },
      ),
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

  // Initialize form (with basic information fields)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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

      // Price components
      price_components: initialData?.price_components.map((component) => ({
        ...mapPriceComponent(component),
        conditions: component.conditions || [],
      })) || [
        {
          monetary_component_type: MonetaryComponentType.base,
          amount: "0",
          conditions: [],
        },
      ],
    },
  });

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
  const basePrice = form.watch("price_components.0.amount")?.toString() || "0";
  const mrp = priceComponents.find(
    (c) =>
      c.code?.code === MRP_CODE &&
      c.monetary_component_type === MonetaryComponentType.informational,
  )?.amount;

  const purchasePrice = priceComponents.find(
    (c) =>
      c.code?.code === PURCHASE_PRICE_CODE &&
      c.monetary_component_type === MonetaryComponentType.informational,
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
    onError: (error) => {
      console.error("Mutation failed:", error);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // For minimal mode, ensure status is active
    const submissionData: ChargeItemDefinitionCreate = {
      ...values,
      // Override status if in minimal mode
      status: minimal ? ChargeItemDefinitionStatus.active : values.status,
      price_components: values.price_components.map((component) => ({
        ...component,
        conditions: component.conditions,
      })),
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

  // Handle component selection
  const handleComponentToggle = (
    component: MonetaryComponent,
    selected: boolean,
    type: MonetaryComponentType = MonetaryComponentType.tax,
  ) => {
    const currentComponents = form.getValues("price_components");
    let newComponents: z.infer<typeof priceComponentSchema>[];

    if (selected) {
      newComponents = [
        ...currentComponents,
        {
          ...component,
          monetary_component_type: type,
          factor: component.factor != null ? component.factor : undefined,
          amount:
            component.factor != null ? undefined : String(component.amount),
          conditions: component.conditions || [],
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

  // Handle component conditions change
  const handleComponentConditionsChange = (
    component: MonetaryComponent,
    conditions: Condition[],
  ) => {
    const currentComponents = form.getValues("price_components");
    const componentIndex = currentComponents.findIndex((c) =>
      monetaryComponentIsEqual(c, component),
    );

    if (componentIndex === -1) return;

    const newComponents = [...currentComponents];
    newComponents[componentIndex] = {
      ...newComponents[componentIndex],
      conditions,
    };

    form.setValue("price_components", newComponents, { shouldValidate: true });
  };

  const handleMrpChange = (value: string) => {
    const currentComponents = form.getValues("price_components");
    const mrpIndex = currentComponents.findIndex(
      (c) =>
        c.code?.code === MRP_CODE &&
        c.monetary_component_type === MonetaryComponentType.informational,
    );

    if (mrpIndex >= 0) {
      const updatedComponents = [...currentComponents];
      updatedComponents[mrpIndex] = {
        ...updatedComponents[mrpIndex],
        amount: value,
        // Todo: We should replace MRP code implementation with a generic informational code implementation
        code: mrpCode,
      };
      form.setValue("price_components", updatedComponents);
    } else {
      const newComponent = {
        monetary_component_type: MonetaryComponentType.informational,
        amount: value,
        code: mrpCode,
        conditions: [],
      };
      form.setValue("price_components", [...currentComponents, newComponent]);
    }
  };

  const handlePurchasePriceChange = (value: string) => {
    const currentComponents = form.getValues("price_components");
    const purchasePriceIndex = currentComponents.findIndex(
      (c) =>
        c.code?.code === PURCHASE_PRICE_CODE &&
        c.monetary_component_type === MonetaryComponentType.informational,
    );

    if (purchasePriceIndex >= 0) {
      const updatedComponents = [...currentComponents];
      updatedComponents[purchasePriceIndex] = {
        ...updatedComponents[purchasePriceIndex],
        amount: value,
        code: purchasePriceCode,
      };
      form.setValue("price_components", updatedComponents);
    } else {
      const newComponent = {
        monetary_component_type: MonetaryComponentType.informational,
        amount: value,
        code: purchasePriceCode,
        conditions: [],
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
          form.handleSubmit(onSubmit as any)();
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
                      field.onChange(sanitizedValue);
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
                control={form.control as any}
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
                control={form.control as any}
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
                control={form.control as any}
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
                  <FormLabel
                    className={cn("font-medium text-gray-900 text-base")}
                  >
                    {t("base_price")}
                  </FormLabel>
                  <div className="flex flex-col w-full gap-2">
                    <FormField
                      control={form.control}
                      name="price_components.0.amount"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormControl>
                            <MonetaryAmountInput
                              {...field}
                              value={field.value ?? 0}
                              onChange={(e) =>
                                field.onChange(String(e.target.value))
                              }
                              placeholder="0.00"
                            />
                          </FormControl>
                          <FormMessage>
                            {
                              form.formState.errors.price_components?.[0]
                                ?.amount?.message
                            }
                          </FormMessage>
                        </FormItem>
                      )}
                    />
                  </div>
                </FormItem>
              </div>
              {/* MRP */}
              <div className="w-full">
                <FormItem className="flex flex-col">
                  <FormLabel
                    className={cn("font-medium text-gray-900 text-base")}
                  >
                    {t("mrp")}
                  </FormLabel>
                  <div className="flex flex-col w-full gap-2">
                    <FormControl className="w-full">
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
              {/* Purchase Price */}
              <div className="w-full">
                <FormItem className="flex flex-col">
                  <FormLabel
                    className={cn("font-medium text-gray-900 text-base")}
                  >
                    {t("purchase_price")}
                  </FormLabel>
                  <div className="flex flex-col w-full gap-2">
                    <FormControl className="w-full">
                      <MonetaryAmountInput
                        value={purchasePrice ?? 0}
                        onChange={(e) =>
                          handlePurchasePriceChange(e.target.value)
                        }
                        placeholder="0.00"
                      />
                    </FormControl>
                  </div>
                </FormItem>
              </div>
            </div>

            <MonetaryComponentSelector
              title={t("taxes")}
              components={availableTaxes}
              selectedComponents={getSelectedComponents(
                MonetaryComponentType.tax,
              )}
              onComponentToggle={handleComponentToggle}
              onConditionsChange={handleComponentConditionsChange}
              type={MonetaryComponentType.tax}
              availableMetrics={availableMetrics}
              className={minimal ? "w-full" : ""}
            />

            <MonetaryComponentSelector
              title={t("discounts")}
              components={availableDiscounts}
              selectedComponents={getSelectedComponents(
                MonetaryComponentType.discount,
              )}
              onComponentToggle={handleComponentToggle}
              onConditionsChange={handleComponentConditionsChange}
              type={MonetaryComponentType.discount}
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
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2
                  className={`${minimal ? "mr-1" : "mr-2"} h-4 w-4 animate-spin`}
                />
                {t("saving")}
              </>
            ) : (
              <>
                <CheckIcon className={`${minimal ? "mr-1" : "mr-2"} h-4 w-4`} />
                {isUpdate ? t("update") : t("create")}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
