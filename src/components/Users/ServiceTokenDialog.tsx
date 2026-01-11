import {
  CopyIcon,
  KeyRoundIcon,
  ShieldAlertIcon,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useMutation } from "@tanstack/react-query";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  GenerateServiceAccountTokenResponse,
  UserReadMinimal,
} from "@/types/user/user";
import userApi from "@/types/user/userApi";

import mutate from "@/Utils/request/mutate";

interface ServiceTokenDialogProps {
  user: UserReadMinimal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ServiceTokenDialog({
  user,
  open,
  onOpenChange,
}: ServiceTokenDialogProps) {
  const { t } = useTranslation();
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);

  const { mutate: generateToken, isPending: isGenerating } = useMutation({
    mutationFn: mutate(userApi.generateServiceAccountToken, {
      pathParams: { username: user.username },
    }),
    onSuccess: (data: GenerateServiceAccountTokenResponse) => {
      setGeneratedToken(data.token);
      setShowTokenDialog(true);
      toast.success(t("token_generated_successfully"));
    },
  });

  const { mutate: revokeToken, isPending: isRevoking } = useMutation({
    mutationFn: mutate(userApi.revokeServiceAccountToken, {
      pathParams: { username: user.username },
    }),
    onSuccess: () => {
      toast.success(t("token_revoked_successfully"));
      setShowRevokeDialog(false);
    },
  });

  const handleGenerateToken = () => {
    generateToken({});
  };

  const handleRevokeToken = () => {
    setShowRevokeDialog(true);
    setShowTokenDialog(false);
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
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setGeneratedToken(null);
    setShowTokenDialog(false);
    setShowRevokeDialog(false);
  };

  return (
    <>
      <Dialog open={open && !showTokenDialog} onOpenChange={handleClose}>
        <DialogContent className="max-w-md w-[95%] rounded-md">
          <DialogHeader className="-mb-2">
            <DialogTitle className="text-xl font-bold text-gray-900">
              {t("manage_token")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t("manage_service_account_token_for")} {user.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <div className="flex gap-2">
                <TriangleAlert className="size-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">{t("caution")}</p>
                  <ul className="text-xs space-y-1 list-disc list-inside">
                    <li>{t("token_generate_caution_1")}</li>
                    <li>{t("token_generate_caution_2")}</li>
                    <li>{t("token_generate_caution_3")}</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="secondary"
                onClick={handleRevokeToken}
                className="w-full justify-center items-center"
              >
                <ShieldAlertIcon className="mr-2 size-4" />
                <span className="hidden sm:inline">{t("revoke_token")}</span>
                <span className="sm:hidden">{t("revoke")}</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleGenerateToken}
                disabled={isGenerating}
                className="w-full justify-center items-center"
              >
                <KeyRoundIcon className="mr-2 size-4" />
                <span className="hidden sm:inline">
                  {isGenerating ? t("generating") : t("generate_token")}
                </span>
                <span className="sm:hidden">
                  {isGenerating ? t("generating") : t("generate")}
                </span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTokenDialog} onOpenChange={handleCloseTokenDialog}>
        <DialogContent className="max-w-md w-[95%] rounded-md">
          <DialogHeader>
            <div className="flex gap-2">
              <div className="hidden sm:flex size-10 items-center justify-center rounded-full bg-green-100">
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
              <div className="relative bg-white p-3 rounded border border-gray-200">
                <code className="block break-all font-mono text-sm text-gray-900 pr-8">
                  {generatedToken}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyToken}
                  className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <CopyIcon className="size-4" />
                </Button>
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <div className="flex gap-2">
                <TriangleAlert className="size-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">{t("important_note")}</p>
                  <p className="text-xs">{t("token_warning_message")}</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={showRevokeDialog}
        onOpenChange={setShowRevokeDialog}
        title={t("revoke_token")}
        description={
          <div className="space-y-2">
            <p>
              {t("revoke_token_confirmation", {
                username: user.username,
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
    </>
  );
}
