import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/input-password";

import { validateRule } from "@/components/Users/UserFormValidations";

import { LocalStorageKeys } from "@/common/constants";
import { validatePassword } from "@/common/validation";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";

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
  const [passwordInputInFocus, setPasswordInputInFocus] = useState(false);
  const [confirmPasswordInputInFocus, setConfirmPasswordInputInFocus] =
    useState(false);

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

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const valid = validateData();
    if (valid) {
      valid.token = props.token;
      const { res, error } = await request(routes.resetPassword, {
        body: { ...valid },
      });
      if (res?.ok) {
        localStorage.removeItem(LocalStorageKeys.accessToken);
        toast.success(t("password_reset_success"));
        navigate("/login");
      } else if (res && error) {
        setErrors(error);
      }
    }
  };

  useEffect(() => {
    const checkResetToken = async () => {
      const { res } = await request(routes.checkResetToken, {
        body: { token: props.token },
      });
      if (!res || !res.ok) {
        navigate("/invalid-reset");
      }
    };
    if (props.token) {
      checkResetToken();
    } else {
      navigate("/invalid-reset");
    }
  }, []);

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
              onFocus={() => setPasswordInputInFocus(true)}
              onBlur={() => setPasswordInputInFocus(false)}
            />
            {errors.password && (
              <div className="mt-1 text-red-500 text-xs" data-input-error>
                {errors.password}
              </div>
            )}
            {passwordInputInFocus && (
              <div className="text-sm mt-2 pl-2 text-secondary-500">
                {validateRule(
                  form.password?.length >= 8,
                  t("password_length_validation"),
                  !form.password,
                  t("password_length_met"),
                )}
                {validateRule(
                  form.password !== form.password.toUpperCase(),
                  t("password_lowercase_validation"),
                  !form.password,
                  t("password_lowercase_met"),
                )}
                {validateRule(
                  form.password !== form.password.toLowerCase(),
                  t("password_uppercase_validation"),
                  !form.password,
                  t("password_uppercase_met"),
                )}
                {validateRule(
                  /\d/.test(form.password),
                  t("password_number_validation"),
                  !form.password,
                  t("password_number_met"),
                )}
              </div>
            )}
          </div>

          <div>
            <PasswordInput
              name="confirm"
              placeholder={t("confirm_password")}
              onChange={handleChange}
              onFocus={() => setConfirmPasswordInputInFocus(true)}
              onBlur={() => setConfirmPasswordInputInFocus(false)}
            />
            {errors.confirm && (
              <div className="mt-1 text-red-500 text-xs" data-input-error>
                {errors.confirm}
              </div>
            )}
            {confirmPasswordInputInFocus &&
              form.confirm.length > 0 &&
              form.password.length > 0 &&
              validateRule(
                form.confirm === form.password,
                t("password_mismatch"),
                !form.password && form.password.length > 0,
                t("password_match"),
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
