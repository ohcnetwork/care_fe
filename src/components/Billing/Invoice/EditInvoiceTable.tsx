import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ChevronDown, Plus, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import UserSelector from "@/components/Common/UserSelector";

import { useShortcutSubContext } from "@/context/ShortcutContext";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import {
  conditionSchema,
  getConditionDiscriminatorValue,
} from "@/types/base/condition/condition";
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
import { UserReadMinimal } from "@/types/user/user";
import { isPositive, round, zodDecimal } from "@/Utils/decimal";
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
  factor: zodDecimal({ min: 0, max: 100 }).optional().nullable(),
  amount: zodDecimal({ min: 0 }).optional().nullable(),
  conditions: z.array(conditionSchema).optional(),
});

const chargeItemBaseSchema = z.object({
  baseAmount: zodDecimal({ min: 0 }),
  quantity: zodDecimal({ min: 1 }),
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
  const { facility } = useCurrentFacility();
  useShortcutSubContext("facility:billing:invoice:show");

  const [performers, setPerformers] = useState<
    Record<string, UserReadMinimal | undefined>
  >(() => {
    const initial: Record<string, UserReadMinimal | undefined> = {};
    chargeItems.forEach((item) => {
      initial[item.id] = item.performer_actor;
    });
    return initial;
  });

  const handlePerformerChange = (
    chargeItemId: string,
    user: UserReadMinimal | undefined,
  ) => {
    setPerformers((prev) => ({
      ...prev,
      [chargeItemId]: user,
    }));
  };

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
        );

        const discounts = discountComponents.map((component) => ({
          ...component,
          factor: component.factor ? round(component.factor) : component.factor,
          amount: component.amount ? round(component.amount) : component.amount,
          conditions: component.conditions?.map((condition) => ({
            ...condition,
            _conditionType: getConditionDiscriminatorValue(
              condition.metric,
              condition.operation,
            ),
          })),
        }));

        return {
          id: item.id,
          title: item.title,
          status: item.status as ChargeItemStatus,
          description: item.description || "",
          baseAmount: round(baseComponent?.amount || "0"),
          quantity: round(item.quantity),
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
      toast.success(t("invoice_updated_successfully"));

      onSuccess();
      onClose();
    },
    onError: () => {
      toast.error(t("failed_to_update_invoice"));
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
            discount.factor != null && isPositive(discount.factor);
          return hasAmount || hasFactor;
        }),
      ],
      description: item.description || undefined,
      performer_actor: performers[item.id]?.id,
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

  // Get discounts from facility settings
  const globalDiscounts = [
    ...(facility?.discount_monetary_components || []),
    ...(facility?.instance_discount_monetary_components || []),
  ].filter((d) => d != null);

  const handleDiscountComponentChange = (
    itemIndex: number,
    discountIndex: number,
    componentKey: string,
  ) => {
    const selectedComponent = globalDiscounts.find(
      (c) => getDiscountComponentKey(c) === componentKey,
    );

    if (selectedComponent) {
      form.setValue(`items.${itemIndex}.discounts.${discountIndex}`, {
        ...selectedComponent,
        conditions:
          selectedComponent.conditions?.map((condition) => ({
            ...condition,
            _conditionType: getConditionDiscriminatorValue(
              condition.metric,
              condition.operation,
            ),
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
      form.setValue(
        `items.${itemIndex}.discounts.${discountIndex}.factor`,
        "0",
      );
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

  const handleApplyGlobalDiscount = (discountKey: string) => {
    const items = form.getValues("items");

    // Find the discount definition from the global discounts
    const discountDefinition = globalDiscounts.find(
      (d) => getDiscountComponentKey(d) === discountKey,
    );

    if (!discountDefinition) return;

    items.forEach((item, itemIndex) => {
      const currentDiscounts = item.discounts || [];
      // Check if this discount is already applied
      const existingIndex = currentDiscounts.findIndex(
        (d) => getDiscountComponentKey(d) === discountKey,
      );

      if (existingIndex === -1) {
        // Add the discount if not already present
        const newDiscount = {
          ...discountDefinition,
          conditions:
            discountDefinition.conditions?.map((condition) => ({
              ...condition,
              _conditionType: getConditionDiscriminatorValue(
                condition.metric,
                condition.operation,
              ),
            })) || [],
        };
        form.setValue(`items.${itemIndex}.discounts`, [
          ...currentDiscounts,
          newDiscount,
        ]);
      }
    });
  };

  const handleClearAllDiscounts = () => {
    const items = form.getValues("items");
    items.forEach((_, itemIndex) => {
      form.setValue(`items.${itemIndex}.discounts`, []);
    });
  };

  if (chargeItems.length === 0) {
    return <div>{t("no_charge_items_found")}</div>;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, () =>
          toast.error(t("invalid_value")),
        )}
        className="space-y-4"
      >
        <div>
          <Table className="border">
            <TableHeader>
              <TableRow className="divide-x font-semibold">
                <TableHead className="w-12">#</TableHead>
                <TableHead>{t("item")}</TableHead>
                <TableHead>{t("performer")}</TableHead>
                <TableHead className="min-w-[150px]">
                  {t("unit_price")} ({getCurrencySymbol()})
                </TableHead>
                <TableHead className="min-w-[100px]">{t("quantity")}</TableHead>
                <TableHead>
                  <div className="flex items-center justify-center gap-2">
                    {t("discounts")}
                    {globalDiscounts.length > 0 && chargeItems.length > 1 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                          >
                            {t("apply_to_all")}
                            <ChevronDown className="h-3 w-3 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {globalDiscounts.map((discount) => {
                            const key = getDiscountComponentKey(discount);
                            return (
                              <DropdownMenuItem
                                key={key}
                                onClick={() =>
                                  key && handleApplyGlobalDiscount(key)
                                }
                              >
                                {discount.code?.display} @{" "}
                                <MonetaryDisplay {...discount} />
                              </DropdownMenuItem>
                            );
                          })}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={handleClearAllDiscounts}
                            className="text-destructive"
                          >
                            {t("clear_all")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {form.watch("items").map((item, index) => (
                <TableRow
                  key={item.id}
                  className="divide-x font-medium text-gray-950"
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>
                    <UserSelector
                      selected={performers[item.id]}
                      onChange={(user) => handlePerformerChange(item.id, user)}
                      facilityId={facilityId}
                      placeholder={t("select_performer")}
                    />
                  </TableCell>
                  <TableCell>
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
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="number" {...field} min="1" step="1" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell className="border-r border-gray-200 font-medium text-gray-950 text-sm ">
                    {(() => {
                      const hasAppliedDiscounts =
                        item.discounts && item.discounts.length > 0;

                      // Show "no discounts" only if no global discounts available AND no discounts applied
                      if (
                        globalDiscounts.length === 0 &&
                        !hasAppliedDiscounts
                      ) {
                        return (
                          <div className="text-sm text-gray-500 py-2">
                            {t("no_discounts")}
                          </div>
                        );
                      }

                      const hasEmptyRow =
                        item.discounts?.some((d) => !d.code) || false;

                      const hasMoreDiscountsToAdd =
                        (item.discounts?.length || 0) < globalDiscounts.length;

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
                                    const selectedDiscountKeys =
                                      item.discounts
                                        ?.filter(
                                          (_, idx) => idx !== discountIndex,
                                        )
                                        .map((d) => getDiscountComponentKey(d))
                                        .filter((key) => key) || [];

                                    const filteredDiscounts =
                                      globalDiscounts.filter((component) => {
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
                                      globalDiscounts.find(
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
                                      ? (discount?.factor ?? "0")
                                      : (discount?.amount ?? "0");

                                    return (
                                      <FormItem className="flex-1 min-w-20">
                                        <FormControl>
                                          <MonetaryAmountInput
                                            hideCurrency={true}
                                            value={value}
                                            onChange={(e) => {
                                              const newValue = e.target.value;
                                              if (isPercentage) {
                                                form.setValue(
                                                  `items.${index}.discounts.${discountIndex}.factor`,
                                                  newValue,
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

        <div className="sticky bottom-0 bg-white p-4 flex justify-end gap-2 border-t">
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
