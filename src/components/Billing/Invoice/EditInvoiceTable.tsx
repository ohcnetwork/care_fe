import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  MonetaryAmountInput,
  getCurrencySymbol,
} from "@/components/ui/monetary-display";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useFacilityShortcuts } from "@/hooks/useFacilityShortcuts";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
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

const chargeItemSchema = z.object({
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
  discountType: z.enum(["amount", "percentage"]),
  discountValue: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, "Discount must be a positive number"),
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
      ...chargeItemSchema.shape,
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
  useFacilityShortcuts("edit-invoiceTable");
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: chargeItems.map((item) => {
        const baseComponent = item.unit_price_components.find(
          (c) => c.monetary_component_type === MonetaryComponentType.base,
        );
        const discountComponent = item.unit_price_components.find(
          (c) => c.monetary_component_type === MonetaryComponentType.discount,
        );

        // If discount has factor, it's a percentage discount
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
        // Only include discount component if there's a non-zero value
        ...(parseFloat(item.discountValue) > 0
          ? [
              {
                monetary_component_type: MonetaryComponentType.discount,
                amount:
                  item.discountType === "amount"
                    ? item.discountValue
                    : undefined,
                factor:
                  item.discountType === "percentage"
                    ? parseFloat(item.discountValue)
                    : undefined,
                // TODO: This is definitely not correct, we need to pass on the conditions, also verify #146
                conditions: [],
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

  const handleDiscountTypeToggle = (index: number, checked: boolean) => {
    const newType = checked ? "percentage" : "amount";
    form.setValue(`items.${index}.discountType`, newType);
    form.setValue(`items.${index}.discountValue`, "0");
  };

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
                <TableHead className="border-r border-gray-200 font-semibold text-center min-w-[200px]">
                  {t("discount")}
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
                          <FormMessage />
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell className="border-r border-gray-200 font-medium text-gray-950 text-sm min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.discountValue`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <MonetaryAmountInput
                                {...field}
                                value={field.value ?? "0"}
                                onChange={(e) => field.onChange(e.target.value)}
                                placeholder="0.00"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.discountType`}
                        render={({ field }) => (
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
                                />
                              </FormControl>
                              <span className="text-sm text-gray-500">%</span>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            data-shortcut-id={enableShortcut ? "cancel-action" : undefined}
          >
            {t("cancel")}
            {enableShortcut && <ShortcutBadge actionId="cancel-action" />}
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            data-shortcut-id={enableShortcut ? "submit-action" : undefined}
          >
            {isPending ? t("saving") : t("save")}
            {enableShortcut && (
              <ShortcutBadge actionId="submit-action" className="bg-white" />
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
