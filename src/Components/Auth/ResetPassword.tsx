import { useEffect, useState } from "react";
import { ErrorHelperText } from "../Common/HelperInputFields";
import { useDispatch } from "react-redux";
import * as Notification from "../../Utils/Notifications.js";
import { postResetPassword, checkResetToken } from "../../Redux/actions";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";
import { LocalStorageKeys } from "../../Common/constants";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import TextFormField from "../Form/FormFields/TextFormField";
import CollapseV2 from "../Common/components/CollapseV2";

export const ResetPassword = (props: any) => {
  const dispatch: any = useDispatch();
  const initForm: any = {
    password: "",
    confirm: "",
  };

  const initErr: any = {};
  const [form, setForm] = useState(initForm);
  const [errors, setErrors] = useState(initErr);
  const [passReg, setPassReg] = useState(0);
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
    setPassReg(0);
    setForm(fieldValue);
  };

  const validateData = () => {
    let hasError = false;
    const err = Object.assign({}, errors);
    if (form.password !== form.confirm) {
      hasError = true;
      setPassReg(1);
      err.confirm = t("password_mismatch");
    }

    const regex = /^(?=.*[a-z]+)(?=.*[A-Z]+)(?=.*[0-9]+)(?=.*[!@#$%^&*]).{8,}$/;
    if (!regex.test(form.password)) {
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

  const handleSubmit = (e: any) => {
    e.preventDefault();
    const valid = validateData();
    if (valid) {
      valid.token = props.token;
      dispatch(postResetPassword(valid)).then((resp: any) => {
        const res = resp && resp.data;
        if (res && res.status === "OK") {
          localStorage.removeItem(LocalStorageKeys.accessToken);
          Notification.Success({
            msg: t("password_reset_success"),
          });
          navigate("/login");
        } else if (res && res.data) {
          setErrors(res.data);
        } else {
          Notification.Error({
            msg: t("password_reset_failure"),
          });
        }
      });
    }
  };

  useEffect(() => {
    if (props.token) {
      dispatch(checkResetToken({ token: props.token })).then((resp: any) => {
        const res = resp && resp.data;
        if (!res || res.status !== "OK") navigate("/invalid-reset");
      });
    } else {
      navigate("/invalid-reset");
    }
  }, []);

  return (
    <div className="py-10 md:py-40">
      <div>
        <div>
          <form
            className="max-w-xl bg-white shadow rounded-lg mx-auto"
            onSubmit={(e) => {
              handleSubmit(e);
            }}
          >
            <div className="text-xl font-bold py-4 text-center">
              {t("reset_password")}
            </div>
            <div className="px-4">
              <TextFormField
                type="password"
                name="password"
                placeholder={t("new_password")}
                onChange={handleChange}
                error={errors.password}
              />
              <CollapseV2 opened={passReg === 0}>
                <div className="mb-4 px-4">
                  <ul className="text-red-500 list-disc">
                    <li>{t("min_password_len_8")}</li>
                    <li>{t("req_atleast_one_digit")}</li>
                    <li>{t("req_atleast_one_uppercase")}</li>
                    <li>{t("req_atleast_one_lowercase")}</li>
                    <li>{t("req_atleast_one_symbol")}</li>
                  </ul>
                </div>
              </CollapseV2>
              <TextFormField
                type="password"
                name="confirm"
                placeholder={t("confirm_password")}
                onChange={handleChange}
                error={errors.confirm}
              />
              <ErrorHelperText error={errors.token} />
            </div>
            <div className="sm:flex sm:justify-between grid p-4">
              <Cancel onClick={() => navigate("/login")} />
              <Submit onClick={(e) => handleSubmit(e)} label="reset" />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
