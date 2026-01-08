import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

import { SessionData } from "@/types/billing/cash/cashSession";
import cashSessionApi from "@/types/billing/cash/cashSessionApi";
import mutate from "@/Utils/request/mutate";

import DenominationInput from "./DenominationInput";

const formSchema = z.object({
  declared_amount: z.coerce
    .number()
    .min(0, "Declared amount must be 0 or more"),
  use_denominations: z.boolean(),
  denominations: z.record(z.string(), z.number()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CloseSessionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  session: SessionData;
  onSessionClosed: () => void;
}

export default function CloseSessionSheet({
  open,
  onOpenChange,
  facilityId,
  session,
  onSessionClosed,
}: CloseSessionSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [denominations, setDenominations] = useState<Record<string, number>>(
    {},
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      declared_amount: session.expected_amount,
      use_denominations: false,
      denominations: {},
    },
  });

  const useDenominations = form.watch("use_denominations");
  const declaredAmount = form.watch("declared_amount");
  const difference = declaredAmount - session.expected_amount;

  const { mutate: closeSession, isPending } = useMutation({
    mutationFn: mutate(cashSessionApi.closeSession, {
      pathParams: { facilityId: facilityId },
    }),
    onSuccess: () => {
      toast.success(t("session_closed_successfully"));
      queryClient.invalidateQueries({
        queryKey: ["cash-counters", facilityId],
      });
      queryClient.invalidateQueries({ queryKey: ["cash-session-current"] });
      queryClient.invalidateQueries({ queryKey: ["cash-sessions"] });
      form.reset();
      setDenominations({});
      onSessionClosed();
    },
    onError: () => {
      toast.error(t("failed_to_close_session"));
    },
  });

  const onSubmit = (values: FormValues) => {
    closeSession({
      counter_x_care_id: session.counter_x_care_id,
      declared_amount: values.declared_amount,
      denominations: values.use_denominations ? denominations : undefined,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate denomination total
  //   const denominationTotal = Object.entries(denominations).reduce(
  //     (sum, [denom, count]) => sum + parseInt(denom) * count,
  //     0,
  //   );

  // Update declared amount when denominations change
  const handleDenominationChange = (
    newDenominations: Record<string, number>,
  ) => {
    setDenominations(newDenominations);
    if (useDenominations) {
      const total = Object.entries(newDenominations).reduce(
        (sum, [denom, count]) => sum + parseInt(denom) * count,
        0,
      );
      form.setValue("declared_amount", total);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("close_session")}</SheetTitle>
          <SheetDescription>
            {t("close_session_description", { counter: session.counter_name })}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 py-6"
          >
            {/* Expected Amount Info */}
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">{t("expected_amount")}</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(session.expected_amount)}
              </p>
            </div>

            {/* Use Denominations Toggle */}
            <FormField
              control={form.control}
              name="use_denominations"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel className="text-base">
                      {t("enter_denominations")}
                    </FormLabel>
                    <p className="text-sm text-gray-500">
                      {t("enter_denominations_description")}
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Denomination Input */}
            {useDenominations && (
              <DenominationInput
                value={denominations}
                onChange={handleDenominationChange}
              />
            )}

            {/* Declared Amount (manual entry when not using denominations) */}
            {!useDenominations && (
              <FormField
                control={form.control}
                name="declared_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("declared_amount")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          {t("currency_symbol")}
                        </span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...field}
                          className="pl-8"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Difference Alert */}
            {difference !== 0 && (
              <Alert variant={difference > 0 ? "default" : "destructive"}>
                <CareIcon
                  icon={difference > 0 ? "l-arrow-up" : "l-arrow-down"}
                  className="size-4"
                />
                <AlertTitle>
                  {difference > 0 ? t("cash_surplus") : t("cash_shortage")}
                </AlertTitle>
                <AlertDescription>
                  {t("difference_amount", {
                    amount: formatCurrency(Math.abs(difference)),
                  })}
                </AlertDescription>
              </Alert>
            )}

            {/* Summary */}
            <div className="space-y-2 rounded-lg border p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("expected_amount")}</span>
                <span className="font-medium">
                  {formatCurrency(session.expected_amount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("declared_amount")}</span>
                <span className="font-medium">
                  {formatCurrency(declaredAmount)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">{t("difference")}</span>
                <span
                  className={`font-bold ${
                    difference > 0
                      ? "text-green-600"
                      : difference < 0
                        ? "text-red-600"
                        : "text-gray-900"
                  }`}
                >
                  {difference > 0 ? "+" : ""}
                  {formatCurrency(difference)}
                </span>
              </div>
            </div>

            <SheetFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? (
                  <>
                    <CareIcon
                      icon="l-spinner"
                      className="mr-2 size-4 animate-spin"
                    />
                    {t("closing")}
                  </>
                ) : (
                  t("close_session")
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
