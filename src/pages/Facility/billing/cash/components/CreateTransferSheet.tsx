import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

import useAuthUser from "@/hooks/useAuthUser";

import { CounterData, SessionData } from "@/types/billing/cash/cashSession";
import cashSessionApi from "@/types/billing/cash/cashSessionApi";
import cashTransferApi from "@/types/billing/cash/cashTransferApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

import DenominationInput from "./DenominationInput";

const formSchema = z.object({
  to_session_id: z.number().positive("Please select a destination"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  use_denominations: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateTransferSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  session: SessionData;
}

export default function CreateTransferSheet({
  open,
  onOpenChange,
  facilityId,
  session,
}: CreateTransferSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const [denominations, setDenominations] = useState<Record<string, number>>(
    {},
  );

  // Get all counters to find other open sessions
  const { data: countersResponse } = useQuery({
    queryKey: ["cash-counters", facilityId],
    queryFn: query(cashSessionApi.listCounters, {
      pathParams: { facilityId: facilityId },
    }),
    enabled: open,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      to_session_id: 0,
      amount: 0,
      use_denominations: false,
    },
  });

  const useDenominations = form.watch("use_denominations");
  const amount = form.watch("amount");
  const selectedSessionId = form.watch("to_session_id");

  // Find the selected counter to check if it's main cash
  const selectedCounter = countersResponse?.counters?.find((c) =>
    c.open_sessions.some((s) => s.session_id === selectedSessionId),
  );
  const isMainCashTransfer = selectedCounter?.is_main_cash ?? false;

  const { mutate: createTransfer, isPending } = useMutation({
    mutationFn: mutate(cashTransferApi.createTransfer, {
      pathParams: { facilityId: facilityId },
    }),
    onSuccess: () => {
      toast.success(t("transfer_created_successfully"));
      queryClient.invalidateQueries({ queryKey: ["cash-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["cash-session-current"] });
      queryClient.invalidateQueries({ queryKey: ["cash-transfers-pending"] });
      queryClient.invalidateQueries({ queryKey: ["cash-transfers-sent"] });
      form.reset();
      setDenominations({});
      onOpenChange(false);
    },
    onError: () => {
      toast.error(t("failed_to_create_transfer"));
    },
  });

  const onSubmit = (values: FormValues) => {
    const selectedTarget = countersResponse?.counters
      ?.flatMap((c) => c.open_sessions)
      .find((s) => s.session_id === values.to_session_id);

    if (!selectedTarget) {
      toast.error(t("invalid_destination"));
      return;
    }

    createTransfer({
      from_counter_x_care_id: session.counter_x_care_id,
      to_session_id: String(values.to_session_id),
      amount: values.amount,
      denominations:
        values.use_denominations || isMainCashTransfer
          ? denominations
          : undefined,
    });
  };

  // Get counters with open sessions (excluding current user's sessions)
  const availableDestinations =
    countersResponse?.counters
      ?.map((c) => ({
        ...c,
        open_sessions: c.open_sessions.filter(
          (s) => s.external_user_id !== user.id && s.session_id !== session.id,
        ),
      }))
      .filter((c) => c.open_sessions.length > 0) ?? [];

  // Handle denomination change
  const handleDenominationChange = (
    newDenominations: Record<string, number>,
  ) => {
    setDenominations(newDenominations);
    if (useDenominations || isMainCashTransfer) {
      const total = Object.entries(newDenominations).reduce(
        (sum, [denom, count]) => sum + parseInt(denom) * count,
        0,
      );
      form.setValue("amount", total, { shouldValidate: true });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("transfer_cash")}</SheetTitle>
          <SheetDescription>{t("transfer_cash_description")}</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 py-6"
          >
            {/* Current Balance Info */}
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                {t("your_current_balance")}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(session.expected_amount)}
              </p>
            </div>

            {/* Destination Selection */}
            <FormField
              control={form.control}
              name="to_session_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    {t("transfer_to")}
                  </FormLabel>
                  <FormControl>
                    {availableDestinations.length > 0 ? (
                      <RadioGroup
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={String(field.value)}
                      >
                        {availableDestinations.map((counter: CounterData) =>
                          counter.open_sessions.map((openSession) => (
                            <label
                              key={openSession.session_id}
                              className="flex items-center gap-3 rounded-lg border p-1 cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                              <RadioGroupItem
                                value={String(openSession.session_id)}
                              />
                              <div className="flex-1">
                                <span className="font-medium">
                                  {counter.name}
                                </span>
                                {counter.is_main_cash && (
                                  <Badge
                                    variant="secondary"
                                    className="ml-2 text-xs"
                                  >
                                    {t("main_cash")}
                                  </Badge>
                                )}
                                <span className="text-sm text-gray-500 pl-2">
                                  {openSession.external_user_name}
                                </span>
                              </div>
                            </label>
                          )),
                        )}
                      </RadioGroup>
                    ) : (
                      <div className="rounded-lg border border-dashed p-6 text-center">
                        <CareIcon
                          icon="l-info-circle"
                          className="mx-auto size-8 text-gray-400"
                        />
                        <p className="mt-2 text-sm text-gray-500">
                          {t("no_active_sessions_for_transfer")}
                        </p>
                      </div>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {availableDestinations.length > 0 && (
              <>
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
                          {isMainCashTransfer
                            ? t("denominations_required_for_main_cash")
                            : t("enter_denominations_description")}
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value || isMainCashTransfer}
                          onCheckedChange={field.onChange}
                          disabled={isMainCashTransfer}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Denomination Input */}
                {(useDenominations || isMainCashTransfer) && (
                  <DenominationInput
                    value={denominations}
                    onChange={handleDenominationChange}
                  />
                )}

                {/* Amount Input (manual entry when not using denominations) */}
                {!useDenominations && !isMainCashTransfer && (
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("transfer_amount")}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                              {t("currency_symbol")}
                            </span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              max={session.expected_amount}
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

                {/* Validation warning */}
                {amount > session.expected_amount && (
                  <p className="text-sm text-red-500">
                    {t("transfer_exceeds_balance")}
                  </p>
                )}

                <SheetFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isPending ||
                      !form.formState.isValid ||
                      amount > session.expected_amount ||
                      amount <= 0
                    }
                  >
                    {isPending ? (
                      <>
                        <CareIcon
                          icon="l-spinner"
                          className="mr-2 size-4 animate-spin"
                        />
                        {t("creating")}
                      </>
                    ) : (
                      <>
                        <CareIcon icon="l-exchange" className="mr-2 size-4" />
                        {t("create_transfer")}
                      </>
                    )}
                  </Button>
                </SheetFooter>
              </>
            )}
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
