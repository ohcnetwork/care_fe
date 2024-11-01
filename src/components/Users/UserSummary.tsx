import { useTranslation } from "react-i18next";
import UserResetPassword from "./UserResetPassword";
import UserInformation from "./UserInformation";
import { useState } from "react";
import routes from "@/Redux/api";
import CareIcon from "@/CAREUI/icons/CareIcon";
import useAppHistory from "@/common/hooks/useAppHistory";
import useAuthUser from "@/common/hooks/useAuthUser";
import { showUserDelete } from "@/Utils/permissions";
import request from "@/Utils/request/request";
import UserDeleteDialog from "./UserDeleteDialog";
import * as Notification from "../../Utils/Notifications";
import { UserModel } from "./models";
import ButtonV2 from "../Common/components/ButtonV2";

export default function UserSummaryTab({ userData }: { userData?: UserModel }) {
  const { t } = useTranslation();
  const [showDeleteDialog, setshowDeleteDialog] = useState(false);
  const authUser = useAuthUser();
  const { goBack } = useAppHistory();

  if (!userData) {
    return;
  }

  const handleSubmit = async () => {
    const { res, error } = await request(routes.deleteUser, {
      pathParams: { username: userData.username },
    });
    if (res?.status === 204) {
      Notification.Success({
        msg: "User deleted successfully",
      });
    } else {
      Notification.Error({
        msg: "Error while deleting User: " + (error || ""),
      });
    }
    setshowDeleteDialog(!showDeleteDialog);
    goBack();
  };

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
        <div className="flex flex-col gap-5 sm:flex-row">
          <div className="sm:w-1/4">
            <p className="my-1 text-sm leading-5">
              <p className="mb-2 font-semibold">{t("personal_information")}</p>
              <p className="text-secondary-600">
                {t("personal_information_note")}
              </p>
            </p>
          </div>
          <div className="sm:w-3/4">
            <UserInformation username={userData.username} />
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-5 sm:flex-row">
          <div className="sm:w-1/4">
            <p className="my-1 text-sm leading-5">
              <p className="mb-2 font-semibold">{t("reset_password")}</p>
              <p className="text-secondary-600">{t("reset_password_note")}</p>
            </p>
          </div>
          <div className="sm:w-3/4">
            <UserResetPassword />
          </div>
        </div>

        <div className="mt-3 flex flex-col items-center gap-5 border-t-2 pt-5 sm:flex-row">
          <div className="sm:w-1/4">
            <p className="my-1 text-sm leading-5">
              <p className="mb-2 font-semibold">{t("delete_account")}</p>
              <p className="text-secondary-600">{t("delete_account_note")}</p>
            </p>
          </div>
          <div className="w-3/4">
            <ButtonV2
              authorizeFor={() => showUserDelete(authUser, userData)}
              onClick={() => setshowDeleteDialog(true)}
              variant="danger"
              data-testid="user-delete-button"
              className="my-1 inline-flex"
            >
              <CareIcon icon="l-trash" className="h-4" />
              <span className="">{t("delete_account_btn")}</span>
            </ButtonV2>
          </div>
        </div>
      </div>
    </>
  );
}
