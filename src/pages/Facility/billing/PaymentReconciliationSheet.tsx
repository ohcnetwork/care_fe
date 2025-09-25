import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { t } from "i18next";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { TooltipComponent } from "@/components/ui/tooltip";

import { useShortcutSubContext } from "@/context/ShortcutContext";
import { InvoiceRead } from "@/types/billing/invoice/invoice";
import {
  PaymentReconciliationCreate,
  PaymentReconciliationIssuerType,
  PaymentReconciliationKind,
  PaymentReconciliationOutcome,
  PaymentReconciliationPaymentMethod,
  PaymentReconciliationStatus,
  PaymentReconciliationType,
} from "@/types/billing/paymentReconciliation/paymentReconciliation";
import paymentReconciliationApi from "@/types/billing/paymentReconciliation/paymentReconciliationApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";

interface PaymentReconciliationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  invoice?: InvoiceRead;
  accountId: string;
  onSuccess?: () => void;
  isCreditNote?: boolean;
}

// Add schema before the component
const formSchema = z
  .object({
    reconciliation_type: z.nativeEnum(PaymentReconciliationType),
    status: z.nativeEnum(PaymentReconciliationStatus),
    kind: z.nativeEnum(PaymentReconciliationKind),
    issuer_type: z.nativeEnum(PaymentReconciliationIssuerType),
    outcome: z.nativeEnum(PaymentReconciliationOutcome),
    method: z.nativeEnum(PaymentReconciliationPaymentMethod),
    payment_datetime: z.string(),
    amount: z.string().refine(
      (val) => {
        const num = Number(val);
        return !isNaN(num) && num > 0 && /^\d+(\.\d{0,2})?$/.test(val);
      },
      { message: t("enter_valid_amount") },
    ),
    tendered_amount: z.string().refine(
      (val) => {
        const num = Number(val);
        return !isNaN(num) && num >= 0 && /^\d+(\.\d{0,2})?$/.test(val);
      },
      {
        message: t("enter_valid_amount"),
      },
    ),
    returned_amount: z.string().optional(),
    target_invoice: z.string().optional(),
    reference_number: z.string().optional(),
    authorization: z.string().optional(),
    disposition: z.string().optional(),
    note: z.string().optional(),
    account: z.string(),
    is_credit_note: z.boolean().optional(),
  })
  .refine((data) => Number(data.tendered_amount) >= Number(data.amount), {
    message: t("tender_amount_cannot_be_less_than_payment_amount"),
    path: ["tendered_amount"],
  });

