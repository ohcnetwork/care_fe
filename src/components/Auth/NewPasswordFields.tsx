import { useTranslation } from "react-i18next";

import { PasswordInput } from "@/components/ui/input-password";
import { Label } from "@/components/ui/label";

import { ValidationHelper } from "@/components/Users/UserFormValidations";

import { validatePassword } from "@/common/validation";

export interface NewPasswordFormValues {
  password: string;
  confirm: string;
}

export interface NewPasswordErrors {
  password?: string | null;
  confirm?: string | null;
}

interface NewPasswordFieldsProps {
  password: string;
  confirm: string;
  errors: NewPasswordErrors;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isPasswordFieldFocused: boolean;
  onPasswordFocusChange: (focused: boolean) => void;
}

export function validateNewPasswordFields(
  form: NewPasswordFormValues,
  t: (key: string) => string,
): NewPasswordErrors | null {
  const err: NewPasswordErrors = {};
  let hasError = false;

  if (form.password !== form.confirm) {
    hasError = true;
    err.confirm = t("password_mismatch");
  }

  if (!validatePassword(form.password)) {
    hasError = true;
    err.password = t("invalid_password");
  }

  if (!form.password) {
    hasError = true;
    err.password = t("field_required");
  }

  if (!form.confirm) {
    hasError = true;
    err.confirm = t("field_required");
  }

  return hasError ? err : null;
}

export function NewPasswordFields({
  password,
  confirm,
  errors,
  onChange,
  isPasswordFieldFocused,
  onPasswordFocusChange,
}: NewPasswordFieldsProps) {
  const { t } = useTranslation();
  const passwordErrorId = "new-password-error";
  const confirmErrorId = "confirm-password-error";
  const passwordHintsId = "new-password-hints";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="new-password">{t("new_password")}</Label>
        <PasswordInput
          id="new-password"
          name="password"
          placeholder={t("new_password")}
          value={password}
          onChange={onChange}
          onFocus={() => onPasswordFocusChange(true)}
          onBlur={() => onPasswordFocusChange(false)}
          aria-invalid={!!errors.password}
          aria-describedby={
            [
              errors.password ? passwordErrorId : null,
              isPasswordFieldFocused ? passwordHintsId : null,
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />
        {errors.password && (
          <div
            id={passwordErrorId}
            className="mt-1 text-red-500 text-xs"
            data-input-error
            role="alert"
          >
            {errors.password}
          </div>
        )}
        {isPasswordFieldFocused && (
          <div
            id={passwordHintsId}
            className="text-small mt-2 pl-2 text-secondary-500"
            aria-live="polite"
          >
            <ValidationHelper
              isInputEmpty={!password}
              successMessage={t("password_success_message")}
              validations={[
                {
                  description: "password_length_validation",
                  fulfilled: password?.length >= 8,
                },
                {
                  description: "password_lowercase_validation",
                  fulfilled: /[a-z]/.test(password),
                },
                {
                  description: "password_uppercase_validation",
                  fulfilled: /[A-Z]/.test(password),
                },
                {
                  description: "password_number_validation",
                  fulfilled: /\d/.test(password),
                },
              ]}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">{t("confirm_password")}</Label>
        <PasswordInput
          id="confirm-password"
          name="confirm"
          placeholder={t("confirm_password")}
          value={confirm}
          onChange={onChange}
          aria-invalid={!!errors.confirm}
          aria-describedby={errors.confirm ? confirmErrorId : undefined}
        />
        {errors.confirm && (
          <div
            id={confirmErrorId}
            className="mt-1 text-red-500 text-xs"
            data-input-error
            role="alert"
          >
            {errors.confirm}
          </div>
        )}
      </div>
    </div>
  );
}
