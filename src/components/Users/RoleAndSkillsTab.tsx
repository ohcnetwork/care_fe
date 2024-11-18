import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import userColumns from "@/components/Common/UserColumns";
import LinkedSkills from "@/components/Users/LinkedSkills";
import UserQualifications from "@/components/Users/UserQualifications";
import { UserModel } from "@/components/Users/models";

import useAuthUser from "@/hooks/useAuthUser";

import * as Notification from "@/Utils/Notifications";
import { editUserPermissions } from "@/Utils/permissions";

type Props = {
  userData: UserModel;
  username: string;
};

export default function RoleAndSkillsTab(props: Props) {
  const { userData, username } = props;
  const { t } = useTranslation();
  const authUser = useAuthUser();
  const editPermissions = editUserPermissions(authUser, userData);

  if (!userData || !username) {
    Notification.Error({ msg: t("username_userdetails_not_found") });
    return <></>;
  } else if (!editPermissions) {
    Notification.Error({ msg: t("no_permission_to_view_page") });
    navigate("/users");
  }

  return (
    <>
      <div className="mt-10 flex flex-col gap-y-12">
        {userData.user_type &&
          ["Doctor", "Nurse"].includes(userData.user_type) &&
          userColumns(
            t("user_qualifications"),
            t("user_qualifications_note"),
            UserQualifications,
            props,
          )}
        {userColumns(
          t("linked_skills"),
          t("linked_skills_note"),
          LinkedSkills,
          props,
        )}
      </div>
    </>
  );
}
