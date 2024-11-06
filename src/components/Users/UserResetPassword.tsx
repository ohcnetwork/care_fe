import { useState } from "react";
import * as Notification from "../../Utils/Notifications";
import TextFormField from "../Form/FormFields/TextFormField";
import { Submit } from "@/components/Common/components/ButtonV2";
import { UpdatePasswordForm } from "./models";
import useAuthUser from "@/common/hooks/useAuthUser";
import routes from "../../Redux/api";
import request from "../../Utils/request/request";
import { validateRule } from "./UserAddEditForm";
import { useTranslation } from "react-i18next";

export default function UserResetPassword() {
  const { t } = useTranslation();
  const authUser = useAuthUser();

  const [changePasswordForm, setChangePasswordForm] = useState<{
    username: string;
    old_password: string;
    new_password_1: string;
    new_password_2: string;
  }>({
    username: authUser.username,
    old_password: "",
    new_password_1: "",
    new_password_2: "",
  });

  const [changePasswordErrors] = useState<{
    old_password: string;
    password_confirmation: string;
  }>({
    old_password: "",
    password_confirmation: "",
  });

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

  const changePassword = async (e: any) => {
    e.preventDefault();
    //validating form
    if (
      changePasswordForm.new_password_1 !== changePasswordForm.new_password_2
    ) {
      Notification.Error({
        msg: "Passwords are different in new password and confirmation password column.",
      });
    } else if (!validateNewPassword(changePasswordForm.new_password_1)) {
      Notification.Error({
        msg: "Entered New Password is not valid, please check!",
      });
    } else if (
      changePasswordForm.new_password_1 === changePasswordForm.old_password
    ) {
      Notification.Error({
        msg: "New password is same as old password, Please enter a different new password.",
      });
    } else {
      const form: UpdatePasswordForm = {
        old_password: changePasswordForm.old_password,
        username: authUser.username,
        new_password: changePasswordForm.new_password_1,
      };
      const { res, data, error } = await request(routes.updatePassword, {
        body: form,
      });
      if (res?.ok) {
        Notification.Success({ msg: data?.message });
      } else if (!error) {
        Notification.Error({
          msg: "There was some error. Please try again in some time.",
        });
      }
      setChangePasswordForm({
        ...changePasswordForm,
        new_password_1: "",
        new_password_2: "",
        old_password: "",
      });
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:rounded-lg sm:px-6">
        <div className="space-y-4">
          <form action="#" method="POST">
            <div className="grid grid-cols-6 gap-4">
              <TextFormField
                name="old_password"
                label={t("current_password")}
                className="col-span-6 sm:col-span-3"
                type="password"
                value={changePasswordForm.old_password}
                onChange={(e) =>
                  setChangePasswordForm({
                    ...changePasswordForm,
                    old_password: e.value,
                  })
                }
                error={changePasswordErrors.old_password}
                required
              />
              <div className="col-span-6 sm:col-span-3">
                <TextFormField
                  name="new_password_1"
                  label={t("new_password")}
                  type="password"
                  value={changePasswordForm.new_password_1}
                  className="peer col-span-6 sm:col-span-3"
                  onChange={(e) => {
                    setChangePasswordForm({
                      ...changePasswordForm,
                      new_password_1: e.value,
                    });
                  }}
                  required
                />
                <div className="text-small mb-2 hidden pl-2 text-secondary-500 peer-focus-within:block">
                  {validateRule(
                    changePasswordForm.new_password_1?.length >= 8,
                    "Password should be atleast 8 characters long",
                  )}
                  {validateRule(
                    changePasswordForm.new_password_1 !==
                      changePasswordForm.new_password_1.toUpperCase(),
                    "Password should contain at least 1 lowercase letter",
                  )}
                  {validateRule(
                    changePasswordForm.new_password_1 !==
                      changePasswordForm.new_password_1.toLowerCase(),
                    "Password should contain at least 1 uppercase letter",
                  )}
                  {validateRule(
                    /\d/.test(changePasswordForm.new_password_1),
                    "Password should contain at least 1 number",
                  )}
                </div>
              </div>
              <div className="col-span-6 sm:col-span-3">
                <TextFormField
                  name="new_password_2"
                  label={t("new_password_confirmation")}
                  className="peer col-span-6 sm:col-span-3"
                  type="password"
                  value={changePasswordForm.new_password_2}
                  onChange={(e) => {
                    setChangePasswordForm({
                      ...changePasswordForm,
                      new_password_2: e.value,
                    });
                  }}
                />
                {changePasswordForm.new_password_2.length > 0 && (
                  <div className="text-small mb-2 hidden pl-2 text-secondary-500 peer-focus-within:block">
                    {validateRule(
                      changePasswordForm.new_password_1 ===
                        changePasswordForm.new_password_2,
                      "Confirm password should match the new password",
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="px-4 py-3 text-right sm:px-6">
              <Submit onClick={changePassword} label={t("change_password")} />
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
