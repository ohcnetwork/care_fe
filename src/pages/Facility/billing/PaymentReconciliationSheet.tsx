import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { t } from "i18next";
import { useAtom } from "jotai";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import {
  Banknote,
  BanknoteArrowUp,
  CreditCard,
  Landmark,
  Signature,
} from "lucide-react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import careConfig from "@careConfig";

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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import { paymentReconcilationLocationAtom } from "@/atoms/paymentReconcilationLocationAtom";
import { LocationPicker } from "@/components/Location/LocationPicker";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useShortcutSubContext } from "@/context/ShortcutContext";
import {
  ExtensionEntityType,
  getCombinedExtensionProps,
  NamespacedExtensionData,
  useEntityExtensions,
  useExtensionSchemas,
} from "@/hooks/useExtensions";
import { AccountRead } from "@/types/billing/account/Account";
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
import {
  isGreaterThanOrEqual,
  isPositive,
  round,
  zodDecimal,
} from "@/Utils/decimal";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";
import Decimal from "decimal.js";

const PAYMENT_METHODS = [
  {
    value: PaymentReconciliationPaymentMethod.cash,
    icon: Banknote,
    label: "cash",
  },
  {
    value: PaymentReconciliationPaymentMethod.ddpo,
    icon: Landmark,
    label: "direct_deposit",
  },
  {
    value: PaymentReconciliationPaymentMethod.ccca,
    icon: CreditCard,
    label: "credit_card",
  },
  {
    value: PaymentReconciliationPaymentMethod.debc,
    icon: CreditCard,
    label: "debit_card",
  },
  {
    value: PaymentReconciliationPaymentMethod.chck,
    icon: Signature,
    label: "check",
  },
  {
    value: PaymentReconciliationPaymentMethod.cdac,
    icon: BanknoteArrowUp,
    label: "credit_account",
  },
] as const;

const PAYMENT_TYPES = [
  {
    value: PaymentReconciliationType.payment,
    label: "payment",
  },
  {
    value: PaymentReconciliationType.adjustment,
    label: "adjustment",
  },
  {
    value: PaymentReconciliationType.advance,
    label: "advance",
  },
] as const;

interface PaymentReconciliationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  invoice?: InvoiceRead;
  account?: AccountRead;
  accountId: string;
  onSuccess?: () => void;
  isCreditNote?: boolean;
}

const createBaseSchema = () =>
  z.object({
    reconciliation_type: z.nativeEnum(PaymentReconciliationType),
    status: z.nativeEnum(PaymentReconciliationStatus),
    kind: z.nativeEnum(PaymentReconciliationKind),
    issuer_type: z.nativeEnum(PaymentReconciliationIssuerType),
    outcome: z.nativeEnum(PaymentReconciliationOutcome),
    method: z.nativeEnum(PaymentReconciliationPaymentMethod),
    payment_datetime: z.string().refine((val) => new Date(val) <= new Date(), {
      message: t("payment_date_cannot_be_in_future"),
    }),
    amount: zodDecimal({ min: 0 }),
    tendered_amount: zodDecimal({ min: 0 }),
    returned_amount: zodDecimal({ min: 0 }).optional(),
    target_invoice: z.string().optional(),
    reference_number: z.string().optional(),
    authorization: z.string().optional(),
    disposition: z.string().optional(),
    note: z.string().optional(),
    account: z.string(),
    is_credit_note: z.boolean().optional(),
    location: careConfig.paymentLocationRequired
      ? z.string().min(1, t("field_required"))
      : z.string().optional(),
  });

const createFormSchema = (extValidation: z.ZodType<Record<string, unknown>>) =>
  createBaseSchema()
    .extend({
      extensions: extValidation.optional(),
    })
    .refine(
      (data) => {
        if (!data.tendered_amount || !data.amount) {
          return true;
        }
        return isGreaterThanOrEqual(data.tendered_amount, data.amount);
      },
      {
        message: t("tender_amount_cannot_be_less_than_payment_amount"),
        path: ["tendered_amount"],
      },
    );

