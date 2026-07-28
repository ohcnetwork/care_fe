import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { ForgotPasswordPhone } from "@/components/Auth/ForgotPasswordPhone";
import CircularProgress from "@/components/Common/CircularProgress";

type ForgotMethod = "email" | "phone";

interface ForgotPasswordPanelProps {
  username: string;
  usernameError?: string | null;
  onUsernameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmitEmail: (e: React.SubmitEvent<HTMLFormElement>) => void;
  onBackToLogin: () => void;
  isSubmitting: boolean;
}

export function ForgotPasswordPanel({
  username,
  usernameError,
  onUsernameChange,
  onSubmitEmail,
  onBackToLogin,
  isSubmitting,
}: ForgotPasswordPanelProps) {
  const { t } = useTranslation();
  const [forgotMethod, setForgotMethod] = useState<ForgotMethod>("email");

  if (forgotMethod === "phone") {
    return (
      <ForgotPasswordPhone
        onBackToEmail={() => setForgotMethod("email")}
        onSuccess={onBackToLogin}
      />
    );
  }

  return (
    <form onSubmit={onSubmitEmail} className="space-y-4">
      <Button
        variant="link"
        type="button"
        onClick={onBackToLogin}
        className="px-0 mb-4 flex items-center gap-2"
      >
        <CareIcon icon="l-arrow-left" className="text-lg" />
        <span>{t("back_to_login")}</span>
      </Button>

      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {t("forget_password")}
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            {t("forget_password_instruction")}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="forgot_username">{t("username")}</Label>
          <Input
            id="forgot_username"
            name="username"
            type="text"
            value={username}
            onChange={onUsernameChange}
            placeholder={t("enter_your_username")}
            className={cn(
              usernameError && "border-red-500 focus-visible:ring-red-500",
            )}
          />
          {usernameError && (
            <p className="text-sm text-red-500">{t(usernameError)}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <CircularProgress className="text-white" />
          ) : (
            t("send_reset_link")
          )}
        </Button>

        <div className="mt-5 text-center">
          <p className="text-sm text-gray-500 font-base">
            {t("cant_access_email")}
          </p>
          <Button
            variant="link"
            type="button"
            onClick={() => setForgotMethod("phone")}
            className="h-auto p-0 text-sm font-medium text-primary-500 hover:underline"
          >
            {t("reset_using_phone_number")}
          </Button>
        </div>
      </div>
    </form>
  );
}
