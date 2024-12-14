import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Form from "@/components/Form/Form";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import { validateRule } from "@/components/Users/UserAddEditForm";
import { UpdatePasswordForm, UserModel } from "@/components/Users/models";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";

import ButtonV2 from "../Common/ButtonV2";

interface PasswordForm {
  username: string;
  old_password: string;
  new_password_1: string;
  new_password_2: string;
}

export default function UserResetPassword({
  userData,
}: {
  userData: UserModel;
}) {
  const { t } = useTranslation();
  const [isSubmitting, setisSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const initForm: PasswordForm = {
    username: userData.username,
    old_password: "",
    new_password_1: "",
    new_password_2: "",
  };

  const validateNewPassword = (password: string) => {
    if (
      password.length < 8 ||
      !/\d/.test(password) ||
      password === password.toUpperCase() ||
      password === password.toLowerCase()
    ) {
      return false;
    }
    return true;
  };

  const validateForm = (formData: PasswordForm) => {
    const errors: Partial<Record<keyof PasswordForm, string>> = {};

    if (!formData.old_password) {
      errors.old_password = t("please_enter_current_password");
    }

    if (!formData.new_password_1) {
      errors.new_password_1 = t("please_enter_new_password");
    } else if (!validateNewPassword(formData.new_password_1)) {
      errors.new_password_1 = t("new_password_validation");
    }

    if (!formData.new_password_2) {
      errors.new_password_2 = t("please_confirm_password");
    } else if (formData.new_password_1 !== formData.new_password_2) {
      errors.new_password_2 = t("password_mismatch");
    }

    if (formData.new_password_1 === formData.old_password) {
      errors.new_password_1 = t("new_password_same_as_old");
    }

    return errors;
  };

  const handleSubmit = async (formData: PasswordForm) => {
    setisSubmitting(true);
    const form: UpdatePasswordForm = {
      old_password: formData.old_password,
      username: userData.username,
      new_password: formData.new_password_1,
    };

    const { res, data, error } = await request(routes.updatePassword, {
      body: form,
    });

    if (res?.ok) {
      Notification.Success({ msg: data?.message });
    } else {
      Notification.Error({
        msg: error?.message ?? t("password_update_error"),
      });
    }
    setisSubmitting(false);
  };

  const renderPasswordForm = () => {
    return (
      <Form<PasswordForm>
        defaults={initForm}
        validate={validateForm}
        onSubmit={handleSubmit}
        resetFormValsOnCancel
        resetFormValsOnSubmit
        hideRestoreDraft
        noPadding
        disabled={isSubmitting}
        hideCancelButton
      >
        {(field) => (
          <div className="grid grid-cols-6 gap-4">
            <TextFormField
              {...field("old_password")}
              name="old_password"
              label={t("current_password")}
              className="col-span-6 sm:col-span-3"
              type="password"
              required
              aria-label={t("current_password")}
            />
            <div className="col-span-6 sm:col-span-3">
              <TextFormField
                {...field("new_password_1")}
                name="new_password_1"
                label={t("new_password")}
                type="password"
                className="peer col-span-6 sm:col-span-3"
                required
                aria-label={t("new_password")}
              />
              <div
                className="text-small mb-2 hidden pl-2 text-secondary-500 peer-focus-within:block"
                aria-live="polite"
              >
                {validateRule(
                  field("new_password_1").value?.length >= 8,
                  t("password_length_validation"),
                  !field("new_password_1").value,
                )}
                {validateRule(
                  field("new_password_1").value !==
                    field("new_password_1").value?.toUpperCase(),
                  t("password_lowercase_validation"),
                  !field("new_password_1").value,
                )}
                {validateRule(
                  field("new_password_1").value !==
                    field("new_password_1").value?.toLowerCase(),
                  t("password_uppercase_validation"),
                  !field("new_password_1").value,
                )}
                {validateRule(
                  /\d/.test(field("new_password_1").value ?? ""),
                  t("password_number_validation"),
                  !field("new_password_1").value,
                )}
              </div>
            </div>
            <div className="col-span-6 sm:col-span-3">
              <TextFormField
                {...field("new_password_2")}
                name="new_password_2"
                label={t("new_password_confirmation")}
                className="peer col-span-6 sm:col-span-3"
                type="password"
                required
                aria-label={t("new_password_confirmation")}
              />
              {field("new_password_2").value?.length > 0 && (
                <div
                  className="text-small mb-2 hidden pl-2 text-secondary-500 peer-focus-within:block"
                  aria-live="polite"
                >
                  {validateRule(
                    field("new_password_1").value ===
                      field("new_password_2").value,
                    t("password_mismatch"),
                    !field("new_password_2").value,
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Form>
    );
  };

  const editButton = () => (
    <div className="mb-4 flex justify-start">
      <ButtonV2
        onClick={() => setIsEditing(!isEditing)}
        type="button"
        id="change-edit-password-button"
        className="flex items-center gap-2 rounded-sm border border-gray-100 bg-white px-3 py-1.5 text-sm text-[#009D48] shadow-sm hover:bg-gray-50"
        shadow={false}
      >
        <CareIcon icon={isEditing ? "l-times" : "l-edit"} className="h-4 w-4" />
        {isEditing ? t("cancel") : t("change_password")}
      </ButtonV2>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:rounded-lg sm:px-6">
      {editButton()}
      {isEditing && renderPasswordForm()}
    </div>
  );
}
