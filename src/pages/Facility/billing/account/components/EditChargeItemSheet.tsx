import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PencilIcon } from "lucide-react";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import mutate from "@/Utils/request/mutate";
import { summarizeMonetaryComponents } from "@/pages/Facility/settings/chargeItemDefinitions/utils";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import {
  ChargeItemRead,
  ChargeItemStatus,
  ChargeItemUpdate,
} from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";

const formSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  status: z.nativeEnum(ChargeItemStatus),
  quantity: z.coerce
    .number()
    .min(1, { message: "Quantity must be at least 1" }),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditChargeItemSheetProps {
  facilityId: string;
  item: ChargeItemRead;
  trigger?: React.ReactNode;
}

export function EditChargeItemSheet({
  facilityId,
  item,
  trigger,
}: EditChargeItemSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: item.title,
      description: item.description || undefined,
      status: item.status,
      quantity: item.quantity,
      note: item.note || undefined,
    },
  });

  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  // Filter price components by type
  const getComponentsByType = (type: MonetaryComponentType) => {
    return (
      item.unit_price_components?.filter(
        (c) => c.monetary_component_type === type,
      ) || []
    );
  };

  const baseComponent = getComponentsByType(MonetaryComponentType.base)[0];
  const discounts = getComponentsByType(MonetaryComponentType.discount);
  const taxes = getComponentsByType(MonetaryComponentType.tax);

  const { totalAmount, netAmount, taxableAmount } = summarizeMonetaryComponents(
    item.unit_price_components,
  );

  const currentTotal =
    item.total_price !== null && item.total_price !== undefined
      ? item.total_price
      : totalAmount;

  const { mutate: updateChargeItem, isPending } = useMutation({
    mutationFn: (data: FormValues) => {
      const updateData: ChargeItemUpdate = {
        ...data,
        id: item.id,
        unit_price_components: item.unit_price_components,
        override_reason: item.override_reason,
      };
      return mutate(chargeItemApi.updateChargeItem, {
        pathParams: { facilityId, chargeItemId: item.id },
      })(updateData);
    },
    onSuccess: () => {
      toast.success(t("charge_item_updated"));
      queryClient.invalidateQueries({ queryKey: ["chargeItems"] });
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || t("error_updating_charge_item"));
    },
  });

  function onSubmit(data: FormValues) {
    updateChargeItem(data);
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <PencilIcon className="h-4 w-4" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="sm:max-w-md md:max-w-lg">
        <SheetHeader>
          <SheetTitle>{t("edit_charge_item")}</SheetTitle>
          <SheetDescription>
            {t("edit_charge_item_description")}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-4rem)] scroll-y-auto py-2 px-4 border rounded-md mt-2">
          <div className="space-y-6 py-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("title")}</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                            disabled
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
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
                              {Object.values(ChargeItemStatus).map((status) => (
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
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("quantity")}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              {...field}
                              disabled={
                                item.status !== ChargeItemStatus.planned
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator className="my-4" />

                  <div>
                    <h3 className="text-sm font-medium mb-3">
                      {t("pricing_details")}
                    </h3>

                    <div className="rounded-md border bg-card">
                      <div className="p-4 text-sm">
                        <h4 className="font-medium mb-2">
                          {t("unit_price_components")}
                        </h4>

                        <div className="space-y-2">
                          {baseComponent && (
                            <div className="flex justify-between">
                              <span className="font-medium">
                                {t("base_price")}
                              </span>

                              <MonetaryDisplay amount={baseComponent.amount} />
                            </div>
                          )}

                          {discounts.map((discount, index) => (
                            <div
                              key={`discount-${index}`}
                              className="flex justify-between"
                            >
                              <div className="space-x-1">
                                <span>
                                  {discount.code && discount.code.display}
                                </span>
                                <span className="text-red-600">
                                  ({t("discount")})
                                </span>
                              </div>
                              <span className="text-red-600">
                                - <MonetaryDisplay {...discount} />
                              </span>
                            </div>
                          ))}

                          {taxes.map((tax, index) => (
                            <div
                              key={`tax-${index}`}
                              className="flex justify-between"
                            >
                              <div className="space-x-1">
                                <span>{tax.code && tax.code.display}</span>
                                <span className="text-green-600">
                                  ({t("tax")})
                                </span>
                              </div>
                              <span className="text-green-600">
                                + <MonetaryDisplay {...tax} />
                              </span>
                            </div>
                          ))}

                          <Separator className="my-2" />

                          <div className="flex justify-between font-semibold">
                            <span>{t("unit_total")}</span>
                            <span className="text-green-600">
                              <MonetaryDisplay amount={totalAmount} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {item.quantity > 1 && (
                      <div className="rounded-md border bg-card mt-4">
                        <div className="p-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="font-medium">
                                {t("quantity")}
                              </span>
                              <span>{item.quantity}</span>
                            </div>

                            <Separator className="my-2" />

                            <div className="flex flex-col justify-between gap-2">
                              <div className="flex justify-between">
                                <span>{t("total_base_price")}</span>
                                <span>
                                  <MonetaryDisplay
                                    amount={
                                      item.quantity *
                                      (baseComponent?.amount || 0)
                                    }
                                  />
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>{t("total_discounts")}</span>
                                <span className="text-red-600">
                                  <MonetaryDisplay
                                    amount={
                                      item.quantity *
                                      (netAmount - taxableAmount)
                                    }
                                  />
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>{t("total_taxes")}</span>
                                <span className="text-green-600">
                                  <MonetaryDisplay
                                    amount={
                                      item.quantity *
                                      (totalAmount - taxableAmount)
                                    }
                                  />
                                </span>
                              </div>
                              <div className="flex justify-between font-semibold">
                                <span>{t("total_price")}</span>
                                <span className="text-green-600">
                                  <MonetaryDisplay amount={currentTotal} />
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />

                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("note")}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            disabled
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <SheetFooter className="pt-2">
                  <SheetClose asChild>
                    <Button variant="outline" type="button">
                      {t("cancel")}
                    </Button>
                  </SheetClose>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? t("saving") : t("save")}
                  </Button>
                </SheetFooter>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export default EditChargeItemSheet;
