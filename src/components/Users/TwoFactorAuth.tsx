import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { userChildProps } from "@/components/Common/UserColumns";

import mutate from "@/Utils/request/mutate";
import { HTTPError, StructuredError } from "@/Utils/request/types";
import authApi from "@/types/auth/authApi";
import { TOTPSetupResponse, TOTPVerifyResponse } from "@/types/auth/otp";

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (password: string) => void;
  title: string;
  description: string;
  error?: string;
  isLoading?: boolean;
  buttonText: string;
  icon?: React.ReactNode;
  buttonVariant?: "default" | "destructive" | "outline";
  buttonClassName?: string;
}

function PasswordDialog({
  open,
  onOpenChange,
  onSubmit,
  title,
  description,
  error,
  isLoading,
  buttonText,
  icon,
  buttonVariant = "default",
  buttonClassName,
}: PasswordDialogProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(password);
  };

  // Reset password when dialog closes
  useEffect(() => {
    if (!open) {
      setPassword("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[93%] rounded-md ">
        <DialogHeader>
          {icon ? (
            <div className="flex items-center gap-2">
              {icon}
              <DialogTitle>{title}</DialogTitle>
            </div>
          ) : (
            <DialogTitle>{title}</DialogTitle>
          )}
          <DialogDescription className="text-start">
            {description}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("password")}</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </div>
          <DialogFooter className="flex items-end mt-4">
            <Button
              type="submit"
              variant={buttonVariant}
              disabled={isLoading || !password}
              className={buttonClassName}
            >
              {isLoading ? (
                <>
                  <CareIcon
                    icon="l-spinner"
                    className="mr-2 h-4 w-4 animate-spin"
                  />
                </>
              ) : (
                buttonText
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export const TwoFactorAuth = ({ userData }: userChildProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [setupData, setSetupData] = useState<TOTPSetupResponse | null>(null);
  const [showRegenerateBackupCodes, setShowRegenerateBackupCodes] =
    useState(false);
  const [setupPasswordError, setSetupPasswordError] = useState("");
  const [disableError, setDisableError] = useState("");
  const [regeneratePasswordError, setRegeneratePasswordError] = useState("");

  const handleSetup = () => {
    setShowPasswordDialog(true);
  };

  const { mutate: setupTOTP, isPending: isSettingUp } = useMutation({
    mutationFn: mutate(authApi.totp.setup),
    onSuccess: (data: TOTPSetupResponse) => {
      setSetupData(data);
      setShowPasswordDialog(false);
      setShowSetupDialog(true);
      setSetupPasswordError("");
      queryClient.invalidateQueries({ queryKey: ["getUserDetails"] });
    },
    onError: (error: HTTPError) => {
      const errors = error.cause as StructuredError;

      // Check for already enabled MFA
      const isAlreadyEnabled =
        (error.cause &&
          typeof error.cause === "object" &&
          "errors" in error.cause &&
          Array.isArray((error.cause as any).errors) &&
          (error.cause as any).errors.some(
            (err: any) =>
              err.type === "validation_error" &&
              err.msg?.includes("already enabled"),
          )) ||
        error.status === 403 ||
        (errors?.detail &&
          typeof errors.detail === "string" &&
          errors.detail.includes("already enabled"));

      if (isAlreadyEnabled) {
        setShowPasswordDialog(false);
        queryClient.invalidateQueries({ queryKey: ["getUserDetails"] });
        return;
      }

      // Handle other errors
      const errorMessage =
        errors?.password?.[0] ||
        errors?.detail?.[0] ||
        errors?.message?.[0] ||
        t("two_factor_authentication_setup_error");
      setSetupPasswordError(errorMessage);
    },
  });

  const { mutate: verifyTOTP, isPending: isVerifying } = useMutation({
    mutationFn: mutate(authApi.totp.verify),
    onSuccess: (data: TOTPVerifyResponse) => {
      if (data.backup_codes && Array.isArray(data.backup_codes)) {
        setSetupData((prev) =>
          prev
            ? { ...prev, backup_codes: data.backup_codes }
            : { uri: "", secret_key: "", backup_codes: data.backup_codes },
        );
        setShowSetupDialog(false);
        setShowBackupCodes(true);
        setVerificationCode("");
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
      setShowDisableDialog(false);
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
        setSetupData({
          backup_codes: data.backup_codes,
          secret_key: "",
          uri: "",
        });
        setShowRegenerateConfirm(false);
        setShowRegenerateBackupCodes(true);
        setRegeneratePasswordError("");
        toast.success(t("two_factor_authentication_backup_codes_regenerated"));
      },
      onError: (error: HTTPError) => {
        const errors = error.cause as StructuredError;

        // Check if MFA is not enabled
        const isMFANotEnabled =
          error.status === 400 ||
          (errors?.detail &&
            typeof errors.detail === "string" &&
            errors.detail.includes("not enabled"));

        if (isMFANotEnabled) {
          setShowRegenerateConfirm(false);
          setRegeneratePasswordError("");
          queryClient.invalidateQueries({ queryKey: ["getUserDetails"] });
          return;
        }

        const errorMessage =
          errors?.password?.[0] ||
          t("two_factor_authentication_backup_codes_error");
        setRegeneratePasswordError(errorMessage);
      },
    });

  const handleVerify = () => {
    setVerificationError("");
    verifyTOTP({ code: verificationCode });
  };

  const handleCopyKey = () => {
    if (setupData?.secret_key) {
      navigator.clipboard.writeText(setupData.secret_key);
      toast.success(t("secret_key_copied"));
    }
  };

  const handleCopyBackupCodes = () => {
    if (setupData?.backup_codes) {
      navigator.clipboard.writeText(setupData.backup_codes.join("\n"));
      toast.success(t("backup_codes_copied"));
    }
  };

  const handleDownloadBackupCodes = () => {
    if (setupData?.backup_codes) {
      const element = document.createElement("a");
      const file = new Blob([setupData.backup_codes.join("\n")], {
        type: "text/plain",
      });
      element.href = URL.createObjectURL(file);
      element.download = "backup-codes.txt";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const handlePrintBackupCodes = () => {
    if (setupData?.backup_codes) {
      const printWindow = window.open("", "", "height=600,width=800");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${t("2FA_backup_code")}</title>
              <style>
                body { font-family: system-ui; padding: 2rem; }
                .code { font-family: monospace; margin: 0.5rem 0; }
              </style>
            </head>
            <body>
              <h1>${t("two_factor_authentication_backup_codes")}</h1>
              <p>${t("keep_code_safe")}</p>
              ${setupData.backup_codes.map((code) => `<div class="code">${code}</div>`).join("")}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  // Update local state when MFA status changes
  useEffect(() => {
    if (!userData.mfa_enabled) {
      // Close all dialogs if MFA is not enabled
      setShowPasswordDialog(false);
      setShowSetupDialog(false);
      setShowRegenerateConfirm(false);
      setShowRegenerateBackupCodes(false);
      setShowDisableDialog(false);
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
                        className="mr-2 h-4 w-4 animate-spin"
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
                    onClick={() => setShowRegenerateConfirm(true)}
                    disabled={isRegenerating}
                    className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 w-auto"
                  >
                    {isRegenerating ? (
                      <>
                        <CareIcon
                          icon="l-spinner"
                          className="mr-2 h-4 w-4 animate-spin"
                        />
                        <span>{t("regenerating")}</span>
                      </>
                    ) : (
                      <>
                        <CareIcon icon="l-refresh" className="mr-2 h-4 w-4" />
                        {t("two_factor_authentication_regenerating_codes")}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDisableDialog(true)}
                    className="hover:bg-red-600 w-auto"
                  >
                    <CareIcon icon="l-shield" className="mr-2 h-4 w-4" />
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
        onOpenChange={setShowPasswordDialog}
        onSubmit={(password) => setupTOTP({ password })}
        title={t("confirm_password")}
        description={t("please_enter_current_password")}
        error={setupPasswordError}
        isLoading={isSettingUp}
        buttonText={t("continue")}
        buttonClassName="bg-emerald-600 hover:bg-emerald-700"
      />

      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="max-w-md w-[93%] rounded-md ">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-primary-800">
              {t("two_factor_authentication")}
            </DialogTitle>
            <DialogDescription>
              {t("two_factor_authentication_setup_description")}
            </DialogDescription>
          </DialogHeader>
          {setupData && (
            <div className="space-y-4">
              <div className="flex items-center gap-8">
                {setupData.uri && (
                  <div className="flex-shrink-0">
                    <QRCodeSVG
                      value={setupData.uri}
                      size={128}
                      className="p-2 rounded"
                      fgColor="#0F6657"
                    />
                  </div>
                )}
                <div className="flex flex-col space-y-2">
                  <p className="text-lg font-semibold">{t("scan_qr")}</p>
                  <p className="text-sm text-gray-500">
                    {t("use_authenticator_app")}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-500">
                    <Trans
                      i18nKey="cant_scan_copy_key"
                      components={{
                        strong: <strong />,
                        CareIcon: (
                          <CareIcon icon="l-copy" className="h-4 w-4 mr-1" />
                        ),
                      }}
                    />
                  </p>
                </div>

                <div
                  className="p-2 bg-indigo-50 rounded flex items-center justify-between cursor-pointer"
                  onClick={handleCopyKey}
                >
                  <code className="text-indigo-600 text-sm select-all">
                    {setupData.secret_key}
                  </code>
                  <CareIcon icon="l-copy" className="h-4 w-4 text-gray-500" />
                </div>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!isVerifying && verificationCode) {
                    handleVerify();
                  }
                }}
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("enter_verification_code")}
                  </label>
                  <Input
                    value={verificationCode}
                    onChange={(e) => {
                      setVerificationCode(e.target.value);
                      setVerificationError("");
                    }}
                    placeholder="XXXXX"
                    maxLength={6}
                    pattern="\d*"
                    inputMode="numeric"
                    className="tracking-[0.1em] placeholder:text-gray-500/50"
                  />
                  {verificationError && (
                    <p className="text-sm text-red-500">{verificationError}</p>
                  )}
                </div>
                <DialogFooter className="mt-4">
                  <Button
                    type="submit"
                    disabled={isVerifying || !verificationCode}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isVerifying ? (
                      <>
                        <CareIcon
                          icon="l-spinner"
                          className="mr-2 h-4 w-4 animate-spin"
                        />
                        {t("verifying")}
                      </>
                    ) : (
                      t("verify_code")
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Backup Codes Display Dialog - Used for both initial setup and regeneration */}
      <Dialog
        open={showBackupCodes || showRegenerateBackupCodes}
        onOpenChange={(open) => {
          if (!open) {
            setShowBackupCodes(false);
            setShowRegenerateBackupCodes(false);
          }
        }}
      >
        <DialogContent className="max-w-md w-[93%] rounded-md">
          <DialogHeader>
            {showBackupCodes ? (
              <div className="flex items-center space-x-2">
                <div>
                  <DialogTitle className="text-2xl font-bold text-primary-800">
                    {t("two_factor_authentication_enabled")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("backup_codes_description")}
                  </DialogDescription>
                </div>
              </div>
            ) : (
              <>
                <DialogTitle className="text-2xl font-bold text-primary-800">
                  {t("new_backup_codes")}
                </DialogTitle>
                <DialogDescription>
                  {t("backup_codes_description")}
                </DialogDescription>
              </>
            )}
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-2">
                {setupData?.backup_codes?.map((code, index) => (
                  <code key={index} className="font-mono text-sm">
                    {code}
                  </code>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleCopyBackupCodes}
                className="flex-1"
              >
                <CareIcon icon="l-copy" className="mr-2 h-4 w-4" />
                {t("copy")}
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadBackupCodes}
                className="flex-1"
              >
                <CareIcon
                  icon="l-file-download"
                  className="h-4 w-4 text-gray-500"
                />
                {t("download")}
              </Button>
              <Button
                variant="outline"
                onClick={handlePrintBackupCodes}
                className="flex-1"
              >
                <CareIcon icon="l-print" className="h-4 w-4 text-gray-500" />
                {t("print")}
              </Button>
            </div>
            <p className="text-sm text-red-500">
              {showRegenerateBackupCodes ? t("backup_codes_warning") : t("")}
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowBackupCodes(false);
                setShowRegenerateBackupCodes(false);
              }}
              className="w-full"
            >
              {t("done")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Dialog for Disable */}
      <PasswordDialog
        open={showDisableDialog}
        onOpenChange={setShowDisableDialog}
        onSubmit={(password) => disableTOTP({ password })}
        title={t("disable_two_factor_authentication")}
        description={t("disable_2fa_confirmation")}
        error={disableError}
        isLoading={isDisabling}
        buttonText={t("confirm")}
        icon={
          <CareIcon
            icon="l-exclamation-triangle"
            className="text-orange-500 w-5 h-5"
          />
        }
        buttonVariant="destructive"
      />

      {/* Password Dialog for Regenerate */}
      <PasswordDialog
        open={showRegenerateConfirm}
        onOpenChange={setShowRegenerateConfirm}
        onSubmit={(password) => regenerateBackupCodes({ password })}
        title={t("regenerate_backup_codes")}
        description={t("regenerate_backup_codes_warning")}
        error={regeneratePasswordError}
        isLoading={isRegenerating}
        buttonText={t("regenerate")}
        icon={
          <CareIcon icon="l-refresh" className="text-primary-500 w-5 h-5" />
        }
        buttonVariant="destructive"
      />
    </>
  );
};
