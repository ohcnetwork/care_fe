import { zodResolver } from "@hookform/resolvers/zod";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Spinner } from "@/components/ui/spinner";

import { AuthCard } from "@/components/Auth/AuthCard";
import { AuthLayout } from "@/components/Auth/AuthLayout";

import { useAuthContext } from "@/hooks/useAuthUser";

import { HTTPError } from "@/Utils/request/types";
import { MfaMethod, MfaOption } from "@/types/auth/auth";

export const Authenticate = () => {
  const { t } = useTranslation();
  const [error, setError] = useState<string>("");
  const [currentMethod, setCurrentMethod] = useState<MfaMethod>("totp");
  const { verifyMFA, isVerifyingMFA } = useAuthContext();

  // Available MFA methods configuration
  const mfaOptions: MfaOption[] = [
    {
      id: "totp",
      label: t("use_auth_app"),
    },
    {
      id: "backup",
      label: t("use_backup_code"),
    },
    // Add more methods here as we make them available
  ];

  // Form validation schema
  const formSchema = z.object({
    code: z.string(),
  });

  // Initialize form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
    },
    mode: "onChange",
  });

  const codeValue = form.watch("code");

  // Get temp token from localStorage
  const temp_token = localStorage.getItem("mfa_temp_token");

  useEffect(() => {
    if (!temp_token) {
      navigate("/login");
    }
  }, [temp_token]);

  // Handle form submission
  const handleSubmit = form.handleSubmit(async (values) => {
    if (!temp_token) {
      setError(t("session_expired"));
      navigate("/login");
      return;
    }

    try {
      await verifyMFA({
        method: currentMethod,
        code: values.code,
        temp_token,
      });
    } catch (err) {
      if (err instanceof HTTPError && typeof err.cause?.detail === "string") {
        setError(err.cause.detail);
      }
    }
  });

  // Get available alternative methods based on current method
  const alternativeMethods = mfaOptions.filter(
    (option) => option.id !== currentMethod,
  );

  // Handle method change
  const handleMethodChange = (method: MfaMethod) => {
    setCurrentMethod(method);
    form.reset();
    setError("");
  };

  const codeLength = currentMethod === "backup" ? 8 : 6;

  return (
    <AuthLayout>
      <AuthCard
        title={t("authenticate_your_account")}
        description={
          currentMethod === "backup"
            ? t("enter_recovery_code")
            : t("enter_2fa_code")
        }
      >
        <Form {...form}>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("code")}</FormLabel>
                  <FormControl>
                    <InputOTP
                      key={`otp-input-${currentMethod}`}
                      maxLength={codeLength}
                      pattern={REGEXP_ONLY_DIGITS}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pushPasswordManagerStrategy="none"
                      autoFocus
                      value={field.value}
                      onChange={field.onChange}
                      containerClassName="w-full"
                      className="w-full"
                    >
                      <InputOTPGroup className="w-full justify-between">
                        {Array.from({ length: codeLength }, (_, index) => (
                          <InputOTPSlot
                            key={index}
                            index={index}
                            className="h-12 min-w-0 flex-1 font-mono text-lg"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                </FormItem>
              )}
            />
            {error && <FieldError>{error}</FieldError>}
            <Button
              type="submit"
              disabled={isVerifyingMFA || codeValue.length < codeLength}
            >
              {isVerifyingMFA && (
                <Spinner data-icon="inline-start" aria-hidden="true" />
              )}
              {t("verify")}
            </Button>
          </form>
        </Form>

        <Alert variant="warning" role="note">
          <AlertDescription>{t("dont_share_code")}</AlertDescription>
        </Alert>

        <div className="flex flex-col items-center gap-1 pb-2">
          {currentMethod !== "backup" && (
            <p className="text-sm text-muted-foreground">
              {t("cant_access_code")}
            </p>
          )}
          {alternativeMethods.map((method) => (
            <Button
              key={method.id}
              type="button"
              variant="link"
              onClick={() => handleMethodChange(method.id)}
            >
              {method.label}
            </Button>
          ))}
        </div>
      </AuthCard>
    </AuthLayout>
  );
};
