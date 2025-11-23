import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  getCurrencySymbol,
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  getComponentsFromChargeItem,
  PriceComponentType,
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
  discounts: z.array(priceComponentSchema).optional(),
});

const formSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      status: z.nativeEnum(ChargeItemStatus),
      description: z
        .string()
        .optional()
        .nullable()
        .transform((val) => (val === "" ? null : val)),
      ...chargeItemBaseSchema.shape,
    }),
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

  const getDiscountComponentKey = (
    component: MonetaryComponent | undefined,
  ) => {
    if (!component?.code?.code) return undefined;
    return component.code.code;
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: chargeItems.map((item) => {
        const baseComponent = getComponentsFromChargeItem(
          item,
          MonetaryComponentType.base,
          PriceComponentType.unit_price,
        )[0];
        const discountComponents = getComponentsFromChargeItem(
          item,
          MonetaryComponentType.discount,
          PriceComponentType.unit_price,
        );
        const taxComponents = getComponentsFromChargeItem(
          item.charge_item_definition,
          MonetaryComponentType.tax,
        ).map((component) => ({
          ...component,
          amount: component.amount ? String(component.amount) : undefined,
        }));

        const discounts = discountComponents.map((component) => ({
          ...component,
          amount: component.amount ? String(component.amount) : undefined,
        }));

        return {
          id: item.id,
          title: item.title,
          status: item.status as ChargeItemStatus,
          description: item.description || "",
          baseAmount: String(baseComponent?.amount || "0"),
          quantity: String(item.quantity),
          taxComponents,
          discounts: discounts,
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
        ...(item.taxComponents || []),
        ...(item.discounts || []).filter((discount) => {
          const hasAmount = discount.amount && parseFloat(discount.amount) > 0;
          const hasFactor =
            discount.factor !== undefined && discount.factor > 0;
          return hasAmount || hasFactor;
        }),
      ],
      description: item.description || undefined,
    }));

    updateChargeItems({ datapoints: updates });
  };

  const handleBaseAmountChange = (index: number, value: string) => {
    form.setValue(`items.${index}.baseAmount`, value);
  };

  const handleAddDiscount = (itemIndex: number) => {
    const currentDiscounts =
      form.getValues(`items.${itemIndex}.discounts`) || [];
    form.setValue(`items.${itemIndex}.discounts`, [
      ...currentDiscounts,
      {
        monetary_component_type: MonetaryComponentType.discount,
        code: undefined,
        conditions: [],
        amount: undefined,
        factor: undefined,
      },
    ]);
  };

  const handleRemoveDiscount = (itemIndex: number, discountIndex: number) => {
    const currentDiscounts =
      form.getValues(`items.${itemIndex}.discounts`) || [];
    form.setValue(
      `items.${itemIndex}.discounts`,
      currentDiscounts.filter((_, idx) => idx !== discountIndex),
    );
  };

  const handleDiscountComponentChange = (
    itemIndex: number,
    discountIndex: number,
    componentKey: string,
  ) => {
    const chargeItem = chargeItems[itemIndex];
    if (!chargeItem) return;

    const availableDiscounts = getComponentsFromChargeItem(
      chargeItem.charge_item_definition,
      MonetaryComponentType.discount,
    );
    const selectedComponent = availableDiscounts.find(
      (c) => getDiscountComponentKey(c) === componentKey,
    );

    if (selectedComponent) {
      form.setValue(`items.${itemIndex}.discounts.${discountIndex}`, {
        ...selectedComponent,
        conditions:
          selectedComponent.conditions?.map((condition) => ({
            ...condition,
            _conditionType: `${condition.metric}_${condition.operation}`,
          })) || [],
      });
    }
  };

  const handleDiscountTypeToggle = (
    itemIndex: number,
    discountIndex: number,
    checked: boolean,
  ) => {
    if (checked) {
      // Switch to percentage
      form.setValue(`items.${itemIndex}.discounts.${discountIndex}.factor`, 0);
      form.setValue(
        `items.${itemIndex}.discounts.${discountIndex}.amount`,
        undefined,
      );
    } else {
      // Switch to amount
      form.setValue(
        `items.${itemIndex}.discounts.${discountIndex}.amount`,
        "0",
      );
      form.setValue(
        `items.${itemIndex}.discounts.${discountIndex}.factor`,
        undefined,
      );
    }
  };

  if (chargeItems.length === 0) {
    return <div>{t("no_charge_items_found")}</div>;
  }

  const onError = () => {
    toast.error(t("invalid_value"));
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onError)}
        className="space-y-4"
      >
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
                <TableHead className="border-r border-gray-200 font-semibold text-center min-w-[400px]">
                  {t("discounts")}
                </TableHead>
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
                  <TableCell className="border-r border-gray-200 font-medium text-gray-950 text-sm min-w-[400px]">
                    {(() => {
                      const chargeItem = chargeItems[index];
                      const availableDiscounts = getComponentsFromChargeItem(
                        chargeItem.charge_item_definition,
                        MonetaryComponentType.discount,
                      );

                      if (availableDiscounts.length === 0) {
                        return (
                          <div className="text-sm text-gray-500 py-2">
                            {t("no_discounts")}
                          </div>
                        );
                      }

                      const hasEmptyRow =
                        item.discounts?.some((d) => !d.code) || false;

                      const hasMoreDiscountsToAdd =
                        (item.discounts?.length || 0) <
                        availableDiscounts.length;

                      return (
                        <div className="space-y-2">
                          {item.discounts &&
                            item.discounts.length > 0 &&
                            item.discounts.map((discount, discountIndex) => (
                              <div
                                key={discountIndex}
                                className="flex items-center gap-2"
                              >
                                <FormField
                                  key={`${discountIndex}-code`}
                                  control={form.control}
                                  name={`items.${index}.discounts.${discountIndex}.code`}
                                  render={() => {
                                    const chargeItem = chargeItems[index];
                                    const availableDiscounts =
                                      getComponentsFromChargeItem(
                                        chargeItem.charge_item_definition,
                                        MonetaryComponentType.discount,
                                      );

                                    const selectedDiscountKeys =
                                      item.discounts
                                        ?.filter(
                                          (_, idx) => idx !== discountIndex,
                                        )
                                        .map((d) => getDiscountComponentKey(d))
                                        .filter((key) => key) || [];

                                    const filteredDiscounts =
                                      availableDiscounts.filter((component) => {
                                        const key =
                                          getDiscountComponentKey(component);
                                        return (
                                          key &&
                                          !selectedDiscountKeys.includes(key)
                                        );
                                      });

                                    const currentKey =
                                      getDiscountComponentKey(discount);
                                    const currentDiscount =
                                      availableDiscounts.find(
                                        (c) =>
                                          getDiscountComponentKey(c) ===
                                          currentKey,
                                      );

                                    return (
                                      <FormItem className="flex-1">
                                        <FormControl>
                                          <Select
                                            value={currentKey || ""}
                                            onValueChange={(value) => {
                                              handleDiscountComponentChange(
                                                index,
                                                discountIndex,
                                                value,
                                              );
                                            }}
                                          >
                                            <SelectTrigger>
                                              <SelectValue
                                                placeholder={t(
                                                  "select_discount",
                                                )}
                                              >
                                                {currentDiscount && (
                                                  <>
                                                    {
                                                      currentDiscount.code
                                                        ?.display
                                                    }{" "}
                                                    @
                                                    <MonetaryDisplay
                                                      {...currentDiscount}
                                                    />
                                                  </>
                                                )}
                                              </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                              {filteredDiscounts.map(
                                                (component) => {
                                                  const key =
                                                    getDiscountComponentKey(
                                                      component,
                                                    );
                                                  return (
                                                    <SelectItem
                                                      key={key}
                                                      value={key || ""}
                                                    >
                                                      {component.code?.display}{" "}
                                                      @
                                                      <MonetaryDisplay
                                                        {...component}
                                                      />
                                                    </SelectItem>
                                                  );
                                                },
                                              )}
                                            </SelectContent>
                                          </Select>
                                        </FormControl>
                                      </FormItem>
                                    );
                                  }}
                                />
                                <FormField
                                  key={`${discountIndex}-amount`}
                                  control={form.control}
                                  name={`items.${index}.discounts.${discountIndex}`}
                                  render={() => {
                                    const isDisabled = !discount?.code;
                                    const isPercentage =
                                      discount?.factor !== undefined;
                                    const value = isPercentage
                                      ? String(discount?.factor ?? "0")
                                      : String(discount?.amount ?? "0");

                                    return (
                                      <FormItem className="flex-1">
                                        <FormControl>
                                          <MonetaryAmountInput
                                            hideCurrency={true}
                                            value={value}
                                            onChange={(e) => {
                                              const newValue = e.target.value;
                                              if (isPercentage) {
                                                form.setValue(
                                                  `items.${index}.discounts.${discountIndex}.factor`,
                                                  parseFloat(newValue) || 0,
                                                );
                                              } else {
                                                form.setValue(
                                                  `items.${index}.discounts.${discountIndex}.amount`,
                                                  newValue,
                                                );
                                              }
                                            }}
                                            placeholder="0.00"
                                            disabled={isDisabled}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    );
                                  }}
                                />
                                <FormField
                                  key={`${discountIndex}-type`}
                                  control={form.control}
                                  name={`items.${index}.discounts.${discountIndex}`}
                                  render={() => {
                                    const isDisabled = !discount?.code;
                                    const isPercentage =
                                      discount?.factor !== undefined;

                                    return (
                                      <FormItem>
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm text-gray-500">
                                            {getCurrencySymbol()}
                                          </span>
                                          <FormControl>
                                            <Switch
                                              checked={isPercentage}
                                              onCheckedChange={(checked) => {
                                                handleDiscountTypeToggle(
                                                  index,
                                                  discountIndex,
                                                  checked,
                                                );
                                              }}
                                              disabled={isDisabled}
                                              className="data-[state=unchecked]:bg-gray-900"
                                            />
                                          </FormControl>
                                          <span className="text-sm text-gray-500">
                                            %
                                          </span>
                                        </div>
                                      </FormItem>
                                    );
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 shrink-0"
                                  onClick={() =>
                                    handleRemoveDiscount(index, discountIndex)
                                  }
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          {hasMoreDiscountsToAdd && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => handleAddDiscount(index)}
                              disabled={hasEmptyRow}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              {t("add_discount")}
                            </Button>
                          )}
                        </div>
                      );
                    })()}
                  </TableCell>
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
