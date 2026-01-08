import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { CounterData, SessionData } from "@/types/billing/cash/cashSession";
import cashSessionApi from "@/types/billing/cash/cashSessionApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

interface CloseSessionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  session: SessionData;
  onSessionClosed: () => void;
  onTransferClick?: () => void;
}

type CloseAction = "close_with_balance" | "transfer_all";

export default function CloseSessionSheet({
  open,
  onOpenChange,
  facilityId,
  session,
  onSessionClosed,
  onTransferClick,
}: CloseSessionSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [acknowledgedLiability, setAcknowledgedLiability] = useState(false);
  const [selectedAction, setSelectedAction] =
    useState<CloseAction>("transfer_all");

  const hasBalance = session.expected_amount > 0;
  const hasPendingOutgoing = session.pending_outgoing_count > 0;
  const hasPendingIncoming = session.pending_incoming_count > 0;
  const hasPendingTransfers = hasPendingOutgoing || hasPendingIncoming;

  // Get all counters to show transfer options
  const { data: countersResponse } = useQuery({
    queryKey: ["cash-counters", facilityId],
    queryFn: query(cashSessionApi.listCounters, {
      pathParams: { facilityId: facilityId },
    }),
    enabled: open && hasBalance,
  });

  // Find available destinations for transfer
  const availableDestinations =
    countersResponse?.counters?.filter(
      (c) =>
        c.open_sessions.length > 0 &&
        !c.open_sessions.some((s) => s.session_id === session.id),
    ) ?? [];

  const hasMainCash = availableDestinations.some((c) => c.is_main_cash);
  const hasOtherSessions = availableDestinations.length > 0;

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
      setAcknowledgedLiability(false);
      setSelectedAction("transfer_all");
      onSessionClosed();
    },
    onError: () => {
      toast.error(t("failed_to_close_session"));
    },
  });

  const handleClose = () => {
    closeSession({
      counter_x_care_id: session.counter_x_care_id,
    });
  };

  const handleTransferAndClose = () => {
    onOpenChange(false);
    onTransferClick?.();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const canClose =
    !hasBalance ||
    (selectedAction === "close_with_balance" && acknowledgedLiability);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <CareIcon icon="l-times-circle" className="size-5 text-red-500" />
            {t("close_session")}
          </SheetTitle>
          <SheetDescription>
            {t("close_session_description", { counter: session.counter_name })}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Current Balance Display */}
          <div
            className={`rounded-lg p-4 ${
              hasBalance
                ? "bg-amber-50 border border-amber-200"
                : "bg-green-50 border border-green-200"
            }`}
          >
            <p className="text-sm text-gray-600">{t("current_balance")}</p>
            <p
              className={`text-2xl font-bold ${
                hasBalance ? "text-amber-700" : "text-green-700"
              }`}
            >
              {formatCurrency(session.expected_amount)}
            </p>
            {!hasBalance && (
              <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                <CareIcon icon="l-check-circle" className="size-4" />
                {t("no_outstanding_balance")}
              </p>
            )}
          </div>

          {/* Pending Transfers Warning */}
          {hasPendingTransfers && (
            <Alert variant="destructive">
              <CareIcon icon="l-exclamation-triangle" className="size-4" />
              <AlertTitle>{t("pending_transfers_exist")}</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>{t("pending_transfers_warning")}</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {hasPendingOutgoing && (
                    <li>
                      {t("pending_outgoing_transfers", {
                        count: session.pending_outgoing_count,
                      })}
                    </li>
                  )}
                  {hasPendingIncoming && (
                    <li>
                      {t("pending_incoming_transfers", {
                        count: session.pending_incoming_count,
                      })}
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* If balance exists, show options */}
          {hasBalance && (
            <>
              {/* Warning about liability */}
              <Alert variant="destructive">
                <CareIcon icon="l-exclamation-triangle" className="size-4" />
                <AlertTitle>{t("balance_liability_warning_title")}</AlertTitle>
                <AlertDescription>
                  {t("balance_liability_warning_description", {
                    amount: formatCurrency(session.expected_amount),
                  })}
                </AlertDescription>
              </Alert>

              {/* Action Selection */}
              <div className="space-y-4">
                <Label className="text-base font-medium">
                  {t("how_to_handle_balance")}
                </Label>
                <RadioGroup
                  value={selectedAction}
                  onValueChange={(value) =>
                    setSelectedAction(value as CloseAction)
                  }
                  className="space-y-3"
                >
                  {/* Transfer option - recommended */}
                  {hasOtherSessions && (
                    <label className="flex items-start gap-3 rounded-lg border-2 border-primary/50 bg-primary/5 p-4 cursor-pointer hover:bg-primary/10 transition-colors">
                      <RadioGroupItem value="transfer_all" className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {t("transfer_balance_first")}
                          </span>
                          <Badge variant="primary" className="text-xs">
                            {t("recommended")}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {hasMainCash
                            ? t("transfer_to_main_cash_description")
                            : t("transfer_to_other_session_description")}
                        </p>
                        {/* Show available destinations */}
                        <div className="mt-3 space-y-1">
                          <p className="text-xs text-gray-500 font-medium">
                            {t("available_destinations")}:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {availableDestinations
                              .slice(0, 3)
                              .map((counter: CounterData) => (
                                <Badge
                                  key={counter.id}
                                  variant={
                                    counter.is_main_cash
                                      ? "primary"
                                      : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {counter.name}
                                  {counter.is_main_cash &&
                                    ` (${t("main_cash")})`}
                                </Badge>
                              ))}
                            {availableDestinations.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{availableDestinations.length - 3} {t("more")}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </label>
                  )}

                  {/* Close with balance - not recommended */}
                  <label className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50/50 p-4 cursor-pointer hover:bg-red-50 transition-colors">
                    <RadioGroupItem
                      value="close_with_balance"
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-red-700">
                          {t("close_with_outstanding_balance")}
                        </span>
                        <Badge variant="destructive" className="text-xs">
                          {t("not_recommended")}
                        </Badge>
                      </div>
                      <p className="text-sm text-red-600 mt-1">
                        {t("close_with_balance_warning")}
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              {/* Liability acknowledgment for closing with balance */}
              {selectedAction === "close_with_balance" && (
                <div className="space-y-4">
                  <Alert className="bg-red-50 border-red-300">
                    <CareIcon
                      icon="l-exclamation-circle"
                      className="size-4 text-red-600"
                    />
                    <AlertTitle className="text-red-800">
                      {t("liability_acknowledgment_required")}
                    </AlertTitle>
                    <AlertDescription className="text-red-700">
                      <ul className="list-disc list-inside space-y-1 mt-2">
                        <li>{t("liability_point_1")}</li>
                        <li>{t("liability_point_2")}</li>
                        <li>{t("liability_point_3")}</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-start gap-3 rounded-lg border-2 border-red-300 p-4 bg-red-50">
                    <Checkbox
                      id="acknowledge-liability"
                      checked={acknowledgedLiability}
                      onCheckedChange={(checked) =>
                        setAcknowledgedLiability(checked === true)
                      }
                    />
                    <Label
                      htmlFor="acknowledge-liability"
                      className="text-sm text-red-800 cursor-pointer leading-relaxed"
                    >
                      {t("acknowledge_liability_checkbox", {
                        amount: formatCurrency(session.expected_amount),
                      })}
                    </Label>
                  </div>
                </div>
              )}
            </>
          )}

          {/* No balance - simple close */}
          {!hasBalance && !hasPendingTransfers && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2 text-green-700">
                <CareIcon icon="l-check-circle" className="size-5" />
                <span className="font-medium">{t("ready_to_close")}</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                {t("no_balance_close_description")}
              </p>
            </div>
          )}

          {/* Session Summary */}
          <div className="rounded-lg border bg-gray-50 p-4 space-y-3">
            <h4 className="font-medium text-gray-900">
              {t("session_summary")}
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">{t("opening_balance")}</span>
                <p className="font-medium">
                  {formatCurrency(session.opening_balance)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">{t("payments_collected")}</span>
                <p className="font-medium">{session.payment_count}</p>
              </div>
              <div>
                <span className="text-gray-500">{t("current_balance")}</span>
                <p
                  className={`font-medium ${hasBalance ? "text-amber-600" : "text-green-600"}`}
                >
                  {formatCurrency(session.expected_amount)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="gap-2 flex-col sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            {t("cancel")}
          </Button>

          {hasBalance && selectedAction === "transfer_all" ? (
            <Button
              type="button"
              onClick={handleTransferAndClose}
              className="w-full sm:w-auto"
            >
              <CareIcon icon="l-exchange" className="mr-2 size-4" />
              {t("transfer_funds")}
            </Button>
          ) : (
            <Button
              type="button"
              variant={hasBalance ? "destructive" : "default"}
              onClick={handleClose}
              disabled={isPending || !canClose || hasPendingTransfers}
              className="w-full sm:w-auto"
            >
              {isPending ? (
                <>
                  <CareIcon
                    icon="l-spinner"
                    className="mr-2 size-4 animate-spin"
                  />
                  {t("closing")}
                </>
              ) : (
                <>
                  <CareIcon icon="l-times-circle" className="mr-2 size-4" />
                  {t("close_session")}
                </>
              )}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
