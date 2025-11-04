import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  MonetaryAmountInput,
  getCurrencySymbol,
} from "@/components/ui/monetary-display";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useShortcutSubContext } from "@/context/ShortcutContext";
import { conditionSchema } from "@/types/base/condition/condition";
import {
  MonetaryComponent,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";
import {
  ChargeItemRead,
  ChargeItemStatus,
  ChargeItemUpdate,
} from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";

interface EditInvoiceTableProps {
  facilityId: string;
  chargeItems: ChargeItemRead[];
  onClose: () => void;
  onSuccess: () => void;
  enableShortcut?: boolean;
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
  conditions: z.array(conditionSchema).optional(),
});

const chargeItemBaseSchema = z.object({
  baseAmount: z
    .string()
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
      "Base amount must be a positive number",
    ),
  quantity: z
    .string()
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
      "Quantity must be a positive number",
    ),
  taxComponents: z.array(priceComponentSchema).optional(),
  discountComponentKey: z.string().optional(),
  discountCode: z
    .object({
      code: z.string(),
      system: z.string(),
      display: z.string(),
    })
    .optional(),
  discountConditions: z.array(conditionSchema).optional(),
  discountType: z.enum(["amount", "percentage"]),
  discountValue: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, "Discount must be a positive number"),
});

const formSchema = z.object({
  items: z.array(
    z
      .object({
        id: z.string(),
        title: z.string(),
        status: z.nativeEnum(ChargeItemStatus),
        description: z
          .string()
          .optional()
          .nullable()
          .transform((val) => (val === "" ? null : val)),
        ...chargeItemBaseSchema.shape,
      })
      .refine(
        (data) => {
          const value = parseFloat(data.discountValue);
          if (isNaN(value)) return true;
          if (data.discountType === "percentage") {
            return value >= 0 && value <= 100;
          }
          return true;
        },
        {
          message: "Invalid Percentage",
          path: ["discountValue"],
        },
      )
      .refine(
        (data) => {
          const discountValue = parseFloat(data.discountValue);
          const baseAmount = parseFloat(data.baseAmount);

          if (isNaN(discountValue) || isNaN(baseAmount)) return true;
          if (data.discountType === "amount") {
            return discountValue <= baseAmount;
          }
          return true;
        },
        {
          message: "Discount amount cannot be greater than unit price",
          path: ["discountValue"],
        },
      ),
  ),
});

type FormValues = z.infer<typeof formSchema>;

