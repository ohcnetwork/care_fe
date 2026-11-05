import { useMutation } from "@tanstack/react-query";
import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

import { AuthCard } from "@/components/Auth/AuthCard";
import { AuthFormFallback } from "@/components/Auth/AuthFormFallback";

import mutate from "@/Utils/request/mutate";
import authApi from "@/types/auth/authApi";

// Phone reset pulls in the phone input (libphonenumber, country flags), so it
// is only fetched once the user asks for it.
const loadForgotPasswordPhone = () =>
  import("@/components/Auth/ForgotPasswordPhone");
const ForgotPasswordPhone = lazy(() =>
  loadForgotPasswordPhone().then((m) => ({ default: m.ForgotPasswordPhone })),
);
// Best-effort warm-up on hover/focus; `lazy()` retries the import on render.
const prefetchForgotPasswordPhone = () => {
  loadForgotPasswordPhone().catch(() => {});
};

interface ForgotPasswordProps {
  username: string;
  onUsernameChange: (username: string) => void;
  onBack: () => void;
}

export function ForgotPassword({
  username,
  onUsernameChange,
  onBack,
}: ForgotPasswordProps) {
  const { t } = useTranslation();
  const [usePhone, setUsePhone] = useState(false);
  const [error, setError] = useState("");

  const { mutate: sendResetLink, isPending } = useMutation({
    mutationFn: mutate(authApi.forgotPassword),
    onSuccess: () => toast.success(t("password_sent")),
  });

  if (usePhone) {
    return (
      <Suspense
        fallback={
          <AuthFormFallback
            back={{
              label: t("back_to_email_reset"),
              onClick: () => setUsePhone(false),
            }}
            title={t("reset_using_phone_number")}
            description={t("forget_password_phone_instruction")}
          />
        }
      >
        <ForgotPasswordPhone
          onBackToEmail={() => setUsePhone(false)}
          onSuccess={onBack}
        />
      </Suspense>
    );
  }

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/\w/.test(username)) {
      setError(t("field_required"));
      return;
    }
    sendResetLink({ username });
  };

  return (
    <AuthCard
      back={{ label: t("back_to_login"), onClick: onBack }}
      title={t("forget_password")}
      description={t("forget_password_instruction")}
    >
      <form noValidate className="grid gap-6" onSubmit={handleSubmit}>
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor="forgot-username">{t("username")}</FieldLabel>
          <Input
            id="forgot-username"
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
            required
            placeholder={t("enter_your_username")}
            value={username}
            onChange={(event) => {
              onUsernameChange(event.target.value.toLowerCase());
              setError("");
            }}
            aria-invalid={!!error}
            aria-describedby={error ? "forgot-username-error" : undefined}
          />
          {error && <FieldError id="forgot-username-error">{error}</FieldError>}
        </Field>
        <Button type="submit" disabled={isPending}>
          {isPending && <Spinner data-icon="inline-start" aria-hidden="true" />}
          {t("send_reset_link")}
        </Button>
      </form>
      <div className="flex flex-col items-center gap-1 pb-2">
        <p className="text-sm text-muted-foreground">
          {t("cant_access_email")}
        </p>
        <Button
          type="button"
          variant="link"
          onPointerEnter={prefetchForgotPasswordPhone}
          onFocus={prefetchForgotPasswordPhone}
          onClick={() => setUsePhone(true)}
        >
          {t("reset_using_phone_number")}
        </Button>
      </div>
    </AuthCard>
  );
}
