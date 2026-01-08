import { KeyRoundIcon, ShieldAlertIcon, UserIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useMutation } from "@tanstack/react-query";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { GenerateServiceAccountTokenResponse } from "@/types/user/user";
import userApi from "@/types/user/userApi";

import mutate from "@/Utils/request/mutate";

import { FacilityOrganizationUserRole } from "@/types/facilityOrganization/facilityOrganization";
import { OrganizationUserRole } from "@/types/organization/organization";
import { PaginatedResponse } from "@/Utils/request/types";

interface Props {
  serviceAccounts?: PaginatedResponse<
    FacilityOrganizationUserRole | OrganizationUserRole
  >;
  isLoading: boolean;
  canManageServiceAccount: boolean;
}

export default function ServiceAccountSelector({
  serviceAccounts,
  isLoading,
  canManageServiceAccount,
}: Props) {
  const { t } = useTranslation();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);

  const { mutate: generateToken, isPending: isGenerating } = useMutation({
    mutationFn: mutate(userApi.generateServiceAccountToken, {
      pathParams: { username: selectedAccount || "" },
    }),
    onSuccess: (data: GenerateServiceAccountTokenResponse) => {
      setGeneratedToken(data.token);
      setShowTokenDialog(true);
      toast.success(t("token_generated_successfully"));
    },
    onError: () => {
      toast.error(t("failed_to_generate_token"));
    },
  });

  const { mutate: revokeToken, isPending: isRevoking } = useMutation({
    mutationFn: mutate(userApi.revokeServiceAccountToken, {
      pathParams: { username: selectedAccount || "" },
    }),
    onSuccess: () => {
      toast.success(t("token_revoked_successfully"));
      setShowRevokeDialog(false);
      setSelectedAccount(null);
    },
    onError: () => {
      toast.error(t("failed_to_revoke_token"));
      setShowRevokeDialog(false);
    },
  });

  const handleGenerateToken = (username: string) => {
    setSelectedAccount(username);
    generateToken({});
  };

  const handleRevokeToken = (username: string) => {
    setSelectedAccount(username);
    setShowRevokeDialog(true);
  };

  const handleCopyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      toast.success(t("token_copied_to_clipboard"));
    }
  };

  const handleCloseTokenDialog = () => {
    setShowTokenDialog(false);
    setGeneratedToken(null);
    setSelectedAccount(null);
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3">
          <CardListSkeleton count={4} />
        </div>
      ) : (
        <div className="md:pb-4">
          {serviceAccounts?.results?.length ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden sm:block rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/3">{t("username")}</TableHead>
                      <TableHead className="w-1/3">{t("role")}</TableHead>
                      <TableHead className="w-1/3">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviceAccounts.results.map((serviceAccount) => (
                      <TableRow key={serviceAccount.id}>
                        <TableCell>
                          <div className="font-medium flex items-center gap-2 py-2">
                            <UserIcon className="size-4" />
                            <span>{serviceAccount.user.username}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-700">
                            {serviceAccount.role.name}
                          </span>
                        </TableCell>
                        <TableCell>
                          {canManageServiceAccount && (
                            <div className="flex items-center justify-start gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleGenerateToken(
                                    serviceAccount.user.username,
                                  )
                                }
                                disabled={isGenerating}
                              >
                                <KeyRoundIcon className="mr-2 size-4" />
                                {isGenerating &&
                                selectedAccount === serviceAccount.user.username
                                  ? t("generating")
                                  : t("generate_token")}
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() =>
                                  handleRevokeToken(
                                    serviceAccount.user.username,
                                  )
                                }
                                className="p-2"
                              >
                                <ShieldAlertIcon className="mr-2 size-4" />
                                {t("revoke_token")}
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-4">
                {serviceAccounts.results.map((serviceAccount) => (
                  <Card key={serviceAccount.id}>
                    <CardContent className="p-4 space-y-4">
                      <CardHeader className="p-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <UserIcon className="size-4" />
                            <span className="text-lg font-semibold">
                              {serviceAccount.user.username}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {serviceAccount.role.name}
                          </span>
                        </div>
                      </CardHeader>

                      {canManageServiceAccount && (
                        <div className="flex gap-2 flex-wrap justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleGenerateToken(serviceAccount.user.username)
                            }
                            disabled={isGenerating}
                            className="flex-1 font-semibold"
                          >
                            <KeyRoundIcon className="mr-2 size-4" />
                            {isGenerating &&
                            selectedAccount === serviceAccount.user.username
                              ? t("generating")
                              : t("generate_token")}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              handleRevokeToken(serviceAccount.user.username)
                            }
                            className="flex-1 font-semibold"
                          >
                            <ShieldAlertIcon className="mr-2 size-4" />
                            {t("revoke_token")}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card className="col-span-full">
              <CardContent className="p-6 text-center text-gray-500">
                <UserIcon className="mx-auto size-12 text-gray-400 mb-2" />
                <p className="font-medium">{t("no_service_accounts_found")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Token Generation Dialog */}
      <Dialog open={showTokenDialog} onOpenChange={handleCloseTokenDialog}>
        <DialogContent className="max-w-md w-[95%] rounded-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-full bg-green-100">
                <KeyRoundIcon className="size-5 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  {t("token_generated_successfully")}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {t("copy_token_securely")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-medium text-gray-500 mb-2">
                {t("service_account_token")}
              </p>
              <code className="block break-all font-mono text-sm text-gray-900 bg-white p-3 rounded border border-gray-200">
                {generatedToken}
              </code>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <div className="flex gap-2">
                <CareIcon
                  icon="l-exclamation-triangle"
                  className="size-5 text-amber-600 shrink-0 mt-0.5"
                />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">{t("important_note")}</p>
                  <p className="text-xs">{t("token_warning_message")}</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleCopyToken}
              className="flex-1"
            >
              <CareIcon icon="l-copy" className="mr-2 size-4" />
              {t("copy_token")}
            </Button>
            <Button onClick={handleCloseTokenDialog} className="flex-1">
              {t("done")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Token Confirmation Dialog */}
      <ConfirmActionDialog
        open={showRevokeDialog}
        onOpenChange={setShowRevokeDialog}
        title={t("revoke_token")}
        description={
          <div className="space-y-2">
            <p>
              {t("revoke_token_confirmation", {
                username: selectedAccount,
              })}
            </p>
            <p className="text-sm text-gray-600">{t("revoke_token_warning")}</p>
          </div>
        }
        variant={"destructive"}
        confirmText={isRevoking ? t("revoking") : t("revoke")}
        disabled={isRevoking}
        onConfirm={() => revokeToken({})}
      />
    </div>
  );
}
