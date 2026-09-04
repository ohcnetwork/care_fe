import {
  ArrowLeftRight,
  BadgeCheck,
  ChevronDown,
  PauseCircle,
  PrinterIcon,
  RotateCcw,
  WrenchIcon,
} from "lucide-react";
import { Link, navigate } from "raviger";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import useUpdateDispenseOrderStatus from "@/pages/Facility/services/pharmacy/hooks/useUpdateDispenseOrderStatus";
import { MedicationReturnSheet } from "@/pages/Facility/services/pharmacy/MedicationReturnSheet";
import { extractInvoicesFromDispenses } from "@/pages/Facility/services/pharmacy/utils/extractInvoicesFromDispenses";

import { EXCLUDED_CHARGE_ITEM_STATUSES } from "@/types/billing/chargeItem/chargeItem";
import { InvoiceStatus } from "@/types/billing/invoice/invoice";
import {
  DispenseOrderRead,
  DispenseOrderStatus,
} from "@/types/emr/dispenseOrder/dispenseOrder";
import {
  MEDICATION_DISPENSE_CANCELLED_STATUSES,
  MedicationDispenseRead,
  MedicationDispenseStatus,
} from "@/types/emr/medicationDispense/medicationDispense";

import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";

interface Props {
  facilityId: string;
  locationId: string;
  dispenseOrder: DispenseOrderRead;
  /** Every dispense of the order, including cancelled ones. */
  dispenses: MedicationDispenseRead[];
  hasNonCancelledDispenses: boolean;
  updateStatus: ReturnType<typeof useUpdateDispenseOrderStatus>["mutate"];
  isUpdatingStatus: boolean;
}

/**
 * Sticky action bar of the dispense order view, along with the confirmation
 * dialogs its actions open. Renders nothing for cancelled orders — those
 * surface their next actions in the patient header instead.
 */
