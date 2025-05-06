import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonetaryValue } from "@/components/ui/monetary-value";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Avatar } from "@/components/Common/Avatar";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import PaymentReconciliationSheet from "@/pages/Facility/billing/PaymentReconciliationSheet";
import InvoicesData from "@/pages/Facility/billing/invoice/InvoicesData";
import PaymentsData from "@/pages/Facility/billing/paymentReconciliation/PaymentsData";
import { AccountStatus } from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";

import AccountSheet from "./AccountSheet";
import ChargeItemsTable from "./components/ChargeItemsTable";

const statusMap: Record<AccountStatus, { label: string; color: string }> = {
  active: { label: "active", color: "primary" },
  inactive: { label: "inactive", color: "secondary" },
  entered_in_error: { label: "entered_in_error", color: "destructive" },
  on_hold: { label: "on_hold", color: "outline" },
};

function formatDate(date?: string) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type tab = "charge_items" | "invoices" | "payments";

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

  const {
    data: account,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["account", accountId],
    queryFn: query(accountApi.retrieveAccount, {
      pathParams: { facilityId, accountId },
    }),
  });

  const rebalanceMutation = useMutation({
    mutationFn: mutate(accountApi.rebalanceAccount, {
      pathParams: { facilityId, accountId },
    }),
    onSuccess: () => {
      toast.success(t("account_rebalanced_successfully"));
      refetch();
    },
    onError: (_error) => {
      toast.error(t("failed_to_rebalance_account"));
    },
  });

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
    <div className="space-y-8">
      {/* Account Details Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{account.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {account.description || t("no_description")}
              </p>
            </div>
            <Button variant="outline" onClick={() => setSheetOpen(true)}>
              <CareIcon icon="l-pen" className="mr-2 size-4" />
              {t("edit")}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-semibold">{t("patient_details")}</h3>
                <div className="mt-2 flex items-center gap-4">
                  <Avatar name={account.patient.name} className="size-12" />
                  <div>
                    <div className="font-medium">{account.patient.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {account.patient.phone_number}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold">{t("account_details")}</h3>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("status")}</span>
                    <Badge variant={statusMap[account.status].color as any}>
                      {t(statusMap[account.status].label)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("start_date")}
                    </span>
                    <span>{formatDate(account.service_period?.start)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("end_date")}
                    </span>
                    <span>{formatDate(account.service_period?.end)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              {t("account_summary")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div
                key={account.total_balance}
                className="flex flex-col justify-between text-sm"
              >
                <span className="text-base font-medium text-gray-500">
                  {t("total_balance")}
                </span>
                <span
                  className={cn(
                    account.total_balance > 0
                      ? "text-red-600"
                      : "text-green-600",
                    "text-xl font-bold px-1",
                  )}
                >
                  <MonetaryValue value={account.total_balance} />
                </span>
              </div>
              <div
                key={account.total_gross}
                className="flex flex-col justify-between text-sm"
              >
                <span className="text-base font-medium text-gray-500">
                  {t("total_gross")}
                </span>
                <span className={cn("text-xl font-bold px-1")}>
                  <MonetaryValue value={account.total_gross} />
                </span>
              </div>
              <div
                key={account.total_net}
                className="flex flex-col justify-between text-sm"
              >
                <span className="text-base font-medium text-gray-500">
                  {t("total_net")}
                </span>
                <span className={cn("text-xl font-bold px-1")}>
                  <MonetaryValue value={account.total_net} />
                </span>
              </div>
              <div
                key={account.total_paid}
                className="flex flex-col justify-between text-sm"
              >
                <span className="text-base font-medium text-gray-500">
                  {t("total_paid")}
                </span>
                <span className={cn("text-xl font-bold px-1")}>
                  <MonetaryValue value={account.total_paid} />
                </span>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Button className="w-full">
                <CareIcon icon="l-file" className="mr-2 size-4" />
                {t("view_statement")}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsPaymentSheetOpen(true)}
              >
                <CareIcon icon="l-wallet" className="mr-2 size-4" />
                {t("record_payment")}
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                disabled={rebalanceMutation.isPending}
                onClick={() => rebalanceMutation.mutate({})}
              >
                <CareIcon icon="l-refresh" className="mr-2 size-4" />
                {rebalanceMutation.isPending
                  ? t("rebalancing")
                  : t("rebalance")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs
        value={tab}
        onValueChange={(value) =>
          navigate(
            `/facility/${facilityId}/billing/account/${accountId}/${value}`,
          )
        }
        className="mt-8"
      >
        <div className="flex flex-row justify-between items-center">
          <TabsList>
            <TabsTrigger value="invoices">{t("invoices")}</TabsTrigger>
            <TabsTrigger value="charge_items">{t("charge_items")}</TabsTrigger>
            <TabsTrigger value="payments">{t("payments")}</TabsTrigger>
          </TabsList>

          <Button
            variant="outline"
            onClick={() =>
              navigate(
                `/facility/${facilityId}/billing/account/${accountId}/invoices/create`,
              )
            }
          >
            <CareIcon icon="l-plus" className="mr-2 size-4" />
            {t("create_invoice")}
          </Button>
        </div>

        <TabsContent value="charge_items" className="mt-4">
          <ChargeItemsTable facilityId={facilityId} accountId={accountId} />
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("invoices")}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {accountId
                    ? t("billing_statements")
                    : t("view_and_manage_invoices")}
                </p>
              </div>
              {accountId && (
                <div className="flex gap-2">
                  <Button variant="ghost" asChild>
                    <Link
                      href={`/facility/${facilityId}/billing/payments?accountId=${accountId}`}
                    >
                      <CareIcon icon="l-wallet" className="mr-2 size-4" />
                      {t("view_payments")}
                    </Link>
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <InvoicesData facilityId={facilityId} accountId={accountId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("payments")}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {accountId
                    ? t("payment_transactions")
                    : t("view_and_manage_payments")}
                </p>
              </div>
              <Button onClick={() => setIsPaymentSheetOpen(true)}>
                <CareIcon icon="l-plus" className="mr-2 size-4" />
                {t("record_payment")}
              </Button>
            </CardHeader>
            <CardContent>
              <PaymentsData facilityId={facilityId} accountId={accountId} />
            </CardContent>
          </Card>
        </TabsContent>
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
    </div>
  );
}

export default AccountShow;
