import { REGEXP_ONLY_DIGITS } from "input-otp";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { TOTPSetupResponse } from "@/types/auth/otp";

interface TOTPSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setupData: TOTPSetupResponse;
  onVerify: (code: string) => void;
  verificationError?: string;
  isVerifying: boolean;
}

export function TOTPSetupDialog({
  open,
  onOpenChange,
  setupData,
  onVerify,
  verificationError,
  isVerifying,
}: TOTPSetupDialogProps) {
  const { t } = useTranslation();
  const [verificationCode, setVerificationCode] = useState("");
  const [showSecretKey, setShowSecretKey] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowSecretKey(false);
    }
  }, [open]);

  const handleCopyKey = () => {
    if (setupData?.secret_key) {
      navigator.clipboard.writeText(setupData.secret_key);
      toast.success(t("secret_key_copied"));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerifying && verificationCode) {
      onVerify(verificationCode);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95%] rounded-md">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-primary-800">
            {t("two_factor_authentication")}
          </DialogTitle>
          <DialogDescription>
            {t("two_factor_authentication_setup_description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 overflow-auto">
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
                    strong: (
                      <strong
                        className="cursor-pointer text-primary-600 hover:underline"
                        onClick={() => {
                          setShowSecretKey(true);
                          handleCopyKey();
                        }}
                      />
                    ),
                    CareIcon: (
                      <CareIcon icon="l-copy" className="h-4 w-4 mr-1" />
                    ),
                  }}
                />
              </p>
            </div>

            {showSecretKey && (
              <div
                className="p-2 bg-indigo-50 rounded flex items-center justify-between cursor-pointer"
                onClick={handleCopyKey}
              >
                <code className="text-indigo-600 text-sm select-all">
                  {setupData.secret_key}
                </code>
                <CareIcon icon="l-copy" className="h-4 w-4 text-gray-500" />
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-2 px-1">
              <label className="text-sm font-medium">
                {t("enter_verification_code")}
              </label>
              <InputOTP
                value={verificationCode}
                onChange={(value) => setVerificationCode(value)}
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                autoComplete="one-time-code"
              >
                <InputOTPGroup>
                  {[...Array(6)].map((_, index) => (
                    <InputOTPSlot key={index} index={index} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              {verificationError && (
                <p className="text-sm text-red-500">{verificationError}</p>
              )}
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="submit"
                disabled={isVerifying || verificationCode.length !== 6}
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
      </DialogContent>
    </Dialog>
  );
}
