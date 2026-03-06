import { DialogDescription } from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Hash, MoreVertical } from "lucide-react";
import { Link, navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import { NavTabs } from "@/components/ui/nav-tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import TagAssignmentSheet from "@/components/Tags/TagAssignmentSheet";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { getPermissions } from "@/common/Permissions";
import { usePermissions } from "@/context/PermissionContext";
import { useShortcutSubContext } from "@/context/ShortcutContext";
import PaymentReconciliationSheet from "@/pages/Facility/billing/PaymentReconciliationSheet";
import InvoicesData from "@/pages/Facility/billing/invoice/InvoicesData";
import PaymentsData from "@/pages/Facility/billing/paymentReconciliation/PaymentsData";
import {
  ACCOUNT_STATUS_COLORS,
  AccountBillingStatus,
  AccountRead,
  AccountStatus,
  closeBillingStatusColorMap,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";
import { ChargeItemStatus } from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";

import { isPositive } from "@/Utils/decimal";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import BackButton from "@/components/Common/BackButton";
import { ReportSubTab } from "@/components/Files/ReportSubTab";
import { PatientHeader } from "@/components/Patient/PatientHeader";
import useBreakpoints from "@/hooks/useBreakpoints";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { ReportType } from "@/types/emr/report/report";
import AccountSheet from "./AccountSheet";
import BedChargeItemsTable from "./components/BedChargeItemsTable";
import ChargeItemsTable from "./components/ChargeItemsTable";

function formatDate(date?: string) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type tab =
  | "charge_items"
  | "invoices"
  | "payments"
  | "bed_charge_items"
  | "reports";

const closedStatusText = {
  [AccountBillingStatus.closed_baddebt]: "close_account_help_closed_baddebt",
  [AccountBillingStatus.closed_voided]: "close_account_help_closed_voided",
  [AccountBillingStatus.closed_completed]:
    "close_account_help_closed_completed",
  [AccountBillingStatus.closed_combined]: "close_account_help_closed_combined",
};

export function AccountShow({
  facilityId,
  accountId,
  tab,
}: {
  facilityId: string;
  accountId: string;
  tab: tab;
}) {
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [paymentSheet, setPaymentSheet] = useState<{
    isOpen: boolean;
    isCreditNote: boolean;
  }>({ isOpen: false, isCreditNote: false });
  const queryClient = useQueryClient();
  const [closeAccountStatus, setCloseAccountStatus] = useState<{
    sheetOpen: boolean;
    reason: AccountBillingStatus;
  }>({ sheetOpen: false, reason: AccountBillingStatus.closed_baddebt });

  const { facility } = useCurrentFacility();
  const { hasPermission } = usePermissions();

  const { canUpdateAccount } = getPermissions(
    hasPermission,
    facility?.permissions || [],
  );

  useShortcutSubContext("facility:account:show");

  const { data: account, isLoading } = useQuery({
    queryKey: ["account", accountId],
    queryFn: query(accountApi.retrieveAccount, {
      pathParams: { facilityId, accountId },
    }),
  });

  const { data: billableChargeItems } = useQuery({
    queryKey: ["billableChargeItems", accountId],
    queryFn: query(chargeItemApi.listChargeItem, {
      pathParams: { facilityId },
      queryParams: {
        account: accountId,
        status: ChargeItemStatus.billable,
        limit: 1,
      },
    }),
    enabled: !!accountId && closeAccountStatus.sheetOpen,
  });

  const hasBillableItems = (billableChargeItems?.count ?? 0) > 0;

  const showMoreAfterIndex = useBreakpoints({
    default: 1,
    xs: 2,
    sm: 6,
    xl: 9,
    "2xl": 12,
  });

  const isAccountBillingClosed =
    account?.billing_status === AccountBillingStatus.closed_baddebt ||
    account?.billing_status === AccountBillingStatus.closed_voided ||
    account?.billing_status === AccountBillingStatus.closed_completed ||
    account?.billing_status === AccountBillingStatus.closed_combined;

  useEffect(() => {
    if (account) {
      setCloseAccountStatus({
        sheetOpen: false,
        reason: isAccountBillingClosed
          ? account?.billing_status
          : AccountBillingStatus.closed_baddebt,
      });
    }
  }, [account, isAccountBillingClosed]);

  const rebalanceMutation = useMutation({
    mutationFn: mutate(accountApi.rebalanceAccount, {
      pathParams: { facilityId, accountId },
    }),
    onSuccess: () => {
      toast.success(t("account_rebalanced_successfully"));
      queryClient.invalidateQueries({
        queryKey: ["account", accountId],
      });
    },
    onError: (_error) => {
      toast.error(t("account_rebalance_failed"));
    },
  });

  const { mutate: closeAccount } = useMutation({
    mutationFn: mutate(accountApi.updateAccount, {
      pathParams: { facilityId, accountId },
    }),
    onSuccess: () => {
      toast.success(t("account_closed_successfully"));
      queryClient.invalidateQueries({
        queryKey: ["account", accountId],
      });
    },
  });

  const { mutate: updateBillingStatus } = useMutation({
    mutationFn: mutate(accountApi.updateAccount, {
      pathParams: { facilityId, accountId },
    }),
    onSuccess: () => {
      toast.success(t("billing_status_updated_successfully"));
      queryClient.invalidateQueries({
        queryKey: ["account", accountId],
      });
    },
  });

  const advanceBillingStatus = (targetStatus: AccountBillingStatus) => {
    updateBillingStatus({
      id: accountId,
      name: account?.name || "",
      description: account?.description,
      status: account?.status || AccountStatus.active,
      billing_status: targetStatus,
      service_period: {
        start: account?.service_period?.start || new Date().toISOString(),
        ...(account?.service_period?.end && {
          end: account.service_period.end,
        }),
      },
      patient: account?.patient?.id || "",
      extensions: account?.extensions || {},
      primary_encounter: account?.primary_encounter?.id,
    });
  };

  const handleCloseAccount = () => {
    closeAccount({
      id: accountId,
      name: account?.name || "",
      description: account?.description,
      status: AccountStatus.inactive,
      billing_status: closeAccountStatus.reason,
      service_period: {
        start: account?.service_period?.start || new Date().toISOString(),
        end: new Date().toISOString(),
      },
      patient: account?.patient?.id || "",
      extensions: account?.extensions || {},
    });
    setCloseAccountStatus({
      sheetOpen: false,
      reason: AccountBillingStatus.closed_baddebt,
    });
  };

  if (isLoading) {
    return <TableSkeleton count={5} />;
  }

  if (!account) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">{t("account_not_found")}</h2>
          <p className="mt-2 text-gray-600">{t("account_may_not_exist")}</p>
          <Button asChild className="mt-4">
            <Link href={`/facility/${facilityId}/billing/account`}>
              {t("back_to_accounts")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const tabs = {
    invoices: {
      label: t("invoices"),
      component: (
        <InvoicesData
          facilityId={facilityId}
          accountId={accountId}
          hideAccountColumn
        />
      ),

      shortcutId: "switch-to-invoices-tab",
    },
    charge_items: {
      label: t("charge_items"),
      component: (
        <ChargeItemsTable
          facilityId={facilityId}
          accountId={accountId}
          patientId={account.patient.id}
        />
      ),
      shortcutId: "switch-to-charge-items-tab",
    },
    payments: {
      label: t("payments"),
      component: (
        <PaymentsData
          facilityId={facilityId}
          accountId={accountId}
          patientId={account.patient.id}
          hideAccountColumn
        />
      ),
      shortcutId: "switch-to-payments-tab",
    },
    reports: {
      label: t("reports"),
      component: (
        <ReportSubTab
          associatingId={accountId}
          reportType={ReportType.ACCOUNT_REPORT}
        />
      ),
      shortcutId: "switch-to-reports-tab",
    },
    bed_charge_items: {
      label: t("bed_charge_items"),
      component: (
        <BedChargeItemsTable facilityId={facilityId} account={account} />
      ),
      shortcutId: "switch-to-bed-charge-items-tab",
    },
  };

  return (
    <div className="space-y-3">
      <BackButton size="xs">
        <CareIcon icon="l-arrow-left" className="size-4" />
        {t("back")}
      </BackButton>
      <Card className="rounded-none shadow-none border-none flex flex-col md:flex-row md:justify-between bg-transparent gap-4">
        <PatientHeader
          patient={account.patient}
          facilityId={facilityId}
          className="flex-1 p-0 bg-transparent shadow-none"
        />
        <div className="flex gap-2">
          <div className="hidden lg:flex gap-2">
            {account.status === AccountStatus.active &&
              !isAccountBillingClosed && (
                <Button
                  variant="ghost"
                  className="text-gray-950 gap-1 flex flex-row items-center justify-between"
                  onClick={() =>
                    setCloseAccountStatus({
                      ...closeAccountStatus,
                      sheetOpen: true,
                    })
                  }
                >
                  <CareIcon icon="l-check" className="size-5" />
                  <span className="underline">{t("settle_close")}</span>
                  <ShortcutBadge actionId="settle-close-account" />
                </Button>
              )}
            {account.status === AccountStatus.active &&
              !isAccountBillingClosed && (
                <>
                  <Button
                    variant="outline"
                    className="border-gray-400 text-gray-950"
                    onClick={() =>
                      navigate(
                        `/facility/${facilityId}/billing/account/${accountId}/invoices/create`,
                      )
                    }
                  >
                    <CareIcon icon="l-plus" className="mr-2 size-4" />
                    {t("create_invoice")}
                    <ShortcutBadge actionId="create-invoice" />
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={() =>
                        setPaymentSheet({
                          isOpen: true,
                          isCreditNote: false,
                        })
                      }
                    >
                      <CareIcon icon="l-plus" className="size-4" />
                      {t("add_credit_payment")}
                      <ShortcutBadge actionId="credit-payment-account" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-gray-400"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            setPaymentSheet({
                              isOpen: true,
                              isCreditNote: true,
                            })
                          }
                        >
                          <CareIcon icon="l-plus" className="mr-2 size-4" />
                          {t("record_credit_note")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </>
              )}
          </div>

          {account.status === AccountStatus.active &&
            !isAccountBillingClosed && (
              <div className="lg:hidden w-full flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="border-gray-400 text-gray-950"
                  onClick={() =>
                    navigate(
                      `/facility/${facilityId}/billing/account/${accountId}/invoices/create`,
                    )
                  }
                >
                  <CareIcon icon="l-plus" className="size-4" />
                  {t("invoice")}
                  <ShortcutBadge actionId="create-invoice" />
                </Button>

                <Button
                  variant="primary"
                  onClick={() =>
                    setPaymentSheet({
                      isOpen: true,
                      isCreditNote: false,
                    })
                  }
                >
                  <CareIcon icon="l-plus" className="size-4" />
                  {t("credit")}
                  <ShortcutBadge actionId="record-payment-account" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-gray-400"
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {account.status === AccountStatus.active &&
                      !isAccountBillingClosed && (
                        <DropdownMenuItem
                          onClick={() =>
                            setCloseAccountStatus({
                              ...closeAccountStatus,
                              sheetOpen: true,
                            })
                          }
                        >
                          {t("settle_close")}
                          <ShortcutBadge actionId="settle-close-account" />
                        </DropdownMenuItem>
                      )}
                    <DropdownMenuItem
                      onClick={() =>
                        setPaymentSheet({
                          isOpen: true,
                          isCreditNote: true,
                        })
                      }
                    >
                      {t("record_credit_note")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
        </div>
      </Card>
      <div className="bg-gray-100 p-3 space-y-4 rounded-lg">
        <div className="bg-gray-100 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div>
              <p className="text-sm text-gray-700 font-medium">
                {t("account")}
              </p>
              <p className="font-medium text-base text-gray-950">
                {account.name}
              </p>
            </div>
            <div className="flex md:items-center gap-6">
              <div>
                <p className="text-sm text-gray-700 font-medium">
                  {t("status")}
                </p>
                <Badge variant={ACCOUNT_STATUS_COLORS[account.status]}>
                  {t(account.status)}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-700 font-medium">
                  {t("start_date")}
                </p>
                <p className="font-medium text-base text-gray-950">
                  {account.service_period?.start
                    ? formatDate(account.service_period?.start)
                    : formatDate(account.created_date)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-700 font-medium">
                  {t("end_date")}
                </p>
                <p className="font-medium text-base text-gray-950">
                  {account.service_period?.end
                    ? formatDate(account.service_period?.end)
                    : t("ongoing")}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-700 font-medium">
                {t("tags_proper")}
              </p>
              <div className="flex flex-wrap gap-1">
                <TagAssignmentSheet
                  entityType="account"
                  entityId={accountId}
                  facilityId={facilityId}
                  currentTags={account.tags ?? []}
                  onUpdate={() => {
                    queryClient.invalidateQueries({
                      queryKey: ["account", accountId],
                    });
                  }}
                  patientId={account.patient.id}
                  trigger={
                    <Button variant="outline" size="xs" className="rounded-sm">
                      <Hash />
                      {account.tags && account.tags.length > 0
                        ? t("manage_tags")
                        : t("add_tags")}
                    </Button>
                  }
                />
                {account.tags?.map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="text-xs">
                    {tag.display}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="link" asChild className="text-gray-950 underline">
              <Link
                href={`/facility/${facilityId}/patient/${account.patient.id}/accounts`}
              >
                {t("past_accounts")}
              </Link>
            </Button>
            {canUpdateAccount && (
              <Button
                variant="outline"
                className="border-gray-400 gap-1"
                onClick={() => setSheetOpen(true)}
              >
                <CareIcon
                  icon="l-edit"
                  className="size-5 stroke-gray-450 stroke-1"
                />
                {t("edit")}
                <ShortcutBadge actionId="edit-account" />
              </Button>
            )}
          </div>
        </div>

        {/* Financial Summary Section */}
        <div className="flex flex-col md:flex-row rounded-lg border border-gray-200 bg-white flex-wrap">
          <div className="flex-1 p-6 border-b md:border-r border-gray-200">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">
                {t("amount_due")}
              </p>
              <div className="flex items-end">
                <p
                  className={cn(
                    "text-3xl font-bold",
                    isPositive(account.total_balance)
                      ? "text-red-500"
                      : "text-green-700",
                  )}
                >
                  <MonetaryDisplay amount={account.total_balance} />
                </p>
              </div>
              <p className="text-xs text-gray-500">
                {isPositive(account.total_balance)
                  ? t("pending_from_patient")
                  : t("overpaid_amount")}
              </p>
            </div>
          </div>

          <div className="flex-1 p-6 border-b md:border-r border-gray-200">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">
                {t("total_paid")}
              </p>
              <div className="flex items-end">
                <p className="text-3xl font-bold text-gray-900">
                  <MonetaryDisplay amount={account.total_paid} />
                </p>
              </div>
              <p className="text-xs text-gray-500">{t("payments_received")}</p>
            </div>
          </div>

          <div className="flex-1 p-6 border-b md:border-r border-gray-200">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">
                {t("billed_gross")}
              </p>
              <div className="flex items-end">
                <p className="text-3xl font-bold text-gray-900">
                  <MonetaryDisplay amount={account.total_gross} />
                </p>
              </div>
              <p className="text-xs text-gray-500">
                {t("total_billed_before_adjustments")}
              </p>
            </div>
          </div>

          <div className="flex-1 p-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">
                {t("total_billable")}
              </p>
              <div className="flex items-end">
                <p className="text-3xl font-bold text-gray-900">
                  <MonetaryDisplay
                    amount={account.total_billable_charge_items}
                  />
                </p>
              </div>
              <p className="text-xs text-gray-500">
                {t("total_billable_charge_items_description")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 items-center justify-between">
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              className="gap-2 border-gray-400 text-gray-950 hidden"
            >
              <CareIcon icon="l-eye" className="size-4" />
              {t("view_statement")}
            </Button>
            {canUpdateAccount && (
              <Button
                variant="link"
                className="gap-2 underline"
                disabled={rebalanceMutation.isPending}
                onClick={() => rebalanceMutation.mutate({})}
              >
                <CareIcon icon="l-refresh" className="size-4" />
                {rebalanceMutation.isPending
                  ? t("rebalancing")
                  : t("rebalance")}
              </Button>
            )}
            {account.calculated_at && (
              <span
                className="text-xs text-gray-500 cursor-default"
                title={new Date(account.calculated_at).toLocaleString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              >
                {t("last_calculated_at", {
                  time: formatDistanceToNow(new Date(account.calculated_at), {
                    addSuffix: true,
                  }),
                })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">
              {t("billing_status")}
            </span>
            <BillingLifecycleStepper
              account={account}
              isAccountBillingClosed={isAccountBillingClosed}
              canUpdateAccount={canUpdateAccount}
              onAdvance={advanceBillingStatus}
              onSettleClose={() =>
                setCloseAccountStatus((prev) => ({
                  ...prev,
                  sheetOpen: true,
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <NavTabs
        className="w-full mt-4"
        tabContentClassName="mt-6"
        tabs={tabs}
        currentTab={tab}
        onTabChange={(value) =>
          navigate(
            `/facility/${facilityId}/billing/account/${accountId}/${value}`,
          )
        }
        setPageTitle={false}
        showMoreAfterIndex={showMoreAfterIndex}
      />

      <AccountSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        facilityId={facilityId}
        patientId={account.patient.id}
        initialValues={account}
        isEdit
      />

      <PaymentReconciliationSheet
        open={paymentSheet.isOpen}
        onOpenChange={(isOpen) => setPaymentSheet({ ...paymentSheet, isOpen })}
        facilityId={facilityId}
        accountId={accountId}
        isCreditNote={paymentSheet.isCreditNote}
        account={account}
      />

      <Dialog
        open={closeAccountStatus.sheetOpen}
        onOpenChange={(open) =>
          setCloseAccountStatus({ ...closeAccountStatus, sheetOpen: open })
        }
      >
        <DialogHeader></DialogHeader>
        <DialogContent>
          <DialogTitle>{t("close_account")}</DialogTitle>
          <DialogDescription className="text-xs text-gray-500 -mt-1">
            {t(
              closedStatusText[
                closeAccountStatus.reason as keyof typeof closedStatusText
              ],
            )}
          </DialogDescription>
          <Select
            value={closeAccountStatus.reason}
            onValueChange={(value) =>
              setCloseAccountStatus({
                ...closeAccountStatus,
                reason: value as AccountBillingStatus,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(closeBillingStatusColorMap).map((key) => (
                <SelectItem key={key} value={key}>
                  {t(key)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ClosedCallout balance={account.total_balance} />
          {hasBillableItems && (
            <span className="text-warning-500 bg-warning-50 text-xs p-2 rounded block -mt-3">
              {t("close_account_with_pending_items_caution_message")}
            </span>
          )}
          <Button variant="destructive" onClick={handleCloseAccount}>
            {t("close_account")}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const ClosedCallout = ({ balance }: { balance: string }) => {
  const { t } = useTranslation();
  const isNegative = isPositive(balance);
  if (!isNegative) return <></>;
  return (
    <span className="text-red-500 bg-red-50 text-xs -mt-2 p-2 rounded">
      <p>{t("close_account_negative_balance")}</p>
    </span>
  );
};

const BILLING_STEPS = [
  AccountBillingStatus.open,
  AccountBillingStatus.carecomplete_notbilled,
  AccountBillingStatus.billing,
  "closed",
] as const;

function BillingLifecycleStepper({
  account,
  isAccountBillingClosed,
  canUpdateAccount,
  onAdvance,
  onSettleClose,
}: {
  account: AccountRead;
  isAccountBillingClosed: boolean;
  canUpdateAccount: boolean;
  onAdvance: (status: AccountBillingStatus) => void;
  onSettleClose: () => void;
}) {
  const { t } = useTranslation();
  const isActive = account.status === AccountStatus.active;
  const canAdvance = canUpdateAccount && isActive && !isAccountBillingClosed;

  const currentStepIndex = (() => {
    if (isAccountBillingClosed) return 3;
    const idx = (BILLING_STEPS as readonly string[]).indexOf(
      account.billing_status,
    );
    return idx >= 0 ? idx : 0;
  })();

  const stepLabels: Record<string, string> = {
    [AccountBillingStatus.open]: t("open"),
    [AccountBillingStatus.carecomplete_notbilled]: t("carecomplete_notbilled"),
    [AccountBillingStatus.billing]: t("billing"),
    closed: t("closed"),
  };

  const handleStepClick = (index: number) => {
    if (!canAdvance) return;
    if (index <= currentStepIndex) return;

    const step = BILLING_STEPS[index];
    if (step === "closed") {
      onSettleClose();
    } else {
      onAdvance(step);
    }
  };

  return (
    <div className="flex items-center gap-0.5 mt-0.5">
      {BILLING_STEPS.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const isNext = index === currentStepIndex + 1 && canAdvance;
        const isClickable = canAdvance && index > currentStepIndex;

        return (
          <div key={step} className="flex items-center">
            {index > 0 && (
              <div
                className={cn(
                  "h-px w-3",
                  index <= currentStepIndex ? "bg-green-400" : "bg-gray-300",
                )}
              />
            )}
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => handleStepClick(index)}
              title={stepLabels[step]}
              className={cn(
                "flex items-center gap-1 group transition-all rounded-full px-1.5 py-0.5 text-xs",
                isClickable
                  ? "cursor-pointer hover:bg-gray-100"
                  : "cursor-default",
                isNext && "hover:ring-1 hover:ring-primary-300",
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center rounded-full size-5 text-[10px] font-bold transition-all flex-shrink-0",
                  isCompleted && "bg-green-500 text-white",
                  isCurrent && "bg-primary-500 text-white",
                  isNext &&
                    "border-[1.5px] border-dashed border-primary-400 text-primary-600 group-hover:border-solid group-hover:bg-primary-50",
                  !isCompleted &&
                    !isCurrent &&
                    !isNext &&
                    "bg-gray-200 text-gray-400",
                )}
              >
                {isCompleted ? (
                  <CareIcon icon="l-check" className="size-3" />
                ) : isNext ? (
                  <CareIcon icon="l-arrow-right" className="size-3" />
                ) : (
                  index + 1
                )}
              </div>
              {(isCurrent || isNext) && (
                <span
                  className={cn(
                    "whitespace-nowrap",
                    isCurrent && "font-semibold text-gray-900",
                    isNext && "font-medium text-primary-600",
                  )}
                >
                  {stepLabels[step]}
                </span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default AccountShow;
