import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Cancel, Submit } from "@/components/Common/ButtonV2";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import { validateRule } from "@/components/Users/UserAdd";

import { LocalStorageKeys } from "@/common/constants";
import { validatePassword } from "@/common/validation";

import * as Notification from "@/Utils/Notifications";
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
    const { value, name } = e;
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
        Notification.Success({
          msg: t("password_reset_success"),
        });
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
    <div className="py-10 md:py-40">
      <div>
        <div>
          <form
            className="mx-auto max-w-xl rounded-lg bg-white shadow"
            onSubmit={(e) => {
              handleSubmit(e);
            }}
          >
            <div className="py-4 text-center text-xl font-bold">
              {t("reset_password")}
            </div>
            <div className="px-4">
              <TextFormField
                type="password"
                name="password"
                placeholder={t("new_password")}
                onChange={handleChange}
                error={errors.password}
                onFocus={() => setPasswordInputInFocus(true)}
                onBlur={() => setPasswordInputInFocus(false)}
              />
              {passwordInputInFocus && (
                <div className="text-small mb-2 pl-2 text-secondary-500">
                  {validateRule(
                    form.password?.length >= 8,
                    "Password should be atleast 8 characters long",
                    !form.password,
                  )}
                  {validateRule(
                    form.password !== form.password.toUpperCase(),
                    "Password should contain at least 1 lowercase letter",
                    !form.password,
                  )}
                  {validateRule(
                    form.password !== form.password.toLowerCase(),
                    "Password should contain at least 1 uppercase letter",
                    !form.password,
                  )}
                  {validateRule(
                    /\d/.test(form.password),
                    "Password should contain at least 1 number",
                    !form.password,
                  )}
                </div>
              )}
              <TextFormField
                type="password"
                name="confirm"
                placeholder={t("confirm_password")}
                onChange={handleChange}
                error={errors.confirm}
                onFocus={() => setConfirmPasswordInputInFocus(true)}
                onBlur={() => setConfirmPasswordInputInFocus(false)}
              />
              {confirmPasswordInputInFocus &&
                form.confirm.length > 0 &&
                form.password.length > 0 &&
                validateRule(
                  form.confirm === form.password,
                  "Confirm password should match the entered password",
                  !form.password && form.password.length > 0,
                )}
            </div>
            <div className="grid p-4 sm:flex sm:justify-between">
              <Cancel onClick={() => navigate("/login")} />
              <Submit onClick={(e) => handleSubmit(e)} label="reset" />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
