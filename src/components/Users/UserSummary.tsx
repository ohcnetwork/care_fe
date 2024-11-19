import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import LanguageSelector from "@/components/Common/LanguageSelector";
import userColumns from "@/components/Common/UserColumns";
import UserDeleteDialog from "@/components/Users/UserDeleteDialog";
import UserInformation from "@/components/Users/UserInformation";
import UserResetPassword from "@/components/Users/UserResetPassword";
import { UserModel } from "@/components/Users/models";

import useAuthUser from "@/hooks/useAuthUser";

import * as Notification from "@/Utils/Notifications";
import { showUserDelete, showUserPasswordReset } from "@/Utils/permissions";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";

export default function UserSummaryTab({ userData }: { userData?: UserModel }) {
  const { t } = useTranslation();
  const [showDeleteDialog, setshowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const authUser = useAuthUser();

  if (!userData) {
    return;
  }

  const handleSubmit = async () => {
    setIsDeleting(true);
    const { res, error } = await request(routes.deleteUser, {
      pathParams: { username: userData.username },
    });
    setIsDeleting(false);
    if (res?.status === 204) {
      Notification.Success({
        msg: "User deleted successfully",
      });
      setshowDeleteDialog(!showDeleteDialog);
      navigate("/users");
    } else {
      Notification.Error({
        msg: "Error while deleting User: " + (error || ""),
      });
      setshowDeleteDialog(!showDeleteDialog);
    }
  };

  const userColumnsData = { userData, username: userData.username };
  const deletePermitted = showUserDelete(authUser, userData);
  const passwordResetPermitted = showUserPasswordReset(authUser, userData);

  return (
    <>
      {showDeleteDialog && (
        <UserDeleteDialog
          name={userData.username}
          handleOk={handleSubmit}
          handleCancel={() => {
            setshowDeleteDialog(false);
          }}
        />
      )}
      <div className="mt-10 flex flex-col gap-y-12">
        {userColumns(
          t("personal_information"),
          authUser.username === userData.username
            ? t("personal_information_note_self")
            : t("personal_information_note"),
          UserInformation,
          userColumnsData,
        )}
        {passwordResetPermitted &&
          userColumns(
            t("reset_password"),
            authUser.username === userData.username
              ? t("reset_password_note_self")
              : t("reset_password_note"),
            UserResetPassword,
            userColumnsData,
          )}
        {authUser.username === userData.username &&
          userColumns(
            t("language_selection"),
            t("set_your_local_language"),
            LanguageSelector,
            userColumnsData,
          )}
        {deletePermitted && (
          <div className="mt-3 flex flex-col items-center gap-5 border-t-2 pt-5 sm:flex-row">
            <div className="sm:w-1/4">
              <div className="my-1 text-sm leading-5">
                <p className="mb-2 font-semibold">{t("delete_account")}</p>
                <p className="text-secondary-600">{t("delete_account_note")}</p>
              </div>
            </div>
            <div className="w-3/4">
              <ButtonV2
                authorizeFor={() => deletePermitted}
                onClick={() => setshowDeleteDialog(true)}
                variant="danger"
                data-testid="user-delete-button"
                className="my-1 inline-flex"
                disabled={isDeleting}
              >
                <CareIcon icon="l-trash" className="h-4" />
                <span className="">{t("delete_account_btn")}</span>
              </ButtonV2>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
