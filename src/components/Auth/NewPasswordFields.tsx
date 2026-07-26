import { useTranslation } from "react-i18next";

import { PasswordInput } from "@/components/ui/input-password";

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

  return (
    <div className="space-y-6">
      <div>
        <PasswordInput
          name="password"
          placeholder={t("new_password")}
          value={password}
          onChange={onChange}
          onFocus={() => onPasswordFocusChange(true)}
          onBlur={() => onPasswordFocusChange(false)}
        />
        {errors.password && (
          <div className="mt-1 text-red-500 text-xs" data-input-error>
            {errors.password}
          </div>
        )}
        {isPasswordFieldFocused && (
          <div
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

      <div>
        <PasswordInput
          name="confirm"
          placeholder={t("confirm_password")}
          value={confirm}
          onChange={onChange}
        />
        {errors.confirm && (
          <div className="mt-1 text-red-500 text-xs" data-input-error>
            {errors.confirm}
          </div>
        )}
      </div>
    </div>
  );
}
