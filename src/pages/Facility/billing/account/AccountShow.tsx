import { DialogDescription } from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { Link, navigate, useQueryParams } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import PaymentReconciliationSheet from "@/pages/Facility/billing/PaymentReconciliationSheet";
import InvoicesData from "@/pages/Facility/billing/invoice/InvoicesData";
import PaymentsData from "@/pages/Facility/billing/paymentReconciliation/PaymentsData";
import {
  ACCOUNT_STATUS_COLORS,
  AccountBillingStatus,
  AccountStatus,
  closeBillingStatusColorMap,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";
import { ChargeItemStatus } from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";

import { PatientHeader } from "@/pages/Facility/services/serviceRequests/PatientHeader";
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

type tab = "charge_items" | "invoices" | "payments" | "bed_charge_items";

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
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const queryClient = useQueryClient();
  const [closeAccountStatus, setCloseAccountStatus] = useState<{
    sheetOpen: boolean;
    reason: AccountBillingStatus;
  }>({ sheetOpen: false, reason: AccountBillingStatus.closed_baddebt });
  const [{ encounterId }] = useQueryParams();

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
            <Link href={`/facility/${facilityId}/billing/accounts`}>
              {t("back_to_accounts")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        size="xs"
        className="text-gray-950 gap-1 border-gray-400"
        onClick={() => navigate(`/facility/${facilityId}/billing/accounts`)}
      >
        <CareIcon icon="l-arrow-left" className="size-4" />
        {t("back")}
      </Button>
      <PatientHeader
        patient={account.patient}
        facilityId={facilityId}
        className="md:p-0 p-0"
        actions={
          <div className="flex gap-2">
            <div className="hidden lg:flex gap-2">
              {account.status === AccountStatus.active &&
                !isAccountBillingClosed && (
                  <Button
                    variant="link"
                    className="text-gray-950 underline gap-0"
                    onClick={() =>
                      setCloseAccountStatus({
                        ...closeAccountStatus,
                        sheetOpen: true,
                      })
                    }
                  >
                    <CareIcon icon="l-check" className="size-5" />
                    {t("settle_close")}
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
                    </Button>

                    <Button
                      variant="primary"
                      onClick={() => setIsPaymentSheetOpen(true)}
                    >
                      <CareIcon icon="l-plus" className="size-4" />
                      {t("record_payment")}
                    </Button>
                  </>
                )}
            </div>

            {account.status === AccountStatus.active &&
              !isAccountBillingClosed && (
                <div className="lg:hidden w-full">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild className="w-full">
                      <Button
                        variant="outline"
                        className=" border-gray-400 text-gray-950"
                      >
                        {t("actions")}
                        <ChevronDown className="size-5" />
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
                            <CareIcon icon="l-check" className="mr-2 size-5" />
                            {t("settle_close")}
                          </DropdownMenuItem>
                        )}
                      <DropdownMenuItem
                        onClick={() =>
                          navigate(
                            `/facility/${facilityId}/billing/account/${accountId}/invoices/create`,
                          )
                        }
                      >
                        <CareIcon icon="l-plus" className="mr-2 size-4" />
                        {t("create_invoice")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setIsPaymentSheetOpen(true)}
                      >
                        <CareIcon icon="l-plus" className="mr-2 size-4" />
                        {t("record_payment")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
          </div>
        }
      />
      <div className="bg-gray-100 p-3 space-y-4 rounded-lg">
        <div className="bg-gray-100 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            <div>
              <p className="text-sm text-gray-700 font-medium">
                {t("account")}
              </p>
              <p className="font-medium text-base text-gray-950">
                {account.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-700 font-medium">{t("status")}</p>
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
          <div className="flex items-center gap-2">
            <Button variant="link" asChild className="text-gray-950 underline">
              <Link
                href={`/facility/${facilityId}/patient/${account.patient.id}/accounts`}
              >
                {t("past_accounts")}
              </Link>
            </Button>
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
            </Button>
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
                  className={cn("text-3xl font-bold", {
                    "text-red-500": Number(account.total_balance) > 0,
                    "text-green-700": Number(account.total_balance) <= 0,
                  })}
                >
                  <MonetaryDisplay amount={account.total_balance} />
                </p>
              </div>
              <p className="text-xs text-gray-500">
                {Number(account.total_balance) >= 0
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

          <div className="flex-1 p-6">
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
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2 border-gray-400 text-gray-950 hidden"
          >
            <CareIcon icon="l-eye" className="size-4" />
            {t("view_statement")}
          </Button>
          <Button
            variant="link"
            className="gap-2 underline"
            disabled={rebalanceMutation.isPending}
            onClick={() => rebalanceMutation.mutate({})}
          >
            <CareIcon icon="l-refresh" className="size-4" />
            {rebalanceMutation.isPending ? t("rebalancing") : t("rebalance")}
          </Button>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs
        value={tab}
        onValueChange={(value) =>
          navigate(
            `/facility/${facilityId}/billing/account/${accountId}/${value}` +
              (encounterId !== undefined ? `?encounterId=${encounterId}` : ""),
          )
        }
        className="mt-8"
      >
        <div className="flex flex-row justify-between items-center">
          <TabsList className="border-b border-gray-300 w-full flex justify-start gap-0 rounded-none bg-transparent p-0">
            <TabsTrigger
              value="invoices"
              className="border-b-2 px-6 py-2 text-sm font-medium data-[state=active]:border-b-primary-700 data-[state=active]:text-primary-800 rounded-none bg-transparent data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:font-semibold text-gray-600"
            >
              {t("invoices")}
            </TabsTrigger>
            <TabsTrigger
              value="charge_items"
              className="border-b-2 px-6 py-2 text-sm font-medium data-[state=active]:border-b-primary-700 data-[state=active]:text-primary-800 rounded-none bg-transparent data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:font-semibold text-gray-600"
            >
              {t("charge_items")}
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="border-b-2 px-6 py-2 text-sm font-medium data-[state=active]:border-b-primary-700 data-[state=active]:text-primary-800 rounded-none bg-transparent data-[state=active]:shadow-none data-[state=active]:bg-transparent text-gray-600"
            >
              {t("payments")}
            </TabsTrigger>
            {encounterId && (
              <TabsTrigger
                value="bed_charge_items"
                className="border-b-2 px-6 py-2 text-sm font-medium data-[state=active]:border-b-primary-700 data-[state=active]:text-primary-800 rounded-none bg-transparent data-[state=active]:shadow-none data-[state=active]:bg-transparent text-gray-600"
              >
                {t("bed_charge_items")}
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="charge_items" className="mt-4">
          <ChargeItemsTable
            facilityId={facilityId}
            accountId={accountId}
            patientId={account.patient.id}
          />
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <InvoicesData facilityId={facilityId} accountId={accountId} />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsData facilityId={facilityId} accountId={accountId} />
        </TabsContent>
        {
          <TabsContent value="bed_charge_items" className="mt-4">
            <BedChargeItemsTable
              facilityId={facilityId}
              accountId={accountId}
            />
          </TabsContent>
        }
      </Tabs>

      <AccountSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        facilityId={facilityId}
        initialValues={account}
        isEdit
      />

      <PaymentReconciliationSheet
        open={isPaymentSheetOpen}
        onOpenChange={setIsPaymentSheetOpen}
        facilityId={facilityId}
        accountId={accountId}
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
          <ClosedCallout balance={Number(account.total_balance)} />
          {hasBillableItems && (
            <span className="text-red-500 bg-red-50 text-xs p-2 rounded block -mt-3">
              {t("cannot_close_account_with_pending_items")}
            </span>
          )}
          <Button
            variant="destructive"
            onClick={handleCloseAccount}
            disabled={hasBillableItems}
          >
            {t("close_account")}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const ClosedCallout = ({ balance }: { balance: number }) => {
  const { t } = useTranslation();
  const isNegative = balance > 0;
  if (!isNegative) return <></>;
  return (
    <span className="text-red-500 bg-red-50 text-xs -mt-2 p-2 rounded">
      <p>{t("close_account_negative_balance")}</p>
    </span>
  );
};

export default AccountShow;
