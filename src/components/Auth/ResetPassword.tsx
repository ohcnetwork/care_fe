import { useMutation, useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/input-password";

import { ValidationHelper } from "@/components/Users/UserFormValidations";

import { LocalStorageKeys } from "@/common/constants";
import { validatePassword } from "@/common/validation";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import authApi from "@/types/auth/authApi";

interface ResetPasswordProps {
  token: string;
}

const ResetPassword = (props: ResetPasswordProps) => {
  const initForm: any = {
    password: "",
    confirm: "",
  };

  const initErr: any = {};
  const [form, setForm] = useState(initForm);
  const [errors, setErrors] = useState(initErr);
  const [isPasswordFieldFocused, setIsPasswordFieldFocused] = useState(false);

  const { t } = useTranslation();
  const handleChange = (e: any) => {
    const { value, name } = e.target;
    const fieldValue = Object.assign({}, form);
    const errorField = Object.assign({}, errors);
    if (errorField[name]) {
      errorField[name] = null;
      setErrors(errorField);
    }
    fieldValue[name] = value;
    setForm(fieldValue);
  };

  const validateData = () => {
    let hasError = false;
    const err = Object.assign({}, errors);
    if (form.password !== form.confirm) {
      hasError = true;
      err.confirm = t("password_mismatch");
    }

    if (!validatePassword(form.password)) {
      hasError = true;
      err.password = t("invalid_password");
    }

    Object.keys(form).forEach((key) => {
      if (!form[key]) {
        hasError = true;
        err[key] = t("field_required");
      }
    });
    if (hasError) {
      setErrors(err);
      return false;
    } else {
      setErrors({});
    }
    return form;
  };
  const { mutate: resetPassword } = useMutation({
    mutationFn: mutate(authApi.resetPassword),
    onSuccess: () => {
      localStorage.removeItem(LocalStorageKeys.accessToken);
      toast.success(t("password_reset_success"));
      navigate("/login");
    },
    onError: (error) => {
      if (error.cause) {
        setErrors(error.cause);
      }
    },
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const valid = validateData();
    if (valid) {
      valid.token = props.token;
      resetPassword(valid);
    }
  };

  const { isError } = useQuery({
    queryKey: ["checkResetToken", { token: props.token }],
    queryFn: query(authApi.checkResetToken, { body: { token: props.token } }),
    enabled: !!props.token,
  });

  if (isError) navigate("/invalid-reset");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        className="w-full max-w-md mx-auto rounded-lg bg-white shadow-lg p-6"
        onSubmit={(e) => {
          handleSubmit(e);
        }}
      >
        <div className="py-4 text-center text-xl font-bold">
          {t("reset_password")}
        </div>

        <div className="space-y-6">
          <div>
            <PasswordInput
              name="password"
              placeholder={t("new_password")}
              onChange={handleChange}
              onFocus={() => setIsPasswordFieldFocused(true)}
              onBlur={() => setIsPasswordFieldFocused(false)}
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
                  isInputEmpty={!form.password}
                  successMessage={t("password_success_message")}
                  validations={[
                    {
                      description: "password_length_validation",
                      fulfilled: form.password?.length >= 8,
                    },
                    {
                      description: "password_lowercase_validation",
                      fulfilled: /[a-z]/.test(form.password),
                    },
                    {
                      description: "password_uppercase_validation",
                      fulfilled: /[A-Z]/.test(form.password),
                    },
                    {
                      description: "password_number_validation",
                      fulfilled: /\d/.test(form.password),
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
              onChange={handleChange}
            />
            {errors.confirm && (
              <div className="mt-1 text-red-500 text-xs" data-input-error>
                {errors.confirm}
              </div>
            )}
          </div>
        </div>

        <div className="grid p-4 sm:flex sm:justify-between gap-4 mt-6">
          <Button
            variant="outline"
            type="button"
            onClick={() => navigate("/login")}
            className="w-full sm:w-auto"
          >
            <span>{t("cancel")}</span>
          </Button>
          <Button
            variant="primary"
            type="submit"
            onClick={(e) => handleSubmit(e)}
            className="w-full sm:w-auto"
          >
            <span>{t("reset")}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
