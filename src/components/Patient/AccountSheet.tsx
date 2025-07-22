import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, ExternalLink } from "lucide-react";
import { navigate } from "raviger";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import query from "@/Utils/request/query";
import AccountSheet from "@/pages/Facility/billing/account/AccountSheet";
import {
  AccountBillingStatus,
  AccountRead,
  AccountStatus,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";
import { EncounterRead } from "@/types/emr/encounter/encounter";

interface AccountSheetButtonProps {
  encounter: EncounterRead;
  trigger: React.ReactNode;
  canWrite: boolean;
}

export function AccountSheetButton({
  encounter,
  trigger,
  canWrite,
}: AccountSheetButtonProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountRead | null>(
    null,
  );

  const {
    data: response,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["accounts", encounter.patient.id],
    queryFn: query(accountApi.listAccount, {
      pathParams: { facilityId: encounter.facility.id },
      queryParams: {
        patient: encounter.patient.id,
        status: AccountStatus.active,
        billing_status: AccountBillingStatus.open,
        limit: 1,
      },
    }),
    enabled: false,
  });

  const accounts = (response?.results as AccountRead[]) || [];

  const handleCreateAccountClick = () => {
    setCreateAccountOpen(true);
  };

  const handleEditAccount = (account: AccountRead, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAccount(account);
  };

  const handleViewAccount = (account: AccountRead, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(
      `/facility/${encounter.facility.id}/billing/account/${account.id}`,
    );
  };

  const handleOpenSheet = () => {
    refetch();
    setSheetOpen(true);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
  };

  return (
    <>
      <div onClick={handleOpenSheet} className="cursor-pointer">
        {trigger}
      </div>

      <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent className="sm:max-w-md md:max-w-lg">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl flex items-center justify-start gap-2">
              {t("account")}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={(e) => handleViewAccount(accounts[0], e)}
                >
                  <ExternalLink className="h-4 w-4" />
                  {t("more_details")}
                </Button>
                {canWrite && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={(e) => handleEditAccount(accounts[0], e)}
                  >
                    <Edit className="h-4 w-4" />
                    {t("edit")}
                  </Button>
                )}
              </div>
            </SheetTitle>
          </SheetHeader>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-5 pr-2 max-h-[calc(100vh-120px)] overflow-y-auto">
              {accounts.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-4">
                    {t("no_active_account_found")}
                  </p>
                  {canWrite && (
                    <Button
                      onClick={handleCreateAccountClick}
                      variant="outline"
                    >
                      {t("create_account")}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">
                        {accounts[0].name}
                      </h2>
                      {accounts[0].description && (
                        <div className="text-sm text-gray-500 max-w-lg">
                          {accounts[0].description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium border-b pb-2 mb-4">
                        {t("account_details")}
                      </h3>

                      <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <span className="text-gray-500">{t("status")}</span>
                        <span className="font-medium">
                          {t(accounts[0].status)}
                        </span>

                        <span className="text-gray-500">
                          {t("billing_status")}
                        </span>
                        <span className="font-medium">
                          {t(accounts[0].billing_status)}
                        </span>

                        <span className="text-gray-500">{t("start_date")}</span>
                        <span className="font-medium">
                          {accounts[0].service_period &&
                          accounts[0].service_period.start
                            ? new Date(
                                accounts[0].service_period.start,
                              ).toLocaleDateString(undefined, {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            : "-"}
                        </span>

                        <span className="text-gray-500">{t("end_date")}</span>
                        <span className="font-medium">
                          {accounts[0].service_period &&
                          accounts[0].service_period.end
                            ? new Date(
                                accounts[0].service_period.end,
                              ).toLocaleDateString(undefined, {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            : "-"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium border-b pb-2 mb-4">
                        {t("account_summary")}
                      </h3>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">
                            {t("total_balance")}
                          </span>
                          <span className="text-lg font-semibold text-red-600">
                            {accounts[0].total_balance.toLocaleString(
                              undefined,
                              {
                                style: "currency",
                                currency: "INR",
                              },
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">
                            {t("total_gross")}
                          </span>
                          <span className="font-medium">
                            {accounts[0].total_gross.toLocaleString(undefined, {
                              style: "currency",
                              currency: "INR",
                            })}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">
                            {t("total_net")}
                          </span>
                          <span className="font-medium">
                            {accounts[0].total_net.toLocaleString(undefined, {
                              style: "currency",
                              currency: "INR",
                            })}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">
                            {t("total_paid")}
                          </span>
                          <span className="font-medium text-green-600">
                            {accounts[0].total_paid.toLocaleString(undefined, {
                              style: "currency",
                              currency: "INR",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AccountSheet
        open={createAccountOpen}
        onOpenChange={(open) => {
          setCreateAccountOpen(open);
          if (!open) {
            queryClient.invalidateQueries({
              queryKey: ["accounts", encounter.patient.id],
            });
            refetch();
          }
        }}
        facilityId={encounter.facility.id}
        patientId={encounter.patient.id}
      />

      <AccountSheet
        open={!!editingAccount}
        onOpenChange={(open) => {
          if (!open) {
            setEditingAccount(null);
            queryClient.invalidateQueries({
              queryKey: ["accounts", encounter.patient.id],
            });
            refetch();
          }
        }}
        facilityId={encounter.facility.id}
        patientId={encounter.patient.id}
        initialValues={editingAccount || undefined}
        isEdit={true}
      />
    </>
  );
}