export function EditInvoiceTable({
  facilityId,
  chargeItems,
  onClose,
  onSuccess,
  enableShortcut,
}: EditInvoiceTableProps) {
  const { t } = useTranslation();
  useShortcutSubContext("facility:billing:invoice:show");

  // Helper function to create a unique key for discount component
  const getDiscountComponentKey = (
    component: MonetaryComponent | undefined,
  ) => {
    if (!component?.code?.code) return undefined;
    return component.code.code;
  };

  // Helper function to get available discount components for a charge item
  const getAvailableDiscounts = (chargeItem: ChargeItemRead) => {
    return (
      chargeItem?.charge_item_definition?.price_components?.filter(
        (component) =>
          component.monetary_component_type === MonetaryComponentType.discount,
      ) || []
    );
  };

  const getTaxComponents = (chargeItem: ChargeItemRead) => {
    return (
      chargeItem?.charge_item_definition?.price_components?.filter(
        (component) =>
          component.monetary_component_type === MonetaryComponentType.tax,
      ) || []
    );
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: chargeItems.map((item) => {
        const baseComponent = item.unit_price_components.find(
          (c) => c.monetary_component_type === MonetaryComponentType.base,
        );
        const discountComponent = item.total_price_components.find(
          (c) => c.monetary_component_type === MonetaryComponentType.discount,
        );
        const taxComponents = getTaxComponents(item);

        const isPercentage = discountComponent?.factor !== undefined;
        const discountValue = isPercentage
          ? String(discountComponent?.factor || "0")
          : String(discountComponent?.amount || "0");

        return {
          id: item.id,
          title: item.title,
          status: item.status as ChargeItemStatus,
          description: item.description || "",
          baseAmount: String(baseComponent?.amount || "0"),
          quantity: String(item.quantity),
          taxComponents,
          discountComponentKey: getDiscountComponentKey(discountComponent),
          discountCode: discountComponent?.code,
          discountConditions: discountComponent?.conditions || [],
          discountType: isPercentage ? "percentage" : "amount",
          discountValue,
        };
      }),
    },
  });

  const { mutate: updateChargeItems, isPending } = useMutation({
    mutationFn: mutate(chargeItemApi.upsertChargeItem, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      toast.success("Invoice updated successfully");

      onSuccess();
      onClose();
    },
    onError: () => {
      toast.error("Failed to update invoice");
    },
  });

  const onSubmit = (data: FormValues) => {
    const updates: ChargeItemUpdate[] = data.items.map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status as ChargeItemStatus,
      quantity: item.quantity,
      unit_price_components: [
        {
          monetary_component_type: MonetaryComponentType.base,
          amount: item.baseAmount,
          conditions: [],
        },
        // Include tax components from form state
        ...(item.taxComponents || []),
        // Only include discount component if there's a non-zero value
        ...(parseFloat(item.discountValue) > 0
          ? [
              {
                monetary_component_type: MonetaryComponentType.discount,
                code: item.discountCode,
                amount:
                  item.discountType === "amount"
                    ? item.discountValue
                    : undefined,
                factor:
                  item.discountType === "percentage"
                    ? parseFloat(item.discountValue)
                    : undefined,
                conditions: item.discountConditions || [],
              },
            ]
          : []),
      ],
      description: item.description || undefined,
    }));

    updateChargeItems({ datapoints: updates });
  };

  const handleBaseAmountChange = (index: number, value: string) => {
    form.setValue(`items.${index}.baseAmount`, value);
  };

  const handleDiscountComponentChange = (
    index: number,
    componentKey: string,
  ) => {
    const chargeItem = chargeItems[index];
    if (!chargeItem) return;

    const availableDiscounts = getAvailableDiscounts(chargeItem);
    const selectedComponent = availableDiscounts.find(
      (c) => getDiscountComponentKey(c) === componentKey,
    );

    if (selectedComponent) {
      const isPercentage = selectedComponent.factor !== undefined;
      const value = isPercentage
        ? String(selectedComponent.factor || "0")
        : String(selectedComponent.amount || "0");

      form.setValue(`items.${index}.discountComponentKey`, componentKey);
      form.setValue(`items.${index}.discountCode`, selectedComponent.code);
      form.setValue(
        `items.${index}.discountConditions`,
        selectedComponent.conditions || [],
      );
      form.setValue(
        `items.${index}.discountType`,
        isPercentage ? "percentage" : "amount",
      );
      form.setValue(`items.${index}.discountValue`, value);
    }
  };

  const handleDiscountTypeToggle = (index: number, checked: boolean) => {
    const newType = checked ? "percentage" : "amount";
    form.setValue(`items.${index}.discountType`, newType);
    form.setValue(`items.${index}.discountValue`, "0");
  };

  // Get validation errors for a specific row
  const getRowErrors = (index: number): string[] => {
    const errors = form.formState.errors.items?.[index];
    if (!errors || typeof errors !== "object") return [];

    const errorMessages: string[] = [];
    Object.entries(errors).forEach(([field, error]) => {
      if (error && typeof error === "object" && "message" in error) {
        const fieldLabel =
          field === "baseAmount"
            ? t("unit_price")
            : field === "quantity"
              ? t("quantity")
              : field === "discountValue"
                ? t("discount")
                : field;
        errorMessages.push(`${fieldLabel}: ${error.message}`);
      }
    });
    return errorMessages;
  };

  // Check if there are any errors in any row
  const hasAnyErrors = form
    .watch("items")
    .some((_, index) => getRowErrors(index).length > 0);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="rounded-t-sm border border-gray-300 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200">
                <TableHead className="border-r border-gray-200 font-semibold text-center sticky left-0 bg-white w-12">
                  #
                </TableHead>
                <TableHead className="border-r border-gray-200 font-semibold text-center sticky left-8 bg-white min-w-[200px]">
                  {t("item")}
                </TableHead>
                <TableHead className="border-r border-gray-200 font-semibold text-center min-w-[150px]">
                  {t("unit_price")} ({getCurrencySymbol()})
                </TableHead>
                <TableHead className="border-r border-gray-200 font-semibold text-center min-w-[100px]">
                  {t("quantity")}
                </TableHead>
                <TableHead className="border-r border-gray-200 font-semibold text-center min-w-[300px]">
                  {t("discount")}
                </TableHead>
                {hasAnyErrors && (
                  <TableHead className="font-semibold text-center w-12" />
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {form.watch("items").map((item, index) => (
                <TableRow key={item.id} className="border-b border-gray-200">
                  <TableCell className="border-r border-gray-200 font-medium text-gray-950 text-sm text-center sticky left-0 bg-white w-12">
                    {index + 1}
                  </TableCell>
                  <TableCell className="border-r border-gray-200 font-medium text-gray-950 text-sm sticky left-8 bg-white min-w-[200px]">
                    {item.title}
                  </TableCell>
                  <TableCell className="border-r border-gray-200 font-medium text-gray-950 text-sm min-w-[150px]">
                    <FormField
                      control={form.control}
                      name={`items.${index}.baseAmount`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <MonetaryAmountInput
                              {...field}
                              value={field.value ?? "0"}
                              onChange={(e) => {
                                field.onChange(e.target.value);
                                handleBaseAmountChange(index, e.target.value);
                              }}
                              placeholder="0.00"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell className="border-r border-gray-200 font-medium text-gray-950 text-sm min-w-[100px]">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              min="0"
                              step="1"
                              className="text-right"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell className="border-r border-gray-200 font-medium text-gray-950 text-sm min-w-[300px]">
                    <div className="flex items-center gap-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.discountComponentKey`}
                        render={({ field }) => {
                          const chargeItem = chargeItems[index];
                          const availableDiscounts =
                            getAvailableDiscounts(chargeItem);

                          // Get the current discount component to show its name
                          const currentDiscount = availableDiscounts.find(
                            (c) => getDiscountComponentKey(c) === field.value,
                          );

                          return (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Select
                                  value={field.value || "none"}
                                  onValueChange={(value) => {
                                    if (value === "none") {
                                      form.setValue(
                                        `items.${index}.discountComponentKey`,
                                        undefined,
                                      );
                                      form.setValue(
                                        `items.${index}.discountCode`,
                                        undefined,
                                      );
                                      form.setValue(
                                        `items.${index}.discountConditions`,
                                        [],
                                      );
                                      form.setValue(
                                        `items.${index}.discountValue`,
                                        "0",
                                      );
                                    } else {
                                      handleDiscountComponentChange(
                                        index,
                                        value,
                                      );
                                    }
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue>
                                      {currentDiscount ? (
                                        <>
                                          {currentDiscount.code?.display} @{" "}
                                          {currentDiscount.factor ??
                                            currentDiscount.amount ??
                                            0}
                                          {currentDiscount.factor != null
                                            ? "%"
                                            : "₹"}
                                        </>
                                      ) : (
                                        <span className="text-gray-500">
                                          {t("select_discount")}
                                        </span>
                                      )}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">
                                      <span className="text-gray-500">
                                        {t("none")}
                                      </span>
                                    </SelectItem>
                                    {availableDiscounts.map((component) => {
                                      const key =
                                        getDiscountComponentKey(component);
                                      const value =
                                        component.factor ??
                                        component.amount ??
                                        0;
                                      const suffix =
                                        component.factor != null ? "%" : "₹";
                                      return (
                                        <SelectItem key={key} value={key || ""}>
                                          {component.code?.display} @ {value}
                                          {suffix}
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                            </FormItem>
                          );
                        }}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.discountValue`}
                        render={({ field }) => {
                          const discountKey = form.watch(
                            `items.${index}.discountComponentKey`,
                          );
                          const isDisabled =
                            !discountKey || discountKey === "none";

                          return (
                            <FormItem className="flex-1">
                              <FormControl>
                                <MonetaryAmountInput
                                  {...field}
                                  value={field.value ?? "0"}
                                  onChange={(e) =>
                                    field.onChange(e.target.value)
                                  }
                                  placeholder="0.00"
                                  disabled={isDisabled}
                                />
                              </FormControl>
                            </FormItem>
                          );
                        }}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.discountType`}
                        render={({ field }) => {
                          const discountKey = form.watch(
                            `items.${index}.discountComponentKey`,
                          );
                          const isDisabled =
                            !discountKey || discountKey === "none";

                          return (
                            <FormItem>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">
                                  {getCurrencySymbol()}
                                </span>
                                <FormControl>
                                  <Switch
                                    checked={field.value === "percentage"}
                                    onCheckedChange={(checked) => {
                                      handleDiscountTypeToggle(index, checked);
                                    }}
                                    disabled={isDisabled}
                                  />
                                </FormControl>
                                <span className="text-sm text-gray-500">%</span>
                              </div>
                            </FormItem>
                          );
                        }}
                      />
                    </div>
                  </TableCell>
                  {hasAnyErrors && (
                    <TableCell className="text-center w-12">
                      {getRowErrors(index).length > 0 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertCircle className="h-5 w-5 text-red-500 cursor-help mx-auto" />
                            </TooltipTrigger>
                            <TooltipContent
                              side="left"
                              className="max-w-xs bg-red-50 text-red-900 border border-red-200"
                            >
                              <div className="space-y-1">
                                {getRowErrors(index).map((error, idx) => (
                                  <div key={idx} className="text-xs">
                                    • {error}
                                  </div>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("cancel")}
            {enableShortcut && <ShortcutBadge actionId="cancel-action" />}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? t("saving") : t("save")}
            {enableShortcut && <ShortcutBadge actionId="submit-action" />}
          </Button>
        </div>
      </form>
    </Form>
  );
}