export function PaymentReconciliationSheet({
  open,
  onOpenChange,
  facilityId,
  invoice,
  account,
  accountId,
  onSuccess,
  isCreditNote = false,
}: PaymentReconciliationSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedLocationObject, setSelectedLocationObject] = useAtom(
    paymentReconcilationLocationAtom(facilityId),
  );
  useShortcutSubContext();

  const { getExtensions, isLoading: isExtensionsLoading } =
    useExtensionSchemas();

  const ext = useMemo(
    () =>
      getCombinedExtensionProps(
        getExtensions(ExtensionEntityType.payment_reconciliation, "write"),
      ),
    [getExtensions],
  );

  const formSchema = useMemo(
    () => createFormSchema(ext.validation),
    [ext.validation],
  );

  type FormValues = z.infer<typeof formSchema>;
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const extensions = useEntityExtensions({
    entityType: ExtensionEntityType.payment_reconciliation,
    schemaType: "write",
    form,
  });

  // Watch for payment method changes
  const paymentMethod = form.watch("method");
  const isCashPayment =
    paymentMethod === PaymentReconciliationPaymentMethod.cash;

  // Watch for amount changes
  const amount = form.watch("amount");
  const tenderedAmount = form.watch("tendered_amount");

  // Calculate returned amount when tender amount, amount or payment method changes
  useEffect(() => {
    if (isCashPayment) {
      // For cash payments, calculate change to return
      form.setValue(
        "returned_amount",
        round(Decimal.max(0, tenderedAmount || "0").minus(amount || "0")),
      );
    } else {
      // For non-cash payments, tendered amount equals payment amount and returned is 0
      form.setValue("tendered_amount", amount || "0");
      form.setValue("returned_amount", "0");
    }
  }, [tenderedAmount, amount, isCashPayment, form]);

  // Update location when it changes
  useEffect(() => {
    if (selectedLocationObject?.id) {
      form.setValue("location", selectedLocationObject.id);
    }
  }, [selectedLocationObject, form]);

  const { mutate: submitPayment, isPending } = useMutation({
    mutationFn: mutate(paymentReconciliationApi.createPaymentReconciliation, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      toast.success(
        isCreditNote
          ? t("refund_recorded_successfully")
          : t("payment_recorded_successfully"),
      );

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
    const { extensions: formExtensions, ...restData } = data;
    const cleanedExtensions = extensions.prepareForSubmit(
      formExtensions as NamespacedExtensionData,
    );

    // Convert form data to PaymentReconciliationCreate type
    const submissionData: PaymentReconciliationCreate = {
      ...restData,
      is_credit_note: isCreditNote,
      location: restData.location,
      extensions: cleanedExtensions,
    };
    submitPayment(submissionData);
  });

  useEffect(() => {
    if (open) {
      const initialAmount = invoice?.total_gross
        ? round(new Decimal(invoice.total_gross).abs())
        : "";

      // Determine the default payment method
      const defaultMethod = careConfig.defaultPaymentMethod
        ? (careConfig.defaultPaymentMethod as PaymentReconciliationPaymentMethod)
        : undefined;

      form.reset({
        reconciliation_type: isCreditNote
          ? undefined
          : invoice
            ? PaymentReconciliationType.payment
            : PaymentReconciliationType.advance,
        status: PaymentReconciliationStatus.active,
        kind: PaymentReconciliationKind.deposit,
        issuer_type: PaymentReconciliationIssuerType.patient,
        outcome: PaymentReconciliationOutcome.complete,
        method: defaultMethod,
        payment_datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        amount: initialAmount,
        tendered_amount: initialAmount,
        returned_amount: "0",
        target_invoice: invoice?.id,
        reference_number: "",
        authorization: "",
        disposition: "",
        note: "",
        account: accountId,
        is_credit_note: isCreditNote,
        location: selectedLocationObject?.id,
        extensions: ext.defaults,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoice, accountId, isCreditNote, ext.defaults]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-md sm:max-w-lg overflow-y-auto pb-0">
        <SheetHeader>
          <SheetTitle className="m-0">
            {isCreditNote ? t("record_credit_note") : t("record_payment")}
          </SheetTitle>
          <SheetDescription className="text-gray-700">
            {invoice
              ? isCreditNote
                ? t("recording_refund_for_invoice", {
                    id: invoice.number,
                  })
                : t("recording_payment_for_invoice", {
                    id: invoice.number,
                  })
              : isCreditNote
                ? t("recording_refund")
                : t("recording_payment")}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="space-y-6">
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 space-y-3">
                {invoice && (
                  <div className="flex text-sm justify-center text-gray-700">
                    {t("invoice_total")}:
                    <p className="font-bold ml-1">
                      <MonetaryDisplay amount={invoice.total_gross} />
                    </p>
                  </div>
                )}

                <div className="bg-white p-3 text-center">
                  {invoice ? (
                    <>
                      <p className="text-sm text-gray-600 mb-1">
                        {isCreditNote ? t("refund_given") : t("amount_due")}
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        <MonetaryDisplay
                          amount={new Decimal(invoice.total_gross)
                            .minus(invoice.total_payments)
                            .toString()}
                        />
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 mb-1">
                        {t("balance_due")}
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        <MonetaryDisplay amount={account?.total_balance} />
                      </p>
                    </>
                  )}
                </div>

                <div
                  className="h-4 w-full bg-repeat-x -mt-4"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10.4' height='12' viewBox='2 3 10.4 9' xmlns='http://www.w3.org/2000/svg'%3E%3Cg filter='url(%23filter0_dd_31940_236060)'%3E%3Cpath d='M7.19629 12L12.3924 3H2.00014L7.19629 12Z' fill='white'/%3E%3C/g%3E%3Cdefs%3E%3Cfilter id='filter0_dd_31940_236060' x='-0.803711' y='-1' width='16' height='16' filterUnits='userSpaceOnUse' color-interpolation-filters='sRGB'%3E%3CfeFlood flood-opacity='0' result='BackgroundImageFix'/%3E%3CfeColorMatrix in='SourceAlpha' type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0' result='hardAlpha'/%3E%3CfeOffset dy='1'/%3E%3CfeGaussianBlur stdDeviation='1'/%3E%3CfeComposite in2='hardAlpha' operator='out'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0'/%3E%3CfeBlend mode='normal' in2='BackgroundImageFix' result='effect1_dropShadow_31940_236060'/%3E%3CfeColorMatrix in='SourceAlpha' type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0' result='hardAlpha'/%3E%3CfeOffset dy='1'/%3E%3CfeGaussianBlur stdDeviation='0.5'/%3E%3CfeComposite in2='hardAlpha' operator='out'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.06 0'/%3E%3CfeBlend mode='normal' in2='effect1_dropShadow_31940_236060' result='effect2_dropShadow_31940_236060'/%3E%3CfeBlend mode='normal' in='SourceGraphic' in2='effect2_dropShadow_31940_236060' result='shape'/%3E%3C/filter%3E%3C/defs%3E%3C/svg%3E")`,
                    backgroundSize: "10.4px 12px",
                    backgroundPosition: "center",
                  }}
                />
              </div>

              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-950">
                      {t("payment_method")}
                    </FormLabel>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-3 gap-3"
                    >
                      {PAYMENT_METHODS.map((method) => {
                        const Icon = method.icon;
                        return (
                          <Label
                            key={method.value}
                            className="relative flex cursor-pointer flex-col items-center rounded-md border border-gray-400 shadow-sm p-2.5 outline-none has-checked:border-primary-600 has-checked:bg-green-50"
                          >
                            <RadioGroupItem
                              value={method.value}
                              className="absolute left-2 top-2"
                              aria-label={`payment-method-${method.value}`}
                            />
                            <div className="grid grow justify-items-center gap-1">
                              <Icon className="size-5 text-gray-600" />
                              <span className="text-sm font-medium text-center text-gray-950">
                                {t(method.label)}
                              </span>
                            </div>
                          </Label>
                        );
                      })}
                    </RadioGroup>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reconciliation_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-950">
                      {t("payment_type")}
                    </FormLabel>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-wrap"
                    >
                      {PAYMENT_TYPES.map((type) => (
                        <Label
                          key={type.value}
                          className="flex cursor-pointer gap-2 items-center justify-center rounded-md border border-gray-400 shadow-sm p-2.5 outline-none has-checked:border-primary-600 has-checked:bg-primary-100/50"
                        >
                          <RadioGroupItem
                            value={type.value}
                            aria-label={`payment-type-${type.value}`}
                          />
                          <span className="text-sm font-medium text-gray-950">
                            {t(type.label)}
                          </span>
                        </Label>
                      ))}
                    </RadioGroup>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isCreditNote && (
                <FormField
                  control={form.control}
                  name="issuer_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-950">
                        {t("issuer_type")}
                      </FormLabel>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-wrap"
                      >
                        {Object.values(PaymentReconciliationIssuerType).map(
                          (type) => (
                            <Label
                              key={type}
                              className="flex cursor-pointer gap-2 items-center justify-center rounded-md border border-gray-400 shadow-sm p-2.5 outline-none has-checked:border-primary-600 has-checked:bg-primary-100/50"
                            >
                              <RadioGroupItem
                                value={type}
                                aria-label={`issuer-type-${type}`}
                              />
                              <span className="text-sm font-medium text-gray-950">
                                {t(type)}
                              </span>
                            </Label>
                          ),
                        )}
                      </RadioGroup>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-950">
                      {t("location")}
                    </FormLabel>
                    <FormControl>
                      <LocationPicker
                        facilityId={facilityId}
                        value={selectedLocationObject}
                        onValueChange={(location) => {
                          setSelectedLocationObject(location);
                          field.onChange(location?.id);
                        }}
                        placeholder={t("select_location")}
                        className="w-full border-gray-300"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="gap-1.5">
                    <FormLabel className="text-gray-950">
                      {isCreditNote ? t("refund_amount") : t("amount_paid")}
                    </FormLabel>
                    <FormControl>
                      <MonetaryAmountInput
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          if (isCreditNote) {
                            form.setValue("tendered_amount", e.target.value);
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription className="text-gray-700 italic -mt-1.5">
                      {t("amount_to_be_recorded")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isCashPayment && !isCreditNote && (
                <div>
                  <FormField
                    control={form.control}
                    name="tendered_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-950">
                          {t("amount_received")}
                        </FormLabel>
                        <FormControl>
                          <MonetaryAmountInput
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription className="text-gray-700 italic -mt-1.5">
                          {t("amount_given_by_customer")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {isPositive(form.watch("returned_amount") || "0") && (
                    <div className="rounded-md bg-yellow-50 border border-yellow-500 p-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-yellow-950">
                          {t("change_to_return")}:
                          <MonetaryDisplay
                            className="font-semibold text-yellow-950 ml-1"
                            amount={form.watch("returned_amount") || "0"}
                          />
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <FormField
                control={form.control}
                name="reference_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-950">
                      {t("reference_number")}
                      <span className="text-gray-600 italic">
                        ({t("optional")})
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription className="text-gray-700 italic -mt-1.5">
                      {!isCashPayment && t("reference_number_description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_datetime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-950">
                      {t("payment_date")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        value={field.value ? field.value : ""}
                        max={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-950">
                      {t("notes")}
                      <span className="text-gray-600 italic">
                        ({t("optional")})
                      </span>
                    </FormLabel>
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

              {extensions.fields}
            </div>

            <SheetFooter className="sticky bottom-0 bg-white p-4 border-t border-gray-200 -mx-6">
              <div className="flex justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  aria-label={t("cancel")}
                >
                  {t("cancel")}
                  <ShortcutBadge actionId="cancel-action" />
                </Button>

                <Button
                  type="submit"
                  disabled={isPending || isExtensionsLoading}
                  aria-label={
                    isCreditNote ? t("record_credit_note") : t("record_payment")
                  }
                >
                  {isPending ? (
                    <>
                      <CareIcon
                        icon="l-spinner"
                        className="mr-2 size-4 animate-spin"
                      />
                      {t("processing_with_dots")}
                    </>
                  ) : isCreditNote ? (
                    t("record_credit_note")
                  ) : (
                    t("record_payment")
                  )}
                  <ShortcutBadge actionId="submit-action" />
                </Button>
              </div>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

export default PaymentReconciliationSheet;
