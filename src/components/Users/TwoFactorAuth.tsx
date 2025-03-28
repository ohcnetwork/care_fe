import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { PasswordDialog } from "@/components/Common/PasswordDialog";
import { userChildProps } from "@/components/Common/UserColumns";
import { BackupCodesDialog } from "@/components/Users/BackupCodesDialog";
import { TOTPSetupDialog } from "@/components/Users/TOTPSetupDialog";

import mutate from "@/Utils/request/mutate";
import { HTTPError, StructuredError } from "@/Utils/request/types";
import authApi from "@/types/auth/authApi";
import { TOTPSetupResponse, TOTPVerifyResponse } from "@/types/auth/otp";

interface DialogState {
  password: boolean;
  setup: boolean;
  backupCodes: boolean;
  disable: boolean;
  regenerateConfirm: boolean;
}

export const TwoFactorAuth = ({ userData }: userChildProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [dialogState, setDialogState] = useState<DialogState>({
    password: false,
    setup: false,
    backupCodes: false,
    disable: false,
    regenerateConfirm: false,
  });
  const [verificationError, setVerificationError] = useState("");
  const [setupData, setSetupData] = useState<TOTPSetupResponse | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showRegenerateBackupCodes, setShowRegenerateBackupCodes] =
    useState(false);
  const [setupPasswordError, setSetupPasswordError] = useState("");
  const [disableError, setDisableError] = useState("");
  const [regeneratePasswordError, setRegeneratePasswordError] = useState("");

  const updateDialog = (key: keyof DialogState, value: boolean) => {
    setDialogState((prev) => ({ ...prev, [key]: value }));
  };

  const openPasswordDialog = () => updateDialog("password", true);
  const closePasswordDialog = () => updateDialog("password", false);
  const openSetupDialog = () => updateDialog("setup", true);
  const closeSetupDialog = () => updateDialog("setup", false);
  const openBackupCodes = () => updateDialog("backupCodes", true);
  const closeBackupCodes = () => updateDialog("backupCodes", false);
  const openDisableDialog = () => updateDialog("disable", true);
  const closeDisableDialog = () => updateDialog("disable", false);
  const openRegenerateConfirm = () => updateDialog("regenerateConfirm", true);
  const closeRegenerateConfirm = () => updateDialog("regenerateConfirm", false);

  const {
    password: showPasswordDialog,
    setup: showSetupDialog,
    backupCodes: showBackupCodes,
    disable: showDisableDialog,
    regenerateConfirm: showRegenerateConfirm,
  } = dialogState;

  const handleSetup = () => {
    openPasswordDialog();
  };

  const { mutate: setupTOTP, isPending: isSettingUp } = useMutation({
    mutationFn: mutate(authApi.totp.setup),
    onSuccess: (data: TOTPSetupResponse) => {
      setSetupData(data);
      closePasswordDialog();
      openSetupDialog();
      setSetupPasswordError("");
      queryClient.invalidateQueries({ queryKey: ["getUserDetails"] });
    },
    onError: (error: HTTPError) => {
      const errors = error.cause as StructuredError;
      const errorMessage =
        errors?.password?.[0] ||
        errors?.message?.[0] ||
        t("two_factor_authentication_setup_error");
      setSetupPasswordError(errorMessage);
    },
  });

  const { mutate: verifyTOTP, isPending: isVerifying } = useMutation({
    mutationFn: mutate(authApi.totp.verify),
    onSuccess: (data: TOTPVerifyResponse) => {
      if (data.backup_codes && Array.isArray(data.backup_codes)) {
        setBackupCodes(data.backup_codes);
        closeSetupDialog();
        openBackupCodes();
        setVerificationError("");
        toast.success(t("two_factor_authentication_enabled"));
        queryClient.invalidateQueries({ queryKey: ["getUserDetails"] });
      }
    },
    onError: (error: HTTPError) => {
      const errors = error.cause as StructuredError;
      const errorMessage =
        errors?.code?.[0] || t("two_factor_authentication_verify_error");
      setVerificationError(errorMessage);
    },
  });

  const { mutate: disableTOTP, isPending: isDisabling } = useMutation({
    mutationFn: mutate(authApi.totp.disable),
    onSuccess: () => {
      toast.success(t("two_factor_authentication_disabled_success"));
      closeDisableDialog();
      setDisableError("");
      queryClient.invalidateQueries({ queryKey: ["getUserDetails"] });
    },
    onError: (error: HTTPError) => {
      const errors = error.cause as StructuredError;
      const errorMessage =
        errors?.password?.[0] || t("two_factor_authentication_disable_error");
      setDisableError(errorMessage);
    },
  });

  const { mutate: regenerateBackupCodes, isPending: isRegenerating } =
    useMutation({
      mutationFn: mutate(authApi.totp.regenerateBackupCodes),
      onSuccess: (data: { backup_codes: string[] }) => {
        setBackupCodes(data.backup_codes);
        closeRegenerateConfirm();
        setShowRegenerateBackupCodes(true);
        setRegeneratePasswordError("");
        toast.success(t("two_factor_authentication_backup_codes_regenerated"));
      },
      onError: (error: HTTPError) => {
        const errors = error.cause as StructuredError;
        const errorMessage =
          errors?.password?.[0] ||
          t("two_factor_authentication_backup_codes_error");
        setRegeneratePasswordError(errorMessage);
      },
    });

  // Update local state when MFA status changes
  useEffect(() => {
    if (!userData.mfa_enabled) {
      // Close all dialogs if MFA is not enabled
      closePasswordDialog();
      closeSetupDialog();
      closeRegenerateConfirm();
      closeBackupCodes();
      closeDisableDialog();
    }
  }, [userData.mfa_enabled]);

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t("two_factor_authentication")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!userData.mfa_enabled ? (
              <>
                <p className="text-sm text-gray-700">
                  {t("two_factor_authentication_not_active")}
                </p>
                <Button
                  onClick={handleSetup}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  disabled={isSettingUp}
                >
                  {isSettingUp ? (
                    <>
                      <CareIcon
                        icon="l-spinner"
                        className="mr-2 size-4 animate-spin"
                      />
                    </>
                  ) : (
                    t("two_factor_authentication_enable")
                  )}
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-700">
                  {t("two_factor_authentication_active")}
                </p>
                <div className="flex flex-col md:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={() => openRegenerateConfirm()}
                    disabled={isRegenerating}
                    className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 w-auto"
                  >
                    {isRegenerating ? (
                      <>
                        <CareIcon
                          icon="l-spinner"
                          className="mr-2 size-4 animate-spin"
                        />
                        <span>{t("regenerating")}</span>
                      </>
                    ) : (
                      <>
                        <CareIcon icon="l-refresh" className="mr-2 size-4" />
                        {t("two_factor_authentication_regenerating_codes")}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => openDisableDialog()}
                    className="hover:bg-red-600 w-auto"
                  >
                    <CareIcon icon="l-shield" className="mr-2 size-4" />
                    {t("two_factor_authentication_disable")}
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Password Dialog for Setup */}
      <PasswordDialog
        open={showPasswordDialog}
        onOpenChange={closePasswordDialog}
        onSubmit={(password) => setupTOTP({ password })}
        title={t("confirm_password")}
        description={t("please_enter_current_password")}
        error={setupPasswordError}
        isLoading={isSettingUp}
        buttonText={t("continue")}
        buttonClassName="bg-emerald-600 hover:bg-emerald-700"
      />

      {/* TOTP Setup Dialog */}
      {setupData && (
        <TOTPSetupDialog
          open={showSetupDialog}
          onOpenChange={closeSetupDialog}
          setupData={setupData}
          onVerify={(code) => verifyTOTP({ code })}
          verificationError={verificationError}
          isVerifying={isVerifying}
        />
      )}

      {/* Backup Codes Display Dialog */}
      <BackupCodesDialog
        open={showBackupCodes || showRegenerateBackupCodes}
        onOpenChange={(open) => {
          if (!open) {
            closeBackupCodes();
            setShowRegenerateBackupCodes(false);
          }
        }}
        backupCodes={backupCodes}
        showRegenerateBackupCodes={showRegenerateBackupCodes}
      />

      {/* Password Dialog for Disable */}
      <PasswordDialog
        open={showDisableDialog}
        onOpenChange={closeDisableDialog}
        onSubmit={(password) => disableTOTP({ password })}
        title={t("disable_two_factor_authentication")}
        description={t("disable_2fa_confirmation")}
        error={disableError}
        isLoading={isDisabling}
        buttonText={t("confirm")}
        icon={
          <CareIcon
            icon="l-exclamation-triangle"
            className="text-orange-500 size-5"
          />
        }
        buttonVariant="destructive"
      />

      {/* Password Dialog for Regenerate */}
      <PasswordDialog
        open={showRegenerateConfirm}
        onOpenChange={closeRegenerateConfirm}
        onSubmit={(password) => regenerateBackupCodes({ password })}
        title={t("regenerate_backup_codes")}
        description={t("regenerate_backup_codes_warning")}
        error={regeneratePasswordError}
        isLoading={isRegenerating}
        buttonText={t("regenerate")}
        icon={<CareIcon icon="l-refresh" className="text-primary-500 size-5" />}
        buttonVariant="destructive"
      />
    </>
  );
};
