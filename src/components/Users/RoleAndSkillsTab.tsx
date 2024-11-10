import { useTranslation } from "react-i18next";

import userColumns from "@/components/Common/UserColumns";
import LinkedSkills from "@/components/Users/LinkedSkills";
import { UserModel } from "@/components/Users/models";

import UserRoles from "./UserRoles";

type Props = {
  userData: UserModel;
  username: string;
};

export default function RoleAndSkillsTab(props: Props) {
  const { userData, username } = props;
  const { t } = useTranslation();

  if (!userData || !username) {
    return;
  }

  return (
    <>
      <div className="mt-10 flex flex-col gap-y-12">
        {userData.user_type &&
          ["Doctor", "Nurse"].includes(userData.user_type) &&
          userColumns(t("user_role"), t("user_role_note"), UserRoles, props)}
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
