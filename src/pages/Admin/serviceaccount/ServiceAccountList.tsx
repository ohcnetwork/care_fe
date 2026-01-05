import { KeyRoundIcon, ShieldAlertIcon, UserIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useMutation, useQuery } from "@tanstack/react-query";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import Page from "@/components/Common/Page";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { GenerateServiceAccountTokenResponse } from "@/types/user/user";
import userApi from "@/types/user/userApi";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

export default function ServiceAccountList() {
  const { t } = useTranslation();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);

  const { data: serviceAccounts, isLoading } = useQuery({
    queryKey: ["serviceAccounts"],
    queryFn: query(userApi.getServiceAccounts),
  });

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
    <Page title={t("service_accounts")} hideTitleOnPage>
      <div className="container mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-700">
            {t("service_accounts")}
          </h1>
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-gray-600 text-sm">
                {t("manage_service_accounts_description")}
              </p>
            </div>
          </div>
        </div>
        {isLoading ? (
          <CardListSkeleton count={6} />
        ) : serviceAccounts && serviceAccounts?.length > 0 ? (
          <div className="flex flex-col gap-4">
            {serviceAccounts.map((serviceAccount) => (
              <Card
                key={serviceAccount.external_id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-primary-100">
                        <UserIcon className="size-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {serviceAccount.username}
                        </h3>
                        <CardDescription className="text-xs">
                          {t("service_account")}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleGenerateToken(serviceAccount.username)
                        }
                        disabled={isGenerating}
                        className="flex-1 sm:flex-none"
                      >
                        <KeyRoundIcon className="mr-2 size-4" />
                        {isGenerating &&
                        selectedAccount === serviceAccount.username
                          ? t("generating")
                          : t("generate_token")}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          handleRevokeToken(serviceAccount.username)
                        }
                        className="flex-1 sm:flex-none"
                      >
                        <ShieldAlertIcon className="mr-2 size-4" />
                        {t("revoke_token")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8">
            <div className="text-center text-gray-500">
              <UserIcon className="mx-auto size-12 text-gray-400 mb-2" />
              <p className="font-medium">{t("no_service_accounts_found")}</p>
            </div>
          </Card>
        )}
      </div>

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
    </Page>
  );
}
