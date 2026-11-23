import { useTranslation } from "react-i18next";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/input-password";

import { ValidationHelper } from "@/components/Users/UserFormValidations";

import { validatePassword } from "@/common/validation";

export interface PasswordFormValues {
  password: string;
  confirm: string;
}

export interface PasswordErrors {
  password?: string | null;
  confirm?: string | null;
}

interface PasswordFieldsProps {
  password: string;
  confirm: string;
  errors: PasswordErrors;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isPasswordFieldFocused: boolean;
  onPasswordFocusChange: (focused: boolean) => void;
}

export function validatePasswordFields(
  form: PasswordFormValues,
  t: (key: string) => string,
): PasswordErrors | null {
  const err: PasswordErrors = {};
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

export function PasswordFields({
  password,
  confirm,
  errors,
  onChange,
  isPasswordFieldFocused,
  onPasswordFocusChange,
}: PasswordFieldsProps) {
  const { t } = useTranslation();
  const passwordErrorId = "new-password-error";
  const confirmErrorId = "confirm-password-error";
  const passwordHintsId = "new-password-hints";

  return (
    <>
      <Field data-invalid={!!errors.password}>
        <FieldLabel htmlFor="new-password">{t("new_password")}</FieldLabel>
        <PasswordInput
          id="new-password"
          name="password"
          autoComplete="new-password"
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
          <FieldError id={passwordErrorId}>{errors.password}</FieldError>
        )}
        {isPasswordFieldFocused && (
          <div id={passwordHintsId} className="pl-2" aria-live="polite">
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
      </Field>

      <Field data-invalid={!!errors.confirm}>
        <FieldLabel htmlFor="confirm-password">
          {t("confirm_password")}
        </FieldLabel>
        <PasswordInput
          id="confirm-password"
          name="confirm"
          autoComplete="new-password"
          placeholder={t("confirm_password")}
          value={confirm}
          onChange={onChange}
          aria-invalid={!!errors.confirm}
          aria-describedby={errors.confirm ? confirmErrorId : undefined}
        />
        {errors.confirm && (
          <FieldError id={confirmErrorId}>{errors.confirm}</FieldError>
        )}
      </Field>
    </>
  );
}