export function DispenseOrderViewFooter({
  facilityId,
  locationId,
  dispenseOrder,
  dispenses,
  hasNonCancelledDispenses,
  updateStatus,
  isUpdatingStatus,
}: Props) {
  const { t } = useTranslation();

  const [putOnHoldDialogOpen, setPutOnHoldDialogOpen] = useState(false);
  const [confirmStatusChange, setConfirmStatusChange] =
    useState<DispenseOrderStatus | null>(null);

  const isOrderOpen =
    dispenseOrder.status === DispenseOrderStatus.draft ||
    dispenseOrder.status === DispenseOrderStatus.in_progress;

  const isOrderCompleted =
    dispenseOrder.status === DispenseOrderStatus.completed;

  const invoices = useMemo(
    () => extractInvoicesFromDispenses(dispenses),
    [dispenses],
  );

  const hasBalancedInvoice = invoices.some(
    (inv) => inv.status === InvoiceStatus.balanced,
  );

  // Cancelling the dispense order (abandoned / entered_in_error) is blocked
  // while an issued/balanced invoice exists.
  const blockingInvoice = invoices.find(
    (inv) =>
      inv.status === InvoiceStatus.issued ||
      inv.status === InvoiceStatus.balanced,
  );

  // Completion is allowed only when every billable item is either excluded
  // (not_billable / aborted / entered_in_error) or settled in a balanced
  // invoice. Cancelled dispenses don't require settlement.
  const canCompleteDispense = useMemo(
    () =>
      dispenses.every((dispense) => {
        if (MEDICATION_DISPENSE_CANCELLED_STATUSES.includes(dispense.status)) {
          return true;
        }
        const ci = dispense.charge_item;
        if (!ci) return true;
        if (EXCLUDED_CHARGE_ITEM_STATUSES.includes(ci.status)) return true;
        return ci.paid_invoice?.status === InvoiceStatus.balanced;
      }),
    [dispenses],
  );

  // True when one or more non-finalized dispenses are currently on hold.
  const hasOnHoldDispenses = useMemo(
    () => dispenses.some((d) => d.status === MedicationDispenseStatus.on_hold),
    [dispenses],
  );

  if (!isOrderOpen && !isOrderCompleted) {
    return null;
  }

  const handlePutOnHold = () => {
    updateStatus(
      { newStatus: DispenseOrderStatus.draft },
      {
        onSuccess: () => {
          setPutOnHoldDialogOpen(false);
          navigate(
            `/facility/${facilityId}/locations/${locationId}/medication_requests`,
          );
        },
      },
    );
  };

  const handleResumePreparation = () => {
    updateStatus({ newStatus: DispenseOrderStatus.in_progress });
  };

  const cancelStatusOptions = [
    DispenseOrderStatus.entered_in_error,
    DispenseOrderStatus.abandoned,
  ].filter((s) => s !== dispenseOrder.status);

  return (
    <>
      {isOrderOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-10 px-4 md:px-6 py-4 bg-white border-t border-gray-200 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-col gap-3.5 text-sm text-gray-700">
            {canCompleteDispense ? (
              <>
                <span className="font-medium">
                  {t("payment_has_been_collected")}
                </span>{" "}
                <span className="text-red-600 font-medium">
                  {t("complete_dispense_to_proceed")}
                </span>
              </>
            ) : (
              <span className="text-red-600 font-medium italic">
                {t("settle_pending_invoices_before_completion")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {hasOnHoldDispenses ? (
              <Button
                variant="outline"
                onClick={handleResumePreparation}
                disabled={isUpdatingStatus || hasBalancedInvoice}
                title={
                  hasBalancedInvoice
                    ? t("put_in_preparation_disabled_balanced_invoice")
                    : undefined
                }
              >
                <WrenchIcon className="size-4" />
                {t("put_in_preparation")}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setPutOnHoldDialogOpen(true)}
                disabled={isUpdatingStatus || hasBalancedInvoice}
                title={
                  hasBalancedInvoice
                    ? t("put_on_hold_disabled_balanced_invoice")
                    : undefined
                }
              >
                <PauseCircle className="size-4" />
                {t("put_on_hold")}
              </Button>
            )}
            <div className="flex">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant={
                        canCompleteDispense ? "primary" : "outline_primary"
                      }
                      className="rounded-r-none"
                      onClick={() =>
                        updateStatus({
                          newStatus: DispenseOrderStatus.completed,
                        })
                      }
                      disabled={isUpdatingStatus || !canCompleteDispense}
                    >
                      {t("complete_dispense")}
                      <ShortcutBadge actionId="dispense-button" />
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canCompleteDispense && (
                  <TooltipContent>
                    {t("settle_pending_invoices_before_completion")}
                  </TooltipContent>
                )}
              </Tooltip>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={
                      canCompleteDispense ? "primary" : "outline_primary"
                    }
                    size="icon"
                    className="rounded-l-none border-l border-l-white/20"
                    disabled={isUpdatingStatus}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {cancelStatusOptions.map((s) => (
                    <DropdownMenuItem
                      key={s}
                      onClick={() => setConfirmStatusChange(s)}
                      disabled={isUpdatingStatus}
                    >
                      {t(`mark_as_${s}`)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      )}

      {isOrderCompleted && (
        <div className="fixed bottom-0 left-0 right-0 z-10 px-4 md:px-6 py-3 bg-white border-t border-gray-200 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-50">
              <BadgeCheck
                className="size-5 text-primary-700"
                strokeWidth={1.5}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">
                {t("dispense_completed_title")}
              </span>
              <span className="text-xs text-gray-500">
                {t("next_pharmacy_action_question")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {hasNonCancelledDispenses && (
              <MedicationReturnSheet
                facilityId={facilityId}
                locationId={locationId}
                patient={dispenseOrder.patient}
                onSuccess={(deliveryOrder) => {
                  navigate(
                    `/facility/${facilityId}/locations/${locationId}/medication_return/order/${deliveryOrder.id}/?dispenseOrderIds=${dispenseOrder.id}`,
                  );
                }}
                trigger={
                  <Button variant="outline">
                    <RotateCcw className="size-4" />
                    {t("medication_return")}
                  </Button>
                }
              />
            )}
            <Button
              variant="outline"
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/locations/${locationId}/medication_dispense/order/${dispenseOrder.id}/print`,
                )
              }
            >
              <PrinterIcon className="size-4" />
              {t("print")}
            </Button>
            {/* Next pharmacy actions — primary split button */}
            <div className="flex">
              <Button variant="primary" className="rounded-r-none" asChild>
                <Link
                  href={`/facility/${facilityId}/locations/${locationId}/medication_requests`}
                  basePath="/"
                >
                  {t("prescription_queue")}
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="primary"
                    size="icon"
                    className="rounded-l-none border-l border-l-white/20"
                    aria-label={t("next_pharmacy_action_question")}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/facility/${facilityId}/locations/${locationId}/medication_dispense`}
                      basePath="/"
                    >
                      {t("go_to_dispenses")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/facility/${facilityId}/locations/${locationId}/medication_return`}
                      basePath="/"
                    >
                      {t("medicine_returns")}
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* Cancel options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={isUpdatingStatus}
                  aria-label={t("more_actions")}
                >
                  <CareIcon icon="l-ellipsis-v" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {cancelStatusOptions.map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => setConfirmStatusChange(s)}
                    disabled={isUpdatingStatus}
                  >
                    {t(`mark_as_${s}`)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Put on hold confirmation */}
      <AlertDialog
        open={putOnHoldDialogOpen}
        onOpenChange={setPutOnHoldDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("put_dispense_on_hold")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("put_on_hold_confirmation")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus}>
              {t("stay_on_this_page")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handlePutOnHold();
              }}
              disabled={isUpdatingStatus}
            >
              <ArrowLeftRight className="size-4" />
              {t("put_on_hold")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status change confirmation (entered_in_error / abandoned) */}
      <AlertDialog
        open={!!confirmStatusChange}
        onOpenChange={(open) => !open && setConfirmStatusChange(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmStatusChange ? t(`mark_as_${confirmStatusChange}`) : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blockingInvoice
                ? t("dispense_order_cannot_be_cancelled_due_to_invoice", {
                    invoiceNumber: blockingInvoice.number,
                    status: t(`invoice_status__${blockingInvoice.status}`),
                  })
                : confirmStatusChange === DispenseOrderStatus.entered_in_error
                  ? t("mark_order_as_entered_in_error_confirmation_description")
                  : t("mark_order_as_abandoned_confirmation_description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus}>
              {blockingInvoice ? t("close") : t("cancel")}
            </AlertDialogCancel>
            {!blockingInvoice && (
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  if (!confirmStatusChange) return;
                  updateStatus(
                    { newStatus: confirmStatusChange },
                    {
                      onSuccess: () => {
                        setConfirmStatusChange(null);
                      },
                    },
                  );
                }}
                disabled={isUpdatingStatus}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {t("confirm")}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