export function PaymentReconciliationSheet({
  open,
  onOpenChange,
  facilityId,
  invoice,
  accountId,
  onSuccess,
  isCreditNote = false,
}: PaymentReconciliationSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [tenderAmount, setTenderAmount] = useState<string>("0");
  const [returnedAmount, setReturnedAmount] = useState<string>("0");
  useShortcutSubContext();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reconciliation_type: PaymentReconciliationType.payment,
      status: PaymentReconciliationStatus.active,
      kind: PaymentReconciliationKind.deposit,
      issuer_type: PaymentReconciliationIssuerType.patient,
      outcome: PaymentReconciliationOutcome.complete,
      method: PaymentReconciliationPaymentMethod.cash,
      payment_datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      amount: String(invoice?.total_gross || "0"),
      tendered_amount: "0",
      returned_amount: "0",
      target_invoice: invoice?.id,
      reference_number: "",
      authorization: "",
      disposition: "",
      note: "",
      account: accountId,
      is_credit_note: isCreditNote,
    },
  });

  // Watch for payment method changes
  const paymentMethod = form.watch("method");
  const isCashPayment =
    paymentMethod === PaymentReconciliationPaymentMethod.cash;

  // Watch for amount changes
  const amount = form.watch("amount");

  // Update form when invoice changes
  useEffect(() => {
    if (invoice) {
      form.setValue("target_invoice", invoice.id);
      form.setValue("amount", String(invoice.total_gross));
      setTenderAmount(String(invoice.total_gross));
    }
  }, [invoice, form]);

  // Calculate returned amount when tender amount, amount or payment method changes
  useEffect(() => {
    if (isCashPayment) {
      // For cash payments, calculate change to return
      const returned = String(
        Math.max(0, Number(tenderAmount) - (Number(amount) || 0)),
      );
      setReturnedAmount(returned);
      form.setValue("tendered_amount", tenderAmount);
      form.setValue("returned_amount", returned);
    } else {
      // For non-cash payments, tendered amount equals payment amount and returned is 0
      form.setValue("tendered_amount", amount || "0");
      form.setValue("returned_amount", "0");
      setReturnedAmount("0");
    }
  }, [tenderAmount, amount, isCashPayment, form]);

  const { mutate: submitPayment, isPending } = useMutation({
    mutationFn: mutate(paymentReconciliationApi.createPaymentReconciliation, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      toast.success(t("payment_recorded_successfully"));

      // Invalidate relevant queries
      if (invoice) {
        queryClient.invalidateQueries({ queryKey: ["invoice", invoice.id] });
        queryClient.invalidateQueries({
          queryKey: ["payments", invoice.id],
        });
      }
      if (accountId) {
        queryClient.invalidateQueries({ queryKey: ["account", accountId] });
        queryClient.invalidateQueries({
          queryKey: ["payments", accountId],
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: ["payments"],
        });
      }
      // Close sheet and call success callback
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    },
    onError: () => {
      toast.error(t("error_recording_payment"));
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    // Convert form data to PaymentReconciliationCreate type
    const submissionData: PaymentReconciliationCreate = {
      ...data,
      // Ensure amount strings are properly formatted
      amount: Number(data.amount).toFixed(2),
      tendered_amount: Number(data.tendered_amount).toFixed(2),
      returned_amount: Number(data.returned_amount).toFixed(2),
      is_credit_note: isCreditNote,
    };
    submitPayment(submissionData);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-md sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("record_payment")}</SheetTitle>
          <SheetDescription>
            {invoice
              ? t("recording_payment_for_invoice", {
                  id: invoice.number,
                })
              : t("recording_payment")}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">
                    {t("payment_details")}
                  </h3>
                </div>
                {invoice && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{t("total_amount")}</p>
                    <p className="text-lg font-semibold">
                      <MonetaryDisplay amount={String(invoice.total_gross)} />
                    </p>
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("payment_method")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger ref={field.ref}>
                          <SelectValue
                            placeholder={t("select_payment_method")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem
                          value={PaymentReconciliationPaymentMethod.cash}
                        >
                          {t("cash")}
                        </SelectItem>
                        <SelectItem
                          value={PaymentReconciliationPaymentMethod.ccca}
                        >
                          {t("credit_card")}
                        </SelectItem>
                        <SelectItem
                          value={PaymentReconciliationPaymentMethod.debc}
                        >
                          {t("debit_card")}
                        </SelectItem>
                        <SelectItem
                          value={PaymentReconciliationPaymentMethod.chck}
                        >
                          {t("check")}
                        </SelectItem>
                        <SelectItem
                          value={PaymentReconciliationPaymentMethod.ddpo}
                        >
                          {t("direct_deposit")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reconciliation_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("payment_type")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger ref={field.ref}>
                          <SelectValue
                            placeholder={t("select_reconciliation_type")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={PaymentReconciliationType.payment}>
                          {t("payment")}
                        </SelectItem>
                        <SelectItem
                          value={PaymentReconciliationType.adjustment}
                        >
                          {t("adjustment")}
                        </SelectItem>
                        <SelectItem value={PaymentReconciliationType.advance}>
                          {t("advance")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("payment_amount")}</FormLabel>
                    <FormControl>
                      <MonetaryAmountInput
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          if (isCreditNote) {
                            setTenderAmount(e.target.value);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isCashPayment && !isCreditNote && (
                <>
                  <FormField
                    control={form.control}
                    name="tendered_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("tender_amount")}
                          <TooltipComponent
                            content={t("tender_amount_tooltip")}
                          >
                            <CareIcon
                              icon="l-info-circle"
                              className="ml-1 size-4 text-gray-500"
                            />
                          </TooltipComponent>
                        </FormLabel>
                        <FormControl>
                          <MonetaryAmountInput
                            value={tenderAmount || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              setTenderAmount(value);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("amount_given_by_customer")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {Number(returnedAmount) > 0 && (
                    <div className="rounded-md bg-green-50 border border-green-200 p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-green-800">
                          {t("change_to_return")}
                        </span>
                        <MonetaryDisplay
                          className="font-semibold text-green-800"
                          amount={returnedAmount}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              <FormField
                control={form.control}
                name="payment_datetime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("payment_date")}</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        value={field.value ? field.value : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reference_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("reference_number")}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>
                      {!isCashPayment && t("reference_number_description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("notes")}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder={t("additional_payment_notes")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter>
              <Button
                type="submit"
                disabled={isPending}
                data-shortcut-id="submit-action"
              >
                {isPending ? (
                  <>
                    <CareIcon
                      icon="l-spinner"
                      className="mr-2 size-4 animate-spin"
                    />
                    {t("processing_with_dots")}
                  </>
                ) : (
                  t("record_payment")
                )}
                <ShortcutBadge actionId="submit-action" className="bg-white" />
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

export default PaymentReconciliationSheet;
